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

    const fileData: FileUploadResponse = await uploadResponse.json();

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

      const file: FileStatusResponse = await response.json();

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
        response_schema: schema
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
DOCUMENT TYPE DETECTION:
First, identify if this is an invoice, receipt, credit note, or other financial document.
Set the document_type field accordingly.

NUMBER FORMATTING:
- Extract monetary values exactly as shown
- Convert to use period (.) as decimal separator
- Provide all numbers in minor units (cents)
- For percentages, convert to integer values (20% = 20)

COUNTERPARTY vs RECIPIENT:
- Counterparty: The supplier/merchant/sender (who issued the document)
- Recipient: The customer/buyer (who receives the document)
- For receipts, usually only counterparty (merchant) is present

LINE ITEMS:
- Extract ALL line items from the document
- Check all pages for multi-page documents
- Do NOT extract loyalty cards, cashier numbers, or marketing messages

DATES:
- Use ISO 8601 format for receipts with time
- Use YYYY-MM-DD for invoice dates
- due_date only applies to invoices

If any field can't be recognized, return null.
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

    const content = candidate.content?.parts?.[0]?.text;

    if (!content) {
      throw new GeminiAPIError('No content in response', 500, false);
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new GeminiAPIError(
        `Failed to parse response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        false
      );
    }
  }
}
