import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import type {
  CreateEventRequest,
  CreateCategoryRequest,
  UpdateEventRequest,
  UpdateCategoryRequest,
} from '@/types/api.types'
import { AxiosError } from 'axios'

// Events hooks
export function useEvents() {
  return useQuery({
    queryKey: ['settings', 'events'],
    queryFn: settingsApi.getEvents,
  })
}

export function useActiveEvents() {
  return useQuery({
    queryKey: ['settings', 'events', 'active'],
    queryFn: settingsApi.getActiveEvents,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEventRequest) => settingsApi.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'events', 'active'] })

      toast({
        title: 'Èxit',
        description: "L'esdeveniment s'ha creat correctament",
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || "No s'ha pogut crear l'esdeveniment"

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventRequest }) =>
      settingsApi.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'events', 'active'] })

      toast({
        title: 'Èxit',
        description: "L'esdeveniment s'ha actualitzat correctament",
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || "No s'ha pogut actualitzar l'esdeveniment"

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'events', 'active'] })

      toast({
        title: 'Èxit',
        description: "L'esdeveniment s'ha eliminat correctament",
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || "No s'ha pogut eliminar l'esdeveniment"

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: ['settings', 'categories'],
    queryFn: settingsApi.getCategories,
  })
}

export function useActiveCategories() {
  return useQuery({
    queryKey: ['settings', 'categories', 'active'],
    queryFn: settingsApi.getActiveCategories,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => settingsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'categories', 'active'] })

      toast({
        title: 'Èxit',
        description: 'La categoria s\'ha creat correctament',
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || 'No s\'ha pogut crear la categoria'

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      settingsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'categories', 'active'] })

      toast({
        title: 'Èxit',
        description: 'La categoria s\'ha actualitzat correctament',
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || 'No s\'ha pogut actualitzar la categoria'

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'categories', 'active'] })

      toast({
        title: 'Èxit',
        description: 'La categoria s\'ha eliminat correctament',
        variant: 'default',
      })
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage =
        error.response?.data?.error?.message || 'No s\'ha pogut eliminar la categoria'

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
  })
}
