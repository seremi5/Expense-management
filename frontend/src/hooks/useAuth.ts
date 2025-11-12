import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'
import type { LoginRequest, RegisterRequest } from '@/types/api.types'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await authApi.me()
      if (token) {
        setAuth(data, token)
      }
      return data
    },
    enabled: isAuthenticated && !!token,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      navigate('/dashboard')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      navigate('/dashboard')
    },
  })

  const logout = () => {
    clearAuth()
    queryClient.clear()
    navigate('/login')
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoginLoading: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegisterLoading: registerMutation.isPending,
    logout,
  }
}
