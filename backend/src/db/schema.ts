import { pgTable, uuid, text, timestamp, numeric, pgEnum, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['admin', 'viewer']);

// Note: event and category are now stored as TEXT to allow flexible values from the events/categories tables
// Previously used hardcoded enums - commented out for reference:
// export const eventEnum = pgEnum('event', [
//   'mwc_barcelona',
//   '4yfn_barcelona',
//   'gitex_dubai',
//   'websummit_lisbon',
//   'slush_helsinki',
//   'ces_las_vegas',
//   'sxsw_austin',
//   'techcrunch_disrupt',
//   'collision_toronto',
//   'viva_tech_paris',
//   'dreamforce_san_francisco',
//   'google_io',
//   'other'
// ]);

// export const categoryEnum = pgEnum('category', [
//   'accommodation',
//   'transportation',
//   'meals',
//   'entertainment',
//   'marketing',
//   'booth_setup',
//   'technology',
//   'office_supplies',
//   'professional_services',
//   'insurance',
//   'training',
//   'other'
// ]);

export const expenseTypeEnum = pgEnum('expense_type', [
  'reimbursable',
  'non_reimbursable',
  'payable'
]);

export const statusEnum = pgEnum('status', [
  'submitted',
  'ready_to_pay',
  'paid',
  'declined',
  'validated',
  'flagged'
]);

// Events Table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').unique().notNull(),
  label: text('label').notNull(),
  isActive: text('is_active').notNull().default('true'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').unique().notNull(),
  label: text('label').notNull(),
  isActive: text('is_active').notNull().default('true'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Profiles Table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('viewer'),
  phone: text('phone'),
  bankAccount: text('bank_account'),
  bankName: text('bank_name'),
  accountHolder: text('account_holder'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true })
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email)
}));

// Expenses Table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  referenceNumber: text('reference_number').notNull(),

  // Submitter Information
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  name: text('name').notNull(),
  surname: text('surname').notNull(),

  // Expense Classification
  event: text('event').notNull(),
  category: text('category').notNull(),
  type: expenseTypeEnum('type').notNull(),

  // Invoice Details
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: timestamp('invoice_date', { withTimezone: true }).notNull(),
  vendorName: text('vendor_name').notNull(),
  vendorNif: text('vendor_nif').notNull(),

  // Financial Information
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),

  // Tax Breakdown
  taxBase: numeric('tax_base', { precision: 10, scale: 2 }),
  vat21Base: numeric('vat_21_base', { precision: 10, scale: 2 }),
  vat21Amount: numeric('vat_21_amount', { precision: 10, scale: 2 }),
  vat10Base: numeric('vat_10_base', { precision: 10, scale: 2 }),
  vat10Amount: numeric('vat_10_amount', { precision: 10, scale: 2 }),
  vat4Base: numeric('vat_4_base', { precision: 10, scale: 2 }),
  vat4Amount: numeric('vat_4_amount', { precision: 10, scale: 2 }),
  vat0Base: numeric('vat_0_base', { precision: 10, scale: 2 }),
  vat0Amount: numeric('vat_0_amount', { precision: 10, scale: 2 }),

  // Bank Account Information (conditional based on type)
  bankAccount: text('bank_account'),
  accountHolder: text('account_holder'),

  // File Information (optional - can be uploaded later)
  fileUrl: text('file_url'),
  fileName: text('file_name'),

  // Status and Approval
  status: statusEnum('status').notNull().default('submitted'),
  approvedBy: uuid('approved_by').references(() => profiles.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  declinedReason: text('declined_reason'),

  // Additional Information
  comments: text('comments'),
  ocrConfidence: numeric('ocr_confidence', { precision: 5, scale: 2 }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  statusIdx: index('status_idx').on(table.status),
  eventIdx: index('event_idx').on(table.event),
  categoryIdx: index('category_idx').on(table.category),
  emailIdx: index('submitter_email_idx').on(table.email),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  referenceNumberIdx: index('reference_number_idx').on(table.referenceNumber)
}));

// Expense Line Items Table
export const expenseLineItems = pgTable('expense_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  expenseIdIdx: index('expense_line_items_expense_id_idx').on(table.expenseId)
}));

// Audit Log Table
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id),
  action: text('action').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  expenseIdIdx: index('audit_log_expense_id_idx').on(table.expenseId),
  userIdIdx: index('audit_log_user_id_idx').on(table.userId),
  createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt)
}));

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  approvedExpenses: many(expenses, { relationName: 'approver' }),
  auditLogs: many(auditLog)
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  approver: one(profiles, {
    fields: [expenses.approvedBy],
    references: [profiles.id],
    relationName: 'approver'
  }),
  lineItems: many(expenseLineItems),
  auditLogs: many(auditLog)
}));

export const expenseLineItemsRelations = relations(expenseLineItems, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseLineItems.expenseId],
    references: [expenses.id]
  })
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  expense: one(expenses, {
    fields: [auditLog.expenseId],
    references: [expenses.id]
  }),
  user: one(profiles, {
    fields: [auditLog.userId],
    references: [profiles.id]
  })
}));

// Export types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type ExpenseLineItem = typeof expenseLineItems.$inferSelect;
export type NewExpenseLineItem = typeof expenseLineItems.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
