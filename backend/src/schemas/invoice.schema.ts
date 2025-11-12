/**
 * JSON Schema for Invoice extraction with Gemini API
 * Based on BAML prompts from /Users/sergireina/Downloads/ocr prompts.txt
 */

export const invoiceSchema = {
  type: 'object',
  properties: {
    invoice_number: {
      type: ['string', 'null'],
      description: 'Invoice reference number'
    },
    invoice_date: {
      type: ['string', 'null'],
      description: 'Invoice issue date. Formatted to YYYY-MM-DD'
    },
    due_date: {
      type: ['string', 'null'],
      description: 'Deadline date by which the invoice must be paid. Formatted to YYYY-MM-DD'
    },
    currency: {
      type: ['string', 'null'],
      description: 'ISO 4217 formatted currency code. If the code is not explicitly given, infer it from the symbol. If the result is not a valid ISO 4217 code, return null'
    },

    // Supplier information
    supplier_name: {
      type: ['string', 'null'],
      description: 'Name of the company issued the invoice. Extract the value exactly as it appears in the invoice without any formatting.'
    },
    supplier_vat: {
      type: ['string', 'null'],
      description: 'Supplier VAT ID number. Only if explicitly stated, otherwise null'
    },
    supplier_taxid: {
      type: ['string', 'null']
    },
    supplier_iban: {
      type: ['string', 'null'],
      description: 'Standardized format for identifying bank accounts internationally'
    },
    supplier_account_nr: {
      type: ['string', 'null'],
      description: 'Supplier bank account number for payment'
    },
    supplier_branch_nr: {
      type: ['string', 'null'],
      description: 'Unique identifier for a specific bank branch (sort code). Leave blank if not explicitly stated'
    },
    supplier_routing_nr: {
      type: ['string', 'null'],
      description: 'The bank\'s routing transit number (RTN). Required for US bank accounts. Leave blank if not explicitly stated'
    },
    supplier_email: {
      type: ['string', 'null'],
      description: 'The email address listed as the contact for the person who issued the invoice'
    },
    supplier_street_and_number: {
      type: ['string', 'null'],
      description: 'Supplier\'s address information, such as house number, street name, apartment or office number'
    },
    supplier_city: {
      type: ['string', 'null'],
      description: 'City of the counterpart issued invoice. If specified in an abbreviated form, always return the full name.'
    },
    supplier_zipcode: {
      type: ['string', 'null'],
      description: 'ZIP code specified in the supplier\'s address'
    },
    supplier_district: {
      type: ['string', 'null'],
      description: 'Geographic area, state or region where the supplier is located'
    },
    supplier_country: {
      type: ['string', 'null'],
      description: 'ISO 3166-1 alpha-2 country code of the invoice issuer. If not explicitly provided, infer from address, VAT ID, or bank details.'
    },
    counterpart_bank_id: {
      type: ['string', 'null'],
      description: 'BIC/SWIFT code of the counterparty\'s bank. Consists of 8 to 11 characters and must follow the ISO 9362 format.'
    },

    // Recipient information
    recipient_name: {
      type: ['string', 'null'],
      description: 'Recipient company\'s name on the invoice. Extract exactly as it appears.'
    },
    recipient_email: {
      type: ['string', 'null']
    },
    recipient_taxid: {
      type: ['string', 'null']
    },
    recipient_vat: {
      type: ['string', 'null'],
      description: 'Recipient VAT ID number. Only if explicitly stated'
    },
    recipient_street_and_number: {
      type: ['string', 'null']
    },
    recipient_city: {
      type: ['string', 'null'],
      description: 'City of the invoice recipient. If abbreviated, return the full name.'
    },
    recipient_zipcode: {
      type: ['string', 'null']
    },
    recipient_district: {
      type: ['string', 'null']
    },
    recipient_country: {
      type: ['string', 'null'],
      description: 'ISO 3166-1 alpha-2 country code'
    },

    // Amounts (in minor units - cents)
    total_excl_vat: {
      type: ['integer', 'null'],
      description: 'The total amount of the invoice excluding taxes in minor units (cents). Be extra careful with decimals – No digits should be dropped or rounded to zeroes.'
    },
    total_inc_vat: {
      type: ['integer', 'null'],
      description: 'The total amount of the invoice including taxes in minor units (cents)'
    },
    total_vat_amount: {
      type: ['integer', 'null'],
      description: 'The final VAT or tax amount in minor units. Should only be provided if explicitly stated in the invoice.'
    },
    amount_paid: {
      type: ['integer', 'null'],
      description: 'The amount already paid towards this invoice in minor units. Includes prepayments, deposits, or amounts previously remitted. 0 indicates unpaid.'
    },
    total_deductions: {
      type: ['integer', 'null'],
      description: 'Total amount deducted from the invoice as discounts in minor units. Do NOT include prepayments here - those belong in amount_paid.'
    },

    // Payment terms
    payment_terms: {
      type: ['string', 'null'],
      description: 'Extract only if explicitly stated. Return only the payment term code (e.g., NET 30, 2/10 Net 30, etc.)'
    },

    // Line items
    line_items: {
      type: 'array',
      description: 'MANDATORY: Extract ALL line items from the document. Check all pages. Validation: quantity × unit_price should approximately equal line_total.',
      items: {
        type: 'object',
        properties: {
          product: {
            type: 'string',
            description: 'Name of product or service'
          },
          description: {
            type: ['string', 'null'],
            description: 'Description of product or service'
          },
          quantity: {
            type: 'number',
            description: 'Quantity in the specified unit. If not specified, assume 1. European invoices use comma as decimal (6,000 = 6.0).'
          },
          unit_price: {
            type: 'integer',
            description: 'Price per single unit in minor units (cents)'
          },
          units: {
            type: ['string', 'null'],
            description: 'Measurement units (pieces, kilograms, liters, hours, etc.)'
          },
          total_excl_vat: {
            type: 'integer',
            description: 'Price unit excluding taxes in minor units. If not specified, calculate from total divided by quantity'
          },
          total_inc_vat: {
            type: 'integer',
            description: 'Price of single unit including taxes in minor units'
          },
          vat_amount: {
            type: ['integer', 'null'],
            description: 'Amount of tax for line item in minor units'
          },
          vat_percent: {
            type: ['number', 'null'],
            description: 'Tax percent for line item as a number (e.g., 20 for 20%)'
          },
          total_line_item_quantity_inc_vat: {
            type: 'integer',
            description: 'Total price of the line item including taxes. Extract only if explicitly present. If not specified, set to 0.'
          },
          total_line_item_quantity_excl_vat: {
            type: 'integer',
            description: 'Total price of the line item excluding taxes. Extract only if explicitly present. If not specified, set to 0.'
          }
        },
        required: ['product', 'quantity', 'unit_price', 'total_excl_vat', 'total_inc_vat']
      }
    },

    // VAT line
    vat_line: {
      type: ['object', 'null'],
      properties: {
        vat_amount: {
          type: ['integer', 'null'],
          description: 'Only if tax or VAT rate is explicitly stated in the document, in minor units'
        },
        vat_rate: {
          type: ['number', 'null'],
          description: 'Only if tax or VAT rate is explicitly stated'
        }
      }
    },

    // Document metadata
    language: {
      type: ['string', 'null'],
      description: 'The language of the original document according to ISO 639'
    },
    document_type: {
      type: ['string', 'null'],
      enum: ['Invoice', 'Receipt', 'BankStatement', 'PNLStatement', 'Other', null],
      description: 'Type of the document'
    }
  }
} as const;

export type InvoiceExtraction = {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string | null;
  supplier_name: string | null;
  supplier_vat: string | null;
  supplier_taxid: string | null;
  supplier_iban: string | null;
  supplier_account_nr: string | null;
  supplier_email: string | null;
  supplier_street_and_number: string | null;
  supplier_city: string | null;
  supplier_zipcode: string | null;
  supplier_country: string | null;
  recipient_name: string | null;
  total_excl_vat: number | null;
  total_inc_vat: number | null;
  total_vat_amount: number | null;
  amount_paid: number | null;
  line_items: Array<{
    product: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    units: string | null;
    total_excl_vat: number;
    total_inc_vat: number;
    vat_amount: number | null;
    vat_percent: number | null;
  }>;
  language: string | null;
  document_type: string | null;
};
