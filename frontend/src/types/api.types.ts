export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'viewer'
  phone?: string | null
  bankAccount?: string | null
  bankName?: string | null
  accountHolder?: string | null
  createdAt: string
  lastLogin?: string | null
}

export interface Expense {
  id: string
  referenceNumber: string
  status: 'submitted' | 'ready_to_pay' | 'paid' | 'declined'
  email: string
  phone: string
  name: string
  surname: string
  event: string
  category: string
  type: 'reimbursable' | 'non_reimbursable' | 'payable'
  invoiceNumber: string
  invoiceDate: string
  vendorName: string
  vendorNif: string | null
  totalAmount: string
  taxBase: string | null
  vat21Base: string | null
  vat21Amount: string | null
  vat10Base: string | null
  vat10Amount: string | null
  vat4Base: string | null
  vat4Amount: string | null
  vat0Base: string | null
  vat0Amount: string | null
  bankAccount: string | null
  accountHolder: string | null
  fileUrl: string | null
  fileName: string | null
  ocrConfidence: number | null
  submittedAt: string
  reviewedAt: string | null
  paidAt: string | null
  declinedReason: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
  lineItems?: LineItem[]
}

export interface LineItem {
  id: string
  expenseId: string
  description: string
  quantity: number
  unitPrice: string
  vatRate: string
  subtotal: string
  vatAmount: string
  total: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseRequest {
  email: string
  phone: string
  name: string
  surname: string
  event: string
  category: string
  type: 'reimbursable' | 'non_reimbursable' | 'payable'
  invoiceNumber: string
  invoiceDate: string
  vendorName: string
  vendorNif?: string
  totalAmount: string
  bankAccount?: string
  accountHolder?: string
  fileUrl?: string
  fileName?: string
  ocrConfidence?: number
  lineItems?: Omit<LineItem, 'id' | 'expenseId' | 'createdAt' | 'updatedAt'>[]
}

export interface UpdateExpenseStatusRequest {
  status: 'ready_to_pay' | 'paid' | 'declined'
  declinedReason?: string
}

export interface ExpenseFilters {
  status?: string
  event?: string
  category?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminStats {
  totalExpenses: number
  pendingCount: number
  approvedCount: number
  paidCount: number
  declinedCount: number
  totalAmount: string
  pendingAmount: string
  approvedAmount: string
  paidAmount: string
  declinedAmount: string
  recentActivity: AuditLogEntry[]
}

export interface AuditLogEntry {
  id: string
  expenseId: string
  action: string
  performedBy: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
  performedByUser?: {
    name: string
    email: string
  }
}

export interface UpdateProfileRequest {
  phone?: string
  bankAccount?: string
  bankName?: string
  accountHolder?: string
}

export interface Event {
  id: string
  key: string
  label: string
  isActive: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  key: string
  label: string
  isActive: string
  createdAt: string
  updatedAt: string
}

export interface CreateEventRequest {
  key: string
  label: string
}

export interface CreateCategoryRequest {
  key: string
  label: string
}

export interface UpdateEventRequest {
  label?: string
  isActive?: string
}

export interface UpdateCategoryRequest {
  label?: string
  isActive?: string
}
