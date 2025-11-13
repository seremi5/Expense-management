/**
 * Unified Document Schema for OCR
 * Handles invoices, receipts, credit notes, and other financial documents
 */

export const unifiedDocumentSchema = {
  type: 'OBJECT',
  properties: {
    document_type: {
      type: 'STRING',
      enum: ['invoice', 'receipt', 'credit_note', 'other'],
      description: 'REQUIRED: Type of document'
    },
    document_number: {
      type: 'STRING',
      description: 'REQUIRED: Invoice/document number (e.g., F232415, INV-001)'
    },
    date: {
      type: 'STRING',
      description: 'REQUIRED: Document date (format: YYYY-MM-DD)'
    },
    total_amount: {
      type: 'INTEGER',
      description: 'REQUIRED: Total amount in cents (including tax)'
    },
    subtotal: {
      type: 'INTEGER',
      description: 'REQUIRED: Subtotal in cents (before tax)'
    },
    tax_amount: {
      type: 'INTEGER',
      description: 'Total VAT/tax amount in cents (sum of all tax bands)'
    },
    tax_rate: {
      type: 'NUMBER',
      description: 'Tax percentage (e.g., 21 for 21%) - only if single rate'
    },
    tax_breakdown: {
      type: 'ARRAY',
      description: 'IMPORTANT: Extract the complete IVA/VAT breakdown table. Spanish receipts show: Base Imponible + % IVA + Cuota. Extract ALL rows.',
      items: {
        type: 'OBJECT',
        properties: {
          tax_rate: {
            type: 'NUMBER',
            description: 'VAT percentage (e.g., 21, 10, 5, 4, 0)'
          },
          tax_base: {
            type: 'INTEGER',
            description: 'Tax base amount in cents (Base Imponible)'
          },
          tax_amount: {
            type: 'INTEGER',
            description: 'Tax amount in cents (Cuota IVA)'
          }
        },
        required: ['tax_rate', 'tax_base', 'tax_amount']
      }
    },
    currency: {
      type: 'STRING',
      description: 'Currency code (EUR, USD, etc.)'
    },

    counterparty: {
      type: 'OBJECT',
      description: 'REQUIRED: Vendor/supplier information',
      properties: {
        name: {
          type: 'STRING',
          description: 'REQUIRED: Vendor company name from document header'
        },
        vat_number: {
          type: 'STRING',
          description: 'VAT/NIF/CIF number (format: Letter+7-8 digits)'
        }
      },
      required: ['name']
    },
    line_items: {
      type: 'ARRAY',
      description: 'Extract line items from invoice/receipt (products/services)',
      items: {
        type: 'OBJECT',
        properties: {
          description: {
            type: 'STRING',
            description: 'Item/service description'
          },
          quantity: {
            type: 'NUMBER',
            description: 'Quantity (default 1)'
          },
          subtotal: {
            type: 'INTEGER',
            description: 'Line subtotal in cents (before tax)'
          },
          tax_rate: {
            type: 'NUMBER',
            description: 'VAT/tax percentage (e.g., 21 for 21%)'
          },
          total: {
            type: 'INTEGER',
            description: 'Line total in cents (including tax)'
          }
        },
        required: ['description']
      }
    }
  },
  required: ['document_type', 'document_number', 'date', 'counterparty', 'total_amount', 'subtotal']
} as const;

export type UnifiedDocument = {
  document_type: 'invoice' | 'receipt' | 'credit_note' | 'other' | null;
  document_number: string | null;
  date: string | null;
  total_amount: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  tax_breakdown?: Array<{
    tax_rate: number;
    tax_base: number;
    tax_amount: number;
  }>;
  currency: string | null;
  counterparty: {
    name: string | null;
    vat_number: string | null;
  } | null;
  line_items: Array<{
    description: string;
    quantity: number;
    subtotal: number | null;
    tax_rate: number | null;
    total: number | null;
  }>;
};
