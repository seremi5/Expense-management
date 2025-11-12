/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/validators/expense.validator.ts
 *
 * Purpose: Zod validation schemas for expense endpoints
 *
 * Dependencies: zod
 * Used by: Expense routes, validation middleware
 *
 * Key responsibilities:
 * - Validate expense creation requests
 * - Validate expense update requests
 * - Validate query parameters for filtering
 * - Ensure data integrity
 *
 * Integration notes: Enforces business rules at the API boundary
 */

import { z } from 'zod'

/**
 * Numeric string schema (for decimal values from forms)
 */
const numericString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Ha de ser un número vàlid amb fins a 2 decimals')

/**
 * Date string schema (YYYY-MM-DD format)
 */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ha de ser una data vàlida en format AAAA-MM-DD')

/**
 * Optional numeric string
 */
const optionalNumericString = numericString.optional()

/**
 * Line item schema
 */
const lineItemSchema = z.object({
  description: z.string().min(1, 'La descripció és obligatòria').max(500),
  quantity: numericString,
  unitPrice: numericString,
  totalPrice: numericString,
})

/**
 * Create expense request validation
 */
export const createExpenseSchema = z.object({
  body: z.object({
    // Submitter Information
    email: z.string().email('Format de correu electrònic invàlid'),
    phone: z.string().min(9, 'El telèfon ha de tenir almenys 9 caràcters').max(20),
    name: z.string().min(2, 'El nom ha de tenir almenys 2 caràcters').max(100),
    surname: z.string().min(2, 'Els cognoms han de tenir almenys 2 caràcters').max(100),

    // Expense Classification
    event: z.enum([
      'peregrinatge_estiu_roma',
      'bartimeu',
      'be_apostle',
      'emunah',
      'escola_pregaria',
      'exercicis_espirituals',
      'har_tabor',
      'nicodemus',
      'trobada_adolescents',
      'equip_dele',
      'general',
    ], { errorMap: () => ({ message: "Selecciona un esdeveniment vàlid" }) }),
    category: z.enum([
      'menjar',
      'transport',
      'material_activitats',
      'dietes',
      'impresos_fotocopies',
      'web_xarxes',
      'casa_convis',
      'formacio',
      'cancellacions',
      'material_musica',
      'reparacions',
      'mobiliari',
    ], { errorMap: () => ({ message: "Selecciona una categoria vàlida" }) }),
    type: z.enum(['reimbursable', 'non_reimbursable', 'payable'], { errorMap: () => ({ message: "Selecciona un tipus vàlid" }) }),

    // Invoice Details
    invoiceNumber: z.string().min(1, 'El número de factura és obligatori').max(100),
    invoiceDate: dateString,
    vendorName: z.string().min(2, 'El nom del proveïdor ha de tenir almenys 2 caràcters').max(200),
    vendorNif: z
      .string()
      .min(9, 'El NIF ha de tenir almenys 9 caràcters')
      .max(20)
      .regex(/^[A-Z0-9]+$/, 'El NIF només pot contenir lletres majúscules i números'),

    // Financial Information
    totalAmount: numericString,
    currency: z.string().length(3).optional().default('EUR'),

    // Tax Breakdown (optional)
    taxBase: optionalNumericString,
    vat21Base: optionalNumericString,
    vat21Amount: optionalNumericString,
    vat10Base: optionalNumericString,
    vat10Amount: optionalNumericString,
    vat4Base: optionalNumericString,
    vat4Amount: optionalNumericString,
    vat0Base: optionalNumericString,
    vat0Amount: optionalNumericString,

    // Bank Account Information (conditional)
    bankAccount: z.string().optional(),
    accountHolder: z.string().optional(),

    // File Information
    fileUrl: z.string().url('URL del fitxer invàlida'),
    fileName: z.string().min(1, 'El nom del fitxer és obligatori'),

    // Additional Information
    comments: z.string().max(1000).optional(),
    ocrConfidence: optionalNumericString,

    // Line items
    lineItems: z.array(lineItemSchema).optional(),
  }).refine(
    (data) => {
      // Only reimbursable expenses require bank account
      if (data.type === 'reimbursable') {
        return !!data.bankAccount && !!data.accountHolder
      }
      return true
    },
    {
      message: 'El compte bancari i el titular són obligatoris per a despeses reemborsables',
      path: ['bankAccount'],
    }
  ),
})

/**
 * Update expense status validation
 */
export const updateExpenseStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format d\'ID de despesa invàlid'),
  }),
  body: z.object({
    status: z.enum([
      'submitted',
      'ready_to_pay',
      'paid',
      'declined',
      'validated',
      'flagged',
    ], { errorMap: () => ({ message: "Selecciona un estat vàlid" }) }),
    declinedReason: z.string().max(500).optional(),
    comments: z.string().max(1000).optional(),
  }),
})

/**
 * Get expense by ID validation
 */
export const getExpenseByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format d\'ID de despesa invàlid'),
  }),
})

/**
 * List expenses query validation
 */
export const listExpensesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    status: z.string().optional(),
    event: z.string().optional(),
    category: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'totalAmount', 'invoiceDate']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>['body']
export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>['body']
export type ListExpensesQuery = z.infer<typeof listExpensesSchema>['query']
