import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Introdueix un correu electrònic vàlid'),
  password: z.string().min(1, 'La contrasenya és obligatòria'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoginLoading, loginError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-orange-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
              D
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Iniciar sessió</CardTitle>
          <CardDescription className="text-center">
            Entra amb el teu compte per gestionar les teves despeses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error d'autenticació</p>
                  <p className="text-red-700">
                    Correu o contrasenya incorrectes. Si us plau, torna-ho a provar.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correu electrònic</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.cat"
                {...register('email')}
                disabled={isLoginLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasenya</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoginLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? 'Entrant...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">No tens compte? </span>
              <Link to="/register" className="text-primary-600 hover:underline font-medium">
                Registra't
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
