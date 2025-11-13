import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCreateExpense } from '@/hooks/useExpenses'
import { useActiveEvents, useActiveCategories } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { EXPENSE_TYPE_LABELS } from '@/lib/constants'
import { useEffect, useMemo, useState } from 'react'
import { OCRUpload } from '@/components/features/expenses/OCRUpload'
import type { OCRExtractResponse } from '@/types/api.types'
import { useToast } from '@/hooks/useToast'

const expenseSchema = z.object({
  name: z.string().min(2, 'El nom és obligatori'),
  surname: z.string().min(2, 'Els cognoms són obligatoris'),
  email: z.string().email('Correu electrònic invàlid'),
  phone: z.string().min(9, 'Telèfon invàlid'),
  event: z.string().min(1, 'Selecciona un esdeveniment'),
  category: z.string().min(1, 'Selecciona una categoria'),
  type: z.string().min(1, 'Selecciona un tipus'),
  vendorName: z.string().min(2, 'El nom del proveïdor és obligatori'),
  vendorNif: z.string().optional(),
  invoiceNumber: z.string().min(1, 'El número de factura és obligatori'),
  invoiceDate: z.string().min(1, 'La data és obligatòria'),
  totalAmount: z.string().min(1, 'L\'import és obligatori'),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

export default function NewExpensePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const createExpense = useCreateExpense()
  const { data: activeEvents, isLoading: isLoadingEvents } = useActiveEvents()
  const { data: activeCategories, isLoading: isLoadingCategories } = useActiveCategories()
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: '',
      surname: '',
      email: '',
      phone: '',
      bankAccount: '',
      accountHolder: '',
    },
  })

  // Sort events and categories alphabetically by label
  const sortedEvents = useMemo(() => {
    if (!activeEvents) return []
    return [...activeEvents].sort((a, b) => a.label.localeCompare(b.label))
  }, [activeEvents])

  const sortedCategories = useMemo(() => {
    if (!activeCategories) return []
    return [...activeCategories].sort((a, b) => a.label.localeCompare(b.label))
  }, [activeCategories])

  // Pre-fill form with user data when user is loaded
  useEffect(() => {
    if (user) {
      // Split name into first name and surname if possible
      const nameParts = user.name.split(' ')
      const firstName = nameParts[0] || ''
      const surname = nameParts.slice(1).join(' ') || ''

      setValue('name', firstName)
      setValue('surname', surname)
      setValue('email', user.email)

      if (user.phone) {
        setValue('phone', user.phone)
      }

      if (user.bankAccount) {
        setValue('bankAccount', user.bankAccount)
      }

      if (user.accountHolder) {
        setValue('accountHolder', user.accountHolder)
      }
    }
  }, [user, setValue])

  const expenseType = watch('type')
  const needsBankAccount = expenseType === 'reimbursable'

  const handleOCRSuccess = (response: OCRExtractResponse) => {
    const { data: extractedData } = response

    // Auto-fill form fields with extracted data
    setValue('vendorName', extractedData.vendorName || '')
    setValue('vendorNif', extractedData.vendorNif || '')
    setValue('invoiceNumber', extractedData.invoiceNumber || '')
    setValue('totalAmount', extractedData.totalAmount?.toString() || '')

    // Format date from YYYY-MM-DD or other formats
    if (extractedData.invoiceDate) {
      try {
        const date = new Date(extractedData.invoiceDate)
        const formattedDate = date.toISOString().split('T')[0]
        setValue('invoiceDate', formattedDate)
      } catch {
        setValue('invoiceDate', extractedData.invoiceDate)
      }
    }

    // Store OCR metadata
    const confidence = extractedData.confidence || 0
    setOcrConfidence(confidence)

    toast({
      title: 'Dades extretes correctament',
      description: `Temps: ${Math.round(response.duration)}ms. Revisa les dades abans d'enviar.`,
    })
  }

  const handleOCRError = (error: Error) => {
    toast({
      title: 'Error al processar el document',
      description: error.message,
      variant: 'destructive',
    })
  }

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await createExpense.mutateAsync({
        ...data,
        type: data.type as 'reimbursable' | 'non_reimbursable' | 'payable',
        ocrConfidence: ocrConfidence || undefined,
      })
      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nova Despesa</h1>
        <p className="text-gray-600 mt-1">Omple el formulari per sol·licitar un reemborsament</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message */}
        {createExpense.error && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Error al crear la despesa</p>
              <p className="text-red-700">Si us plau, revisa els camps i torna-ho a provar.</p>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Dades personals</CardTitle>
            <CardDescription>Informació de qui sol·licita la despesa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname">Cognoms *</Label>
                <Input id="surname" {...register('surname')} />
                {errors.surname && <p className="text-sm text-red-600">{errors.surname.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correu electrònic *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telèfon *</Label>
                <Input id="phone" type="tel" placeholder="+34..." {...register('phone')} />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalls de la despesa</CardTitle>
            <CardDescription>Informació sobre l'esdeveniment i categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event">Esdeveniment *</Label>
                <Select id="event" {...register('event')} disabled={isLoadingEvents}>
                  <option value="">
                    {isLoadingEvents ? 'Carregant...' : 'Selecciona...'}
                  </option>
                  {sortedEvents.map((event) => (
                    <option key={event.key} value={event.key}>
                      {event.label}
                    </option>
                  ))}
                </Select>
                {errors.event && <p className="text-sm text-red-600">{errors.event.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select id="category" {...register('category')} disabled={isLoadingCategories}>
                  <option value="">
                    {isLoadingCategories ? 'Carregant...' : 'Selecciona...'}
                  </option>
                  {sortedCategories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </Select>
                {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipus de despesa *</Label>
              <Select id="type" {...register('type')}>
                <option value="">Selecciona...</option>
                {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Dades de la factura</CardTitle>
            <CardDescription>Informació del proveïdor i factura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Nom del proveïdor *</Label>
                <Input id="vendorName" {...register('vendorName')} />
                {errors.vendorName && <p className="text-sm text-red-600">{errors.vendorName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorNif">NIF del proveïdor</Label>
                <Input id="vendorNif" placeholder="B12345678" {...register('vendorNif')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Número de factura *</Label>
                <Input id="invoiceNumber" {...register('invoiceNumber')} />
                {errors.invoiceNumber && <p className="text-sm text-red-600">{errors.invoiceNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Data de factura *</Label>
                <Input id="invoiceDate" type="date" {...register('invoiceDate')} />
                {errors.invoiceDate && <p className="text-sm text-red-600">{errors.invoiceDate.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Import total (€) *</Label>
                <Input id="totalAmount" type="number" step="0.01" min="0" {...register('totalAmount')} />
                {errors.totalAmount && <p className="text-sm text-red-600">{errors.totalAmount.message}</p>}
              </div>
            </div>

            {/* OCR Upload */}
            <div className="space-y-2">
              <Label>Factura o rebut *</Label>
              <OCRUpload onExtractSuccess={handleOCRSuccess} onExtractError={handleOCRError} />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details (conditional) */}
        {needsBankAccount && (
          <Card>
            <CardHeader>
              <CardTitle>Dades bancàries</CardTitle>
              <CardDescription>Per a despeses reemborsables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Compte bancari (IBAN) *</Label>
                <Input id="bankAccount" placeholder="ES..." {...register('bankAccount')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">Titular del compte *</Label>
                <Input id="accountHolder" {...register('accountHolder')} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel·lar
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending ? 'Enviant...' : 'Enviar despesa'}
          </Button>
        </div>
      </form>
    </div>
  )
}
