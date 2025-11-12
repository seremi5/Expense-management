import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import type { UpdateProfileRequest } from '@/types/api.types'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { setAuth, token } = useAuthStore()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authApi.updateProfile(data),
    onSuccess: (user) => {
      // Update user in auth store
      if (token) {
        setAuth(user, token)
      }

      // Invalidate queries to refresh user data
      queryClient.setQueryData(['auth', 'me'], user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })

      // Show success message
      toast({
        title: 'Perfil actualitzat',
        description: 'Les teves dades s\'han desat correctament.',
        variant: 'success',
      })
    },
    onError: () => {
      // Show error message
      toast({
        title: 'Error',
        description: 'No s\'ha pogut actualitzar el perfil. Torna-ho a provar.',
        variant: 'destructive',
      })
    },
  })
}
