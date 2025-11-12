import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import type { ExpenseFilters, CreateExpenseRequest } from '@/types/api.types'
import { AxiosError } from 'axios'

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesApi.list(filters),
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast({
        title: 'Èxit',
        description: 'La despesa s\'ha creat correctament',
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = error.response?.data?.error?.message || 'No s\'ha pogut crear la despesa'

      // If it's a validation error, show the specific field error
      if (error.response?.data?.error?.details?.errors) {
        const errors = error.response.data.error.details.errors
        const firstError = errors[0]
        toast({
          title: 'Error de validació',
          description: firstError?.message || errorMessage,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    },
  })
}
