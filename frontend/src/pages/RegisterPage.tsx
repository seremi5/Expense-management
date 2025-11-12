import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const registerSchema = z
  .object({
    name: z.string().min(2, 'El nom ha de tenir almenys 2 caràcters'),
    email: z.string().email('Introdueix un correu electrònic vàlid'),
    password: z.string().min(8, 'La contrasenya ha de tenir almenys 8 caràcters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les contrasenyes no coincideixen',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Almenys 8 caràcters', valid: password.length >= 8 },
    { label: 'Una majúscula', valid: /[A-Z]/.test(password) },
    { label: 'Una minúscula', valid: /[a-z]/.test(password) },
    { label: 'Un número', valid: /[0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-medium text-gray-700">Força de la contrasenya:</p>
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2 text-xs">
          {check.valid ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <X className="h-3 w-3 text-gray-400" />
          )}
          <span className={cn(check.valid ? 'text-green-700' : 'text-gray-500')}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const { register: registerUser, isRegisterLoading, registerError } = useAuth()
  const [password, setPassword] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
    })
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
          <CardTitle className="text-2xl text-center">Crear compte</CardTitle>
          <CardDescription className="text-center">
            Registra't per començar a gestionar les teves despeses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {registerError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error de registre</p>
                  <p className="text-red-700">
                    No s'ha pogut crear el compte. Si us plau, torna-ho a provar.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                placeholder="Joan García"
                {...register('name')}
                disabled={isRegisterLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correu electrònic</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.cat"
                {...register('email')}
                disabled={isRegisterLoading}
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
                onChange={(e) => setPassword(e.target.value)}
                disabled={isRegisterLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirma la contrasenya</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isRegisterLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isRegisterLoading}>
              {isRegisterLoading ? 'Creant compte...' : 'Crear compte'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Ja tens compte? </span>
              <Link to="/login" className="text-primary-600 hover:underline font-medium">
                Inicia sessió
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
