/**
 * Gemini API Service
 * Handles communication with Google's Gemini API for OCR
 */

import fetch from 'node-fetch';
import { env } from '../config/env.js';

export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

interface FileUploadResponse {
  file: {
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: string;
    createTime: string;
    updateTime: string;
    expirationTime: string;
    sha256Hash: string;
    uri: string;
    state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  };
}

interface FileStatusResponse {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
  };
}

export class GeminiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = env.GEMINI_API_URL;
    this.apiKey = env.GEMINI_API_KEY;
    this.model = env.GEMINI_MODEL;
  }

  /**
   * Upload file to Gemini Files API
   */
  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    displayName: string
  ): Promise<FileUploadResponse['file']> {
    // Step 1: Initiate resumable upload
    const initResponse = await fetch(`${this.baseUrl}/upload/v1beta/files`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'X-goog-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: { display_name: displayName }
      })
    });

    if (!initResponse.ok) {
      const error = await initResponse.json().catch(() => ({}));
      throw new GeminiAPIError(
        `Upload initiation failed: ${initResponse.statusText}`,
        initResponse.status,
        initResponse.status >= 500
      );
    }

    const uploadUrl = initResponse.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      throw new GeminiAPIError('No upload URL received', 500, true);
    }

    // Step 2: Upload file content
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize'
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({}));
      throw new GeminiAPIError(
        `File upload failed: ${uploadResponse.statusText}`,
        uploadResponse.status,
        uploadResponse.status >= 500
      );
    }

    const fileData: FileUploadResponse = await uploadResponse.json() as any;

    // Step 3: Wait for file to be active
    const activeFile = await this.waitForFileActive(fileData.file.name);

    return activeFile;
  }

  /**
   * Wait for uploaded file to be processed and active
   */
  private async waitForFileActive(
    fileName: string,
    maxAttempts: number = 10,
    delayMs: number = 2000
  ): Promise<FileStatusResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.baseUrl}/v1beta/${fileName}`, {
        headers: { 'X-goog-api-key': this.apiKey }
      });

      if (!response.ok) {
        throw new GeminiAPIError(
          `Failed to check file status: ${response.statusText}`,
          response.status,
          response.status >= 500
        );
      }

      const file: FileStatusResponse = await response.json() as any;

      if (file.state === 'ACTIVE') {
        return file;
      }

      if (file.state === 'FAILED') {
        throw new GeminiAPIError('File processing failed', 500, false);
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new GeminiAPIError('File processing timeout', 504, true);
  }

  /**
   * Extract document data using Gemini
   */
  async extractDocument(
    fileUri: string,
    mimeType: string,
    documentType: 'invoice' | 'receipt' | 'document',
    schema: any,
    customPrompt?: string
  ): Promise<any> {
    const prompt = customPrompt || this.buildPrompt(documentType);

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              file_data: {
                mime_type: mimeType,
                file_uri: fileUri
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: schema,
        temperature: 0.2,
        maxOutputTokens: 4096 // Limit output to prevent truncation
      }
    };

    const response = await fetch(
      `${this.baseUrl}/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      const errorMessage = error.error?.message || response.statusText;
      throw new GeminiAPIError(
        `Gemini API error: ${errorMessage}`,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    return response.json();
  }

  /**
   * Build prompt based on document type
   */
  private buildPrompt(documentType: 'invoice' | 'receipt' | 'document'): string {
    const basePrompt = `Extract information from this document. All data must be extracted with maximum accuracy, as this document is financial. All extracted figures must be consistent with each other.`;

    const typeSpecificPrompts = {
      document: `
You MUST extract these REQUIRED fields from the document:

1. document_type: "invoice" or "receipt"
2. document_number: Look for invoice/receipt number (e.g., "F232415" near "Factura"/"Invoice")
3. date: Document date in YYYY-MM-DD format
4. counterparty.name: Vendor/company name from document header
5. counterparty.vat_number: NIF/CIF (format: Letter+7-8 digits, e.g., "G01670009")
6. total_amount: Total in cents (multiply € by 100)
7. subtotal: Amount before tax in cents
8. tax_amount: Total VAT amount in cents (sum of all tax bands)

9. CRITICAL - tax_breakdown: Extract the COMPLETE IVA/VAT breakdown table AS AN ARRAY.

   STEP-BY-STEP PROCESS FOR READING THE VAT TABLE:

   1. Find the VAT breakdown table (usually labeled "Desglose IVA", "IVA", or similar)
   2. The table has columns like: Base Imponible | % IVA | Cuota
   3. Read the table ROW BY ROW from top to bottom
   4. For EACH ROW, you must keep the three values together:
      - The percentage/rate from that row
      - The base amount from that SAME row
      - The tax amount from that SAME row

   CRITICAL: All three values in each JSON object MUST come from the SAME table row!

   Example table:
   | Base Imponible | % IVA | Cuota   |
   |---------------|-------|---------|
   | 12,75 €       | 21%   | 2,68 €  |  <- Row 1
   | 21,66 €       | 10%   | 2,17 €  |  <- Row 2
   | 5,14 €        | 5%    | 0,26 €  |  <- Row 3
   | 20,42 €       | 0%    | 0,00 €  |  <- Row 4

   Correct extraction (each object uses values from ONE row):
   [
     {"tax_rate": 21, "tax_base": 1275, "tax_amount": 268},   <- All from Row 1
     {"tax_rate": 10, "tax_base": 2166, "tax_amount": 217},   <- All from Row 2
     {"tax_rate": 5, "tax_base": 514, "tax_amount": 26},      <- All from Row 3
     {"tax_rate": 0, "tax_base": 2042, "tax_amount": 0}       <- All from Row 4
   ]

   CRITICAL RULES:
   - Read each table row LEFT to RIGHT
   - Keep all values from the same row together in one JSON object
   - tax_rate = the percentage column value (21, 10, 5, 0, etc.)
   - tax_base = the base amount from THAT SAME ROW (in cents)
   - tax_amount = the cuota from THAT SAME ROW (in cents)
   - Do NOT mix values from different rows
   - Do NOT skip any rows, including 0% exempt rates
   - Do NOT include the totals/summary row

10. line_items: Array of products/services with:
   - description (text)
   - quantity (number)
   - subtotal (cents)
   - tax_rate (percentage, e.g., 21)
   - total (cents)

CRITICAL: Extract ALL visible line items AND the complete VAT breakdown table.
AMOUNTS: Multiply all euro amounts by 100 to get cents.
NIF/CIF: Extract ONLY the valid ID (Letter + 7-8 digits), ignore extra numbers.
VAT TABLE: Look for tables with headers like "Base Imponible", "% IVA", "Cuota", "Base", "Type", "Tax", etc.
`,
      invoice: `
GERMAN INVOICE TERMINOLOGY - IMPORTANT:
For German invoices, be careful not to confuse:
- "Zwischensumme" = partial/intermediate amount (NOT the final total to extract)
- "Ihre Kosten" = total allocated costs (extract as total_excl_vat)
- "Ihre Nachzahlung" = final amount still owed (extract as total_inc_vat)
- "Summe Ihrer Zahlungen" = already paid (extract as amount_paid)

NUMBER FORMATTING:
- Extract monetary values exactly as shown
- Convert to use period (.) as decimal separator
- Provide all numbers in minor units (cents)
- For percentages, convert to integer values (20% = 20)

LINE ITEMS:
- Extract ALL line items from the document
- Some invoices span multiple pages - ensure all items are extracted
- Validate: quantity × unit_price should equal line_total

If any field can't be recognized, return null instead of an empty string.
`,
      receipt: `
Extract detailed information from this receipt.

LINE ITEMS RULES:
Only extract actual purchased items with prices. Do NOT extract:
- Loyalty card numbers
- Cashier/operator numbers
- Transaction numbers
- Marketing messages
- Coupon codes without associated products

NUMBER FORMATTING:
- All amounts in the original currency
- Convert commas to periods for decimals
- For line items, quantity defaults to 1.0 if not specified

Populate 'description' field with a short user-relevant summary (e.g., "Dinner in London", "Groceries purchase").
`
    };

    return basePrompt + (typeSpecificPrompts[documentType] || '');
  }

  /**
   * Delete file from Gemini Files API
   */
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1beta/${fileName}`, {
        method: 'DELETE',
        headers: { 'X-goog-api-key': this.apiKey }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Parse Gemini API response
   */
  parseResponse(response: GeminiResponse): any {
    if (!response.candidates || response.candidates.length === 0) {
      throw new GeminiAPIError('No response from model', 500, false);
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason === 'SAFETY') {
      throw new GeminiAPIError('Content filtered for safety reasons', 400, false);
    }

    if (candidate.finishReason === 'RECITATION') {
      throw new GeminiAPIError('Content filtered due to recitation', 400, false);
    }

    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('Response was truncated due to max tokens. Retrying with shorter prompt...');
      throw new GeminiAPIError('Response truncated - try with smaller document', 400, true);
    }

    const content = candidate.content?.parts?.[0]?.text;

    if (!content) {
      throw new GeminiAPIError('No content in response', 500, false);
    }

    try {
      // Try to parse as-is first
      return JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content preview:', content.substring(0, 500));
      console.error('Content end:', content.substring(content.length - 500));

      // Try to fix common JSON issues
      try {
        // Remove trailing commas before closing braces/brackets
        let fixedContent = content
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/\\'/g, "'")
          .trim();

        // Ensure content ends with closing brace
        if (!fixedContent.endsWith('}')) {
          fixedContent += '}';
        }

        return JSON.parse(fixedContent);
      } catch (secondError) {
        throw new GeminiAPIError(
          `Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          500,
          true // Make it retryable
        );
      }
    }
  }
}
