import { useParams, useNavigate } from 'react-router-dom'
import { useExpense } from '@/hooks/useExpenses'
import { useActiveEvents, useActiveCategories } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/features/expenses/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Calendar, Building2, FileText, User, Receipt } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EXPENSE_TYPE_LABELS } from '@/lib/constants'
import { useMemo } from 'react'

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: expense, isLoading, error } = useExpense(id!)
  const { data: activeEvents } = useActiveEvents()
  const { data: activeCategories } = useActiveCategories()

  // Create label lookups for displaying event and category names
  const eventLabel = useMemo(() => {
    if (!expense || !activeEvents) return expense?.event || ''
    const event = activeEvents.find(e => e.key === expense.event)
    return event?.label || expense.event
  }, [activeEvents, expense])

  const categoryLabel = useMemo(() => {
    if (!expense || !activeCategories) return expense?.category || ''
    const category = activeCategories.find(c => c.key === expense.category)
    return category?.label || expense.category
  }, [activeCategories, expense])

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Error carregant la despesa. Si us plau, torna-ho a provar.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/dashboard')}>Tornar al tauler</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Detall de la despesa</h1>
          <p className="text-gray-600 mt-1">{expense.referenceNumber}</p>
        </div>
        <StatusBadge status={expense.status as any} />
      </div>

      {/* Amount Card */}
      <Card className="bg-primary-50 border-primary-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Import total</p>
            <p className="text-4xl font-bold text-primary-700">
              {formatCurrency(expense.totalAmount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Dades personals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-medium">
                {expense.name} {expense.surname}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Correu electrònic</p>
              <p className="font-medium">{expense.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Telèfon</p>
              <p className="font-medium">{expense.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalls de la despesa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Esdeveniment</p>
              <p className="font-medium">
                {eventLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Categoria</p>
              <p className="font-medium">
                {categoryLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Tipus</p>
              <p className="font-medium">
                {EXPENSE_TYPE_LABELS[expense.type as keyof typeof EXPENSE_TYPE_LABELS] || expense.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Dades de la factura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Proveïdor</p>
              <p className="font-medium">{expense.vendorName}</p>
            </div>
            {expense.vendorNif && (
              <div>
                <p className="text-sm text-gray-600">NIF</p>
                <p className="font-medium">{expense.vendorNif}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Número de factura</p>
              <p className="font-medium">{expense.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data de factura</p>
              <p className="font-medium">{formatDate(expense.invoiceDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      {expense.bankAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Dades bancàries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Compte bancari</p>
              <p className="font-medium font-mono">{expense.bankAccount}</p>
            </div>
            {expense.accountHolder && (
              <div>
                <p className="text-sm text-gray-600">Titular</p>
                <p className="font-medium">{expense.accountHolder}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Declined Reason */}
      {expense.status === 'declined' && expense.declinedReason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Motiu de denegació</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{expense.declinedReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Cronologia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Enviada:</span>
            <span className="font-medium">{formatDate(expense.submittedAt)}</span>
          </div>
          {expense.reviewedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Revisada:</span>
              <span className="font-medium">{formatDate(expense.reviewedAt)}</span>
            </div>
          )}
          {expense.paidAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Pagada:</span>
              <span className="font-medium">{formatDate(expense.paidAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
