/**
 * JSON Schema for Receipt extraction with Gemini API
 */

export const receiptSchema = {
  type: 'object',
  properties: {
    document_reference: {
      type: ['string', 'null'],
      description: 'The receipt document number. Extract only if explicitly stated in the document.'
    },
    currency: {
      type: ['string', 'null'],
      description: 'ISO 4217 formatted currency code in uppercase. If not explicitly given, infer from symbol.'
    },
    date: {
      type: ['string', 'null'],
      description: 'Date and time of purchase. Formatted in ISO 8601 format. If only date provided, return time as 00:00:00.'
    },
    amount: {
      type: 'number',
      description: 'Total amount including taxes'
    },
    subtotal: {
      type: ['number', 'null'],
      description: 'Subtotal amount before taxes'
    },
    tax: {
      type: ['number', 'null'],
      description: 'Tax percentage (e.g., 20 for 20% VAT). Extract only if explicitly stated. If multiple tax rates, return the highest one.'
    },
    tax_amount: {
      type: ['number', 'null'],
      description: 'Total tax amount. Extract only if explicitly stated'
    },
    tax_type: {
      type: ['string', 'null'],
      description: 'The text representation of the tax type as stated in the receipt, in uppercase (e.g., VAT, IVA, etc.)'
    },
    discount: {
      type: ['number', 'null'],
      description: 'Total discount'
    },
    description: {
      type: ['string', 'null'],
      description: 'Short, user-relevant summary of the purchase context that reflects the purchase category. Leave empty if meaningful description cannot be inferred.'
    },

    // Sender/Merchant information
    sender: {
      type: ['object', 'null'],
      properties: {
        name: {
          type: ['string', 'null'],
          description: 'Name of the merchant/seller'
        },
        vat_number: {
          type: ['string', 'null']
        },
        tax_reference: {
          type: ['string', 'null']
        },
        email: {
          type: ['string', 'null']
        },
        address: {
          type: ['object', 'null'],
          properties: {
            street_and_number: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            postal_code: { type: ['string', 'null'] },
            country: {
              type: ['string', 'null'],
              description: 'Country code in ISO 3166-1 alpha-2 format'
            },
            state: { type: ['string', 'null'] }
          }
        }
      }
    },

    // Line items
    line_items: {
      type: 'array',
      description: 'Individual items listed on the receipt. DO NOT extract loyalty card numbers, cashier numbers, transaction IDs, or marketing messages.',
      items: {
        type: 'object',
        properties: {
          line_reference: {
            type: ['string', 'null'],
            description: 'Line item reference number from document'
          },
          name: {
            type: 'string',
            description: 'Name or title of the item'
          },
          description: {
            type: ['string', 'null'],
            description: 'Detailed description of the item'
          },
          quantity: {
            type: 'number',
            description: 'Quantity of items, defaults to 1.0 if not specified'
          },
          unit_price: {
            type: ['number', 'null'],
            description: 'Price per unit'
          },
          unit: {
            type: ['string', 'null'],
            description: 'Unit of measurement (pieces, hours, etc.)'
          },
          subtotal: {
            type: ['number', 'null'],
            description: 'Subtotal for this line item before tax'
          },
          tax: {
            type: ['number', 'null'],
            description: 'Tax percentage for this line item'
          },
          tax_amount: {
            type: ['number', 'null'],
            description: 'Tax amount for this line item'
          },
          total: {
            type: 'number',
            description: 'Total amount including tax for this line item'
          },
          discount: {
            type: ['number', 'null'],
            description: 'Total discount for this line item'
          }
        },
        required: ['name', 'total']
      }
    }
  },
  required: ['amount']
} as const;

export type ReceiptExtraction = {
  document_reference: string | null;
  currency: string | null;
  date: string | null;
  amount: number;
  subtotal: number | null;
  tax: number | null;
  tax_amount: number | null;
  tax_type: string | null;
  discount: number | null;
  description: string | null;
  sender: {
    name: string | null;
    vat_number: string | null;
    tax_reference: string | null;
    email: string | null;
    address: {
      street_and_number: string | null;
      city: string | null;
      postal_code: string | null;
      country: string | null;
      state: string | null;
    } | null;
  } | null;
  line_items: Array<{
    line_reference: string | null;
    name: string;
    description: string | null;
    quantity: number;
    unit_price: number | null;
    unit: string | null;
    subtotal: number | null;
    tax: number | null;
    tax_amount: number | null;
    total: number;
    discount: number | null;
  }>;
};
