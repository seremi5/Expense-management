import { useState } from 'react'
import { useAdminStats } from '@/hooks/useAdmin'
import { useExpenses } from '@/hooks/useExpenses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { AdminExpensesTable } from '@/components/features/admin/AdminExpensesTable'
import { ExpenseReviewModal } from '@/components/features/admin/ExpenseReviewModal'
import { Receipt, Clock, Check, CreditCard, XCircle } from 'lucide-react'
import type { Expense } from '@/types/api.types'

export default function AdminPage() {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats()
  const { data: expensesData, isLoading: expensesLoading, error: expensesError } = useExpenses()

  const isLoading = statsLoading || expensesLoading
  const error = statsError || expensesError

  const handleReview = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedExpense(null)
  }

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Error carregant les estadístiques. Si us plau, torna-ho a provar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Administració</h1>
        <p className="text-gray-600 mt-1">Gestió i supervisió de despeses</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={Receipt}
          label="Total"
          count={stats.totalExpenses}
          total={parseFloat(stats.totalAmount)}
          variant="default"
        />

        <SummaryCard
          icon={Clock}
          label="Pendent revisió"
          count={stats.pendingCount}
          total={parseFloat(stats.pendingAmount)}
          variant="yellow"
        />

        <SummaryCard
          icon={CreditCard}
          label="Per pagar"
          count={stats.approvedCount}
          total={parseFloat(stats.approvedAmount)}
          variant="blue"
        />

        <SummaryCard
          icon={Check}
          label="Completades"
          count={stats.paidCount}
          total={parseFloat(stats.paidAmount)}
          variant="green"
        />

        <SummaryCard
          icon={XCircle}
          label="Rebutjades"
          count={stats.declinedCount}
          total={parseFloat(stats.declinedAmount)}
          variant="red"
        />
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Gestió de despeses</CardTitle>
          <CardDescription>Revisa i gestiona totes les despeses enviades</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesData?.data && expensesData.data.length > 0 ? (
            <AdminExpensesTable expenses={expensesData.data} onReview={handleReview} />
          ) : (
            <p className="text-center text-gray-500 py-8">No hi ha despeses</p>
          )}
        </CardContent>
      </Card>

      {/* Expense Review Modal */}
      <ExpenseReviewModal
        expense={selectedExpense}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
