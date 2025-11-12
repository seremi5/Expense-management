/**
 * Unified Document Schema for OCR
 * Handles invoices, receipts, credit notes, and other financial documents
 */

export const unifiedDocumentSchema = {
  type: 'object',
  properties: {
    // Document Classification
    document_type: {
      type: ['string', 'null'],
      enum: ['invoice', 'receipt', 'credit_note', 'other', null],
      description: 'Type of financial document detected'
    },

    // Document Reference
    document_number: {
      type: ['string', 'null'],
      description: 'Document reference number (invoice number, receipt number, etc.)'
    },

    // Dates
    date: {
      type: ['string', 'null'],
      description: 'Document date in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ)'
    },
    due_date: {
      type: ['string', 'null'],
      description: 'Payment due date. Format: YYYY-MM-DD. Null if not applicable (receipts).'
    },

    // Amounts (in minor units - cents)
    total_amount: {
      type: ['integer', 'null'],
      description: 'Total amount including tax in minor units (cents). Primary amount field.'
    },
    subtotal: {
      type: ['integer', 'null'],
      description: 'Subtotal before tax in minor units'
    },
    tax_amount: {
      type: ['integer', 'null'],
      description: 'Total tax/VAT amount in minor units'
    },
    tax_rate: {
      type: ['number', 'null'],
      description: 'Tax percentage (e.g., 20 for 20% VAT)'
    },
    amount_paid: {
      type: ['integer', 'null'],
      description: 'Amount already paid in minor units. For invoices with prepayments.'
    },
    discount: {
      type: ['integer', 'null'],
      description: 'Total discount amount in minor units'
    },

    // Currency
    currency: {
      type: ['string', 'null'],
      description: 'ISO 4217 currency code (EUR, USD, etc.). Infer from symbol if not explicit.'
    },

    // Counterparty (Supplier/Merchant/Sender)
    counterparty: {
      type: ['object', 'null'],
      properties: {
        name: {
          type: ['string', 'null'],
          description: 'Name of supplier, merchant, or sender'
        },
        vat_number: {
          type: ['string', 'null'],
          description: 'VAT/Tax ID number if present'
        },
        tax_id: {
          type: ['string', 'null'],
          description: 'Alternative tax identification'
        },
        email: {
          type: ['string', 'null']
        },
        phone: {
          type: ['string', 'null']
        },
        iban: {
          type: ['string', 'null'],
          description: 'Bank account IBAN for payments'
        },
        account_number: {
          type: ['string', 'null'],
          description: 'Bank account number'
        },
        swift_bic: {
          type: ['string', 'null'],
          description: 'SWIFT/BIC code'
        },
        address: {
          type: ['object', 'null'],
          properties: {
            street: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            postal_code: { type: ['string', 'null'] },
            state: { type: ['string', 'null'] },
            country: {
              type: ['string', 'null'],
              description: 'ISO 3166-1 alpha-2 country code'
            }
          }
        }
      }
    },

    // Recipient (for invoices)
    recipient: {
      type: ['object', 'null'],
      properties: {
        name: { type: ['string', 'null'] },
        vat_number: { type: ['string', 'null'] },
        tax_id: { type: ['string', 'null'] },
        email: { type: ['string', 'null'] },
        address: {
          type: ['object', 'null'],
          properties: {
            street: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            postal_code: { type: ['string', 'null'] },
            state: { type: ['string', 'null'] },
            country: { type: ['string', 'null'] }
          }
        }
      }
    },

    // Line Items
    line_items: {
      type: 'array',
      description: 'Extract ALL line items from the document. Check all pages.',
      items: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Product or service description'
          },
          quantity: {
            type: 'number',
            description: 'Quantity. Defaults to 1 if not specified.'
          },
          unit_price: {
            type: ['integer', 'null'],
            description: 'Price per unit in minor units (cents)'
          },
          unit: {
            type: ['string', 'null'],
            description: 'Unit of measurement (pieces, hours, kg, etc.)'
          },
          subtotal: {
            type: ['integer', 'null'],
            description: 'Line item subtotal before tax in minor units'
          },
          total: {
            type: ['integer', 'null'],
            description: 'Line item total including tax in minor units'
          },
          tax_rate: {
            type: ['number', 'null'],
            description: 'Tax percentage for this item'
          },
          tax_amount: {
            type: ['integer', 'null'],
            description: 'Tax amount for this line in minor units'
          }
        },
        required: ['description', 'quantity']
      }
    },

    // Additional Fields
    payment_terms: {
      type: ['string', 'null'],
      description: 'Payment terms code (NET 30, 2/10 Net 30, etc.)'
    },
    notes: {
      type: ['string', 'null'],
      description: 'Any additional notes or comments on the document'
    },
    description: {
      type: ['string', 'null'],
      description: 'Short user-relevant summary for receipts (e.g., "Dinner in London", "Taxi ride")'
    },
    language: {
      type: ['string', 'null'],
      description: 'Document language (ISO 639 code)'
    }
  },
  required: []
} as const;

export type UnifiedDocument = {
  document_type: 'invoice' | 'receipt' | 'credit_note' | 'other' | null;
  document_number: string | null;
  date: string | null;
  due_date: string | null;
  total_amount: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  amount_paid: number | null;
  discount: number | null;
  currency: string | null;
  counterparty: {
    name: string | null;
    vat_number: string | null;
    tax_id: string | null;
    email: string | null;
    phone: string | null;
    iban: string | null;
    account_number: string | null;
    swift_bic: string | null;
    address: {
      street: string | null;
      city: string | null;
      postal_code: string | null;
      state: string | null;
      country: string | null;
    } | null;
  } | null;
  recipient: {
    name: string | null;
    vat_number: string | null;
    tax_id: string | null;
    email: string | null;
    address: {
      street: string | null;
      city: string | null;
      postal_code: string | null;
      state: string | null;
      country: string | null;
    } | null;
  } | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number | null;
    unit: string | null;
    subtotal: number | null;
    total: number | null;
    tax_rate: number | null;
    tax_amount: number | null;
  }>;
  payment_terms: string | null;
  notes: string | null;
  description: string | null;
  language: string | null;
};
