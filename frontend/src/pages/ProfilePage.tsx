import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Shield, Calendar, Phone, CreditCard, Building, UserCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const profileSchema = z.object({
  phone: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

// Helper function to format IBAN with spaces every 4 characters
const formatIBAN = (iban: string | undefined) => {
  if (!iban) return ''
  return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
}

export default function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      bankAccount: '',
      bankName: '',
      accountHolder: '',
    },
  })

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        phone: user.phone || '',
        bankAccount: user.bankAccount || '',
        bankName: user.bankName || '',
        accountHolder: user.accountHolder || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileFormData) => {
    // Only send fields that are not empty
    const cleanedData: ProfileFormData = {}
    if (data.phone?.trim()) cleanedData.phone = data.phone
    if (data.bankAccount?.trim()) cleanedData.bankAccount = data.bankAccount.replace(/\s/g, '')
    if (data.bankName?.trim()) cleanedData.bankName = data.bankName
    if (data.accountHolder?.trim()) cleanedData.accountHolder = data.accountHolder

    await updateProfile.mutateAsync(cleanedData)
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">El meu perfil</h1>
        <p className="text-gray-600 mt-1">Informació del teu compte</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Informació personal</CardTitle>
              <CardDescription>Les teves dades d'usuari</CardDescription>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Correu electrònic</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <div className="mt-1">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuari'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Membre des de</p>
                <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Card */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Dades personals i bancàries</CardTitle>
            <CardDescription>
              Aquestes dades s'utilitzaran per omplir automàticament els formularis de despeses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                Telèfon
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-4">Informació bancària</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccount" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    Compte bancari (IBAN)
                  </Label>
                  <Input
                    id="bankAccount"
                    placeholder="ES00 0000 0000 0000 0000 0000"
                    {...register('bankAccount')}
                  />
                  {errors.bankAccount && (
                    <p className="text-sm text-red-600">{errors.bankAccount.message}</p>
                  )}
                  {user.bankAccount && (
                    <p className="text-xs text-gray-500">
                      Actual: {formatIBAN(user.bankAccount)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName" className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    Nom del banc
                  </Label>
                  <Input
                    id="bankName"
                    placeholder="CaixaBank, BBVA, Santander..."
                    {...register('bankName')}
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHolder" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                    Titular del compte
                  </Label>
                  <Input
                    id="accountHolder"
                    placeholder="Nom complet del titular"
                    {...register('accountHolder')}
                  />
                  {errors.accountHolder && (
                    <p className="text-sm text-red-600">{errors.accountHolder.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Desant...' : 'Desar canvis'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
