import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_URL } from './constants'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Expense,
  PaginatedResponse,
  CreateExpenseRequest,
  UpdateExpenseStatusRequest,
  ExpenseFilters,
  AdminStats,
  AuditLogEntry,
  UpdateProfileRequest,
  OCRExtractResponse,
  Event,
  Category,
  CreateEventRequest,
  CreateCategoryRequest,
  UpdateEventRequest,
  UpdateCategoryRequest,
} from '@/types/api.types'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // If sending FormData, let axios set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Authentication
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data)
    return response.data.data!
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data)
    return response.data.data!
  },

  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data!
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword })
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>('/profiles/me', data)
    return response.data.data!
  },
}

// Expenses
export const expensesApi = {
  list: async (filters?: ExpenseFilters): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Expense>>>('/expenses', {
      params: filters,
    })
    return response.data.data!
  },

  get: async (id: string): Promise<Expense> => {
    const response = await api.get<ApiResponse<Expense>>(`/expenses/${id}`)
    return response.data.data!
  },

  create: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await api.post<ApiResponse<Expense>>('/expenses', data)
    return response.data.data!
  },
}

// Admin
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<ApiResponse<AdminStats>>('/admin/stats')
    return response.data.data!
  },

  updateExpense: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const response = await api.patch<ApiResponse<Expense>>(`/admin/expenses/${id}`, data)
    return response.data.data!
  },

  updateExpenseStatus: async (
    id: string,
    data: UpdateExpenseStatusRequest
  ): Promise<Expense> => {
    const response = await api.patch<ApiResponse<Expense>>(
      `/admin/expenses/${id}/status`,
      data
    )
    return response.data.data!
  },

  getAuditLog: async (expenseId: string): Promise<AuditLogEntry[]> => {
    const response = await api.get<ApiResponse<AuditLogEntry[]>>(
      `/admin/expenses/${expenseId}/audit`
    )
    return response.data.data!
  },
}

// Profile
export const profileApi = {
  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/profiles/me')
    return response.data.data!
  },

  update: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>('/profiles/me', data)
    return response.data.data!
  },
}

// OCR
export const ocrApi = {
  extract: async (file: File): Promise<OCRExtractResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    // The request interceptor will handle removing Content-Type for FormData
    const response = await api.post<OCRExtractResponse>(
      '/ocr/extract',
      formData
    )
    // Return the full response including data, warnings, errors, duration, metadata
    return response.data
  },
}

// Settings
export const settingsApi = {
  // Events
  getEvents: async (): Promise<Event[]> => {
    const response = await api.get<ApiResponse<Event[]>>('/settings/events')
    return response.data.data!
  },

  getActiveEvents: async (): Promise<Event[]> => {
    const response = await api.get<ApiResponse<Event[]>>('/settings/events/active')
    return response.data.data!
  },

  createEvent: async (data: CreateEventRequest): Promise<Event> => {
    const response = await api.post<ApiResponse<Event>>('/settings/events', data)
    return response.data.data!
  },

  updateEvent: async (id: string, data: UpdateEventRequest): Promise<Event> => {
    const response = await api.patch<ApiResponse<Event>>(`/settings/events/${id}`, data)
    return response.data.data!
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/settings/events/${id}`)
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/settings/categories')
    return response.data.data!
  },

  getActiveCategories: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/settings/categories/active')
    return response.data.data!
  },

  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/settings/categories', data)
    return response.data.data!
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await api.patch<ApiResponse<Category>>(`/settings/categories/${id}`, data)
    return response.data.data!
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/settings/categories/${id}`)
  },
}

export default api
