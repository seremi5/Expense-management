import { useState, useEffect, useMemo } from 'react'
import { X, FileText, User, DollarSign, Check, XCircle, CreditCard, Edit2, Save, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/features/expenses/StatusBadge'
import { OCRUpload } from '@/components/features/expenses/OCRUpload'
import { useUpdateExpenseStatus, useUpdateExpense } from '@/hooks/useAdmin'
import { useActiveEvents, useActiveCategories } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EXPENSE_TYPE_LABELS, getFileUrl } from '@/lib/constants'
import { useToast } from '@/hooks/useToast'
import type { Expense, OCRExtractResponse } from '@/types/api.types'

interface ExpenseReviewModalProps {
  expense: Expense | null
  isOpen: boolean
  onClose: () => void
}

export function ExpenseReviewModal({ expense, isOpen, onClose }: ExpenseReviewModalProps) {
  const [declinedReason, setDeclinedReason] = useState('')
  const [action, setAction] = useState<'approve' | 'decline' | 'paid' | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showUploadBox, setShowUploadBox] = useState(false)
  const updateStatus = useUpdateExpenseStatus()
  const updateExpense = useUpdateExpense()
  const { toast } = useToast()

  const { data: activeEvents, isLoading: isLoadingEvents } = useActiveEvents()
  const { data: activeCategories, isLoading: isLoadingCategories } = useActiveCategories()

  const { register, handleSubmit, reset, watch, setValue } = useForm<Partial<Expense>>({
    defaultValues: expense || {},
  })

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      reset(expense)
    }
  }, [expense, reset])

  const expenseType = watch('type')

  // Sort events and categories alphabetically by label
  const sortedEvents = useMemo(() => {
    if (!activeEvents) return []
    return [...activeEvents].sort((a, b) => a.label.localeCompare(b.label))
  }, [activeEvents])

  const sortedCategories = useMemo(() => {
    if (!activeCategories) return []
    return [...activeCategories].sort((a, b) => a.label.localeCompare(b.label))
  }, [activeCategories])

  // Create a label lookup for displaying event and category names when not editing
  const eventLabelMap = useMemo(() => {
    return new Map(activeEvents?.map(e => [e.key, e.label]) || [])
  }, [activeEvents])

  const categoryLabelMap = useMemo(() => {
    return new Map(activeCategories?.map(c => [c.key, c.label]) || [])
  }, [activeCategories])

  if (!isOpen || !expense) return null

  const handleApprove = async () => {
    setAction('approve')
    await updateStatus.mutateAsync({
      id: expense.id,
      data: { status: 'ready_to_pay' },
    })
    setAction(null)
    onClose()
  }

  const handleDecline = async () => {
    if (!declinedReason.trim()) {
      return
    }
    setAction('decline')
    await updateStatus.mutateAsync({
      id: expense.id,
      data: { status: 'declined', declinedReason },
    })
    setAction(null)
    setDeclinedReason('')
    onClose()
  }

  const handleMarkPaid = async () => {
    setAction('paid')
    await updateStatus.mutateAsync({
      id: expense.id,
      data: { status: 'paid' },
    })
    setAction(null)
    onClose()
  }

  const canApprove = expense.status === 'submitted'
  const canMarkPaid = expense.status === 'ready_to_pay'
  const canDecline = expense.status === 'submitted' || expense.status === 'ready_to_pay'

  const onSubmitEdit = async (data: Partial<Expense>) => {
    await updateExpense.mutateAsync({
      id: expense.id,
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        event: data.event,
        category: data.category,
        type: data.type,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        vendorName: data.vendorName,
        vendorNif: data.vendorNif,
        totalAmount: data.totalAmount,
        taxBase: data.taxBase,
        vat21Base: data.vat21Base,
        vat21Amount: data.vat21Amount,
        vat10Base: data.vat10Base,
        vat10Amount: data.vat10Amount,
        vat4Base: data.vat4Base,
        vat4Amount: data.vat4Amount,
        vat0Base: data.vat0Base,
        vat0Amount: data.vat0Amount,
        bankAccount: data.bankAccount,
        accountHolder: data.accountHolder,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      },
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    reset(expense)
    setIsEditing(false)
    setShowUploadBox(false)
  }

  const handleOCRSuccess = (response: OCRExtractResponse) => {
    console.log('OCR Response received in admin modal:', response)
    const { data: extractedData } = response

    if (!extractedData) {
      console.error('No data in OCR response')
      return
    }

    console.log('Extracted data in admin modal:', extractedData)

    // Auto-fill form fields with extracted data
    if (extractedData.vendorName) setValue('vendorName', extractedData.vendorName)
    if (extractedData.vendorNif) setValue('vendorNif', extractedData.vendorNif)
    if (extractedData.invoiceNumber) setValue('invoiceNumber', extractedData.invoiceNumber)
    if (extractedData.totalAmount) setValue('totalAmount', extractedData.totalAmount.toString())

    // Format and set invoice date
    if (extractedData.invoiceDate) {
      try {
        const date = new Date(extractedData.invoiceDate)
        const formattedDate = date.toISOString().split('T')[0]
        setValue('invoiceDate', formattedDate)
      } catch {
        setValue('invoiceDate', extractedData.invoiceDate)
      }
    }

    // Auto-fill tax fields (IVA details)
    if (extractedData.taxBase) setValue('taxBase', extractedData.taxBase.toString())
    if (extractedData.vat21Base) setValue('vat21Base', extractedData.vat21Base.toString())
    if (extractedData.vat21Amount) setValue('vat21Amount', extractedData.vat21Amount.toString())
    if (extractedData.vat10Base) setValue('vat10Base', extractedData.vat10Base.toString())
    if (extractedData.vat10Amount) setValue('vat10Amount', extractedData.vat10Amount.toString())
    if (extractedData.vat4Base) setValue('vat4Base', extractedData.vat4Base.toString())
    if (extractedData.vat4Amount) setValue('vat4Amount', extractedData.vat4Amount.toString())
    if (extractedData.vat0Base) setValue('vat0Base', extractedData.vat0Base.toString())
    if (extractedData.vat0Amount) setValue('vat0Amount', extractedData.vat0Amount.toString())

    // Save file URL and filename
    if (extractedData.fileUrl) setValue('fileUrl', extractedData.fileUrl)
    if (extractedData.fileName) setValue('fileName', extractedData.fileName)

    console.log('Form fields populated successfully in admin modal with file info')

    toast({
      title: 'Dades extretes correctament',
      description: `Temps: ${Math.round(response.duration)}ms. Revisa les dades abans de desar.`,
    })
  }

  const handleOCRError = (error: Error) => {
    toast({
      title: 'Error al processar el document',
      description: error.message,
      variant: 'destructive',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Revisió de despesa</h2>
            <p className="text-sm text-gray-600 mt-1">{expense.invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmitEdit)} className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estat actual</span>
            <StatusBadge status={expense.status as any} />
          </div>

          {/* Person Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-5 w-5" />
              <span className="font-semibold">Dades personals</span>
            </div>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Nom:</label>
                  <Input {...register('name')} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Cognoms:</label>
                  <Input {...register('surname')} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email:</label>
                  <Input {...register('email')} type="email" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Telèfon:</label>
                  <Input {...register('phone')} className="mt-1" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Nom:</span>
                  <p className="font-medium">
                    {expense.name} {expense.surname}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{expense.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Telèfon:</span>
                  <p className="font-medium">{expense.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Expense Details */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Detalls de la despesa</span>
            </div>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-blue-700">Esdeveniment:</label>
                  <Select {...register('event')} className="mt-1 bg-white" disabled={isLoadingEvents}>
                    {isLoadingEvents ? (
                      <option>Carregant...</option>
                    ) : (
                      sortedEvents.map((event) => (
                        <option key={event.key} value={event.key}>
                          {event.label}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-blue-700">Categoria:</label>
                  <Select {...register('category')} className="mt-1 bg-white" disabled={isLoadingCategories}>
                    {isLoadingCategories ? (
                      <option>Carregant...</option>
                    ) : (
                      sortedCategories.map((category) => (
                        <option key={category.key} value={category.key}>
                          {category.label}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-blue-700">Tipus:</label>
                  <Select {...register('type')} className="mt-1 bg-white">
                    {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-blue-700">Número factura:</label>
                  <Input {...register('invoiceNumber')} className="mt-1 bg-white" />
                </div>
                <div>
                  <label className="text-sm text-blue-700">Data factura:</label>
                  <Input
                    {...register('invoiceDate')}
                    type="date"
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-blue-700">Proveïdor:</label>
                  <Input {...register('vendorName')} className="mt-1 bg-white" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-blue-700">NIF Proveïdor:</label>
                  <Input {...register('vendorNif')} className="mt-1 bg-white" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">Esdeveniment:</span>
                  <p className="font-medium text-blue-900">
                    {eventLabelMap.get(expense.event) || expense.event}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Categoria:</span>
                  <p className="font-medium text-blue-900">
                    {categoryLabelMap.get(expense.category) || expense.category}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Tipus:</span>
                  <p className="font-medium text-blue-900">
                    {EXPENSE_TYPE_LABELS[expense.type as keyof typeof EXPENSE_TYPE_LABELS] ||
                      expense.type}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Número factura:</span>
                  <p className="font-medium text-blue-900">{expense.invoiceNumber}</p>
                </div>
                <div>
                  <span className="text-blue-700">Proveïdor:</span>
                  <p className="font-medium text-blue-900">{expense.vendorName}</p>
                </div>
                {expense.vendorNif && (
                  <div>
                    <span className="text-blue-700">NIF Proveïdor:</span>
                    <p className="font-medium text-blue-900">{expense.vendorNif}</p>
                  </div>
                )}
                <div>
                  <span className="text-blue-700">Data factura:</span>
                  <p className="font-medium text-blue-900">{formatDate(expense.invoiceDate)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-green-50 rounded-lg p-4">
            {isEditing ? (
              <div>
                <div className="flex items-center gap-2 text-green-900 mb-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">Import total</span>
                </div>
                <Input
                  {...register('totalAmount')}
                  type="text"
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-900">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">Import total</span>
                </div>
                <span className="text-2xl font-bold text-green-900">
                  {formatCurrency(expense.totalAmount)}
                </span>
              </div>
            )}
          </div>

          {/* VAT Details */}
          {(isEditing ||
            expense.vat21Base ||
            expense.vat10Base ||
            expense.vat4Base ||
            expense.vat0Base ||
            expense.taxBase) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="font-semibold text-gray-900">Detalls IVA</div>
              {isEditing && (showUploadBox || !expense.fileUrl) && (
                <div className="mb-3">
                  <label className="text-sm text-gray-600 block mb-2">
                    {expense.fileUrl && showUploadBox
                      ? 'Puja una nova factura per extreure dades automàticament:'
                      : 'Puja factura per extreure dades automàticament:'}
                  </label>
                  <OCRUpload onExtractSuccess={handleOCRSuccess} onExtractError={handleOCRError} />
                  {expense.fileUrl && showUploadBox && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadBox(false)}
                      className="mt-2"
                    >
                      Cancel·lar
                    </Button>
                  )}
                </div>
              )}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Base imposable:</label>
                    <Input
                      {...register('taxBase')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Base IVA 21%:</label>
                    <Input
                      {...register('vat21Base')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Import IVA 21%:</label>
                    <Input
                      {...register('vat21Amount')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Base IVA 10%:</label>
                    <Input
                      {...register('vat10Base')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Import IVA 10%:</label>
                    <Input
                      {...register('vat10Amount')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Base IVA 4%:</label>
                    <Input
                      {...register('vat4Base')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Import IVA 4%:</label>
                    <Input
                      {...register('vat4Amount')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Base IVA 0%:</label>
                    <Input
                      {...register('vat0Base')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Import IVA 0%:</label>
                    <Input
                      {...register('vat0Amount')}
                      type="text"
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {expense.taxBase && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Base imposable:</span>
                        <p className="font-medium text-gray-900">{formatCurrency(expense.taxBase)}</p>
                      </div>
                    </div>
                  )}
                  {expense.vat21Base && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Base IVA 21%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat21Base)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Import IVA 21%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat21Amount || '0')}
                        </p>
                      </div>
                    </div>
                  )}
                  {expense.vat10Base && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Base IVA 10%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat10Base)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Import IVA 10%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat10Amount || '0')}
                        </p>
                      </div>
                    </div>
                  )}
                  {expense.vat4Base && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Base IVA 4%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat4Base)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Import IVA 4%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat4Amount || '0')}
                        </p>
                      </div>
                    </div>
                  )}
                  {expense.vat0Base && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600">Base IVA 0%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat0Base)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Import IVA 0%:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(expense.vat0Amount || '0')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bank Account (if reimbursable) */}
          {(expenseType === 'reimbursable' || expense.type === 'reimbursable') && (
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-900">
                <CreditCard className="h-5 w-5" />
                <span className="font-semibold">Dades bancàries</span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-purple-700">Compte:</label>
                    <Input {...register('bankAccount')} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <label className="text-sm text-purple-700">Titular:</label>
                    <Input {...register('accountHolder')} className="mt-1 bg-white" />
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-1">
                  {expense.bankAccount && (
                    <div>
                      <span className="text-purple-700">Compte:</span>
                      <p className="font-mono font-medium text-purple-900">{expense.bankAccount}</p>
                    </div>
                  )}
                  {expense.accountHolder && (
                    <div>
                      <span className="text-purple-700">Titular:</span>
                      <p className="font-medium text-purple-900">{expense.accountHolder}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Invoice File */}
          {expense.fileUrl && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <a
                  href={getFileUrl(expense.fileUrl) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FileText className="h-4 w-4" />
                  Veure factura ({expense.fileName || 'document.pdf'})
                </a>
                {isEditing && !showUploadBox && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadBox(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Substituir fitxer
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Declined Reason (if declined) */}
          {expense.status === 'declined' && expense.declinedReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="font-semibold text-red-900">Motiu de denegació:</span>
              <p className="text-red-800 mt-1">{expense.declinedReason}</p>
            </div>
          )}

          {/* Decline Reason Input (when declining) */}
          {!isEditing && expense.status !== 'declined' && expense.status !== 'paid' && (
            <div className="space-y-2">
              <label htmlFor="declinedReason" className="block text-sm font-medium text-gray-700">
                Motiu de denegació
              </label>
              <Textarea
                id="declinedReason"
                value={declinedReason}
                onChange={(e) => setDeclinedReason(e.target.value)}
                placeholder="Explica per què es denega aquesta despesa..."
                rows={3}
              />
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel·lar
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit(onSubmitEdit)}
                disabled={updateExpense.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateExpense.isPending ? 'Desant...' : 'Desar canvis'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Tancar
              </Button>

              <div className="flex items-center gap-3">
                {canDecline && (
                  <Button
                    variant="destructive"
                    onClick={handleDecline}
                    disabled={updateStatus.isPending || !declinedReason.trim()}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {action === 'decline' && updateStatus.isPending ? 'Denegant...' : 'Denegar'}
                  </Button>
                )}

                {canMarkPaid && (
                  <Button
                    variant="default"
                    onClick={handleMarkPaid}
                    disabled={updateStatus.isPending}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    {action === 'paid' && updateStatus.isPending ? 'Marcant...' : 'Marcar com pagada'}
                  </Button>
                )}

                {canApprove && (
                  <Button
                    variant="default"
                    onClick={handleApprove}
                    disabled={updateStatus.isPending}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {action === 'approve' && updateStatus.isPending ? 'Aprovant...' : 'Aprovar'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
