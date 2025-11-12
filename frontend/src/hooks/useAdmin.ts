import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import type { UpdateExpenseStatusRequest, Expense } from '@/types/api.types'
import { AxiosError } from 'axios'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  })
}

export function useAuditLog(expenseId: string) {
  return useQuery({
    queryKey: ['admin', 'audit', expenseId],
    queryFn: () => adminApi.getAuditLog(expenseId),
    enabled: !!expenseId,
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      adminApi.updateExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] })

      toast({
        title: 'Èxit',
        description: 'La despesa s\'ha actualitzat correctament',
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || "No s'ha pogut actualitzar la despesa"

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateExpenseStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseStatusRequest }) =>
      adminApi.updateExpenseStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit', variables.id] })

      const statusLabels = {
        ready_to_pay: 'aprovada i preparada per pagar',
        paid: 'marcada com a pagada',
        declined: 'denegada',
      }

      toast({
        title: 'Èxit',
        description: `La despesa ha estat ${statusLabels[variables.data.status]}`,
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || "No s'ha pogut actualitzar l'estat de la despesa"

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}
