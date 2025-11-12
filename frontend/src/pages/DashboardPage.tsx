import { useNavigate } from 'react-router-dom'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExpensesTable } from '@/components/features/expenses/ExpensesTable'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SummaryCard } from '@/components/shared/SummaryCard'
import { Plus, Receipt, Clock, Check, CreditCard } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useExpenses({})

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Error carregant les despeses. Si us plau, torna-ho a provar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expenses = data?.data || []
  const hasExpenses = expenses.length > 0

  // Calculate stats with count and total for each status
  const stats = {
    total: {
      count: expenses.length,
      total: expenses.reduce((sum, e) => sum + parseFloat(e.totalAmount), 0),
    },
    pending: {
      count: expenses.filter((e) => e.status === 'submitted').length,
      total: expenses
        .filter((e) => e.status === 'submitted')
        .reduce((sum, e) => sum + parseFloat(e.totalAmount), 0),
    },
    approved: {
      count: expenses.filter((e) => e.status === 'ready_to_pay').length,
      total: expenses
        .filter((e) => e.status === 'ready_to_pay')
        .reduce((sum, e) => sum + parseFloat(e.totalAmount), 0),
    },
    paid: {
      count: expenses.filter((e) => e.status === 'paid').length,
      total: expenses
        .filter((e) => e.status === 'paid')
        .reduce((sum, e) => sum + parseFloat(e.totalAmount), 0),
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Les meves despeses</h1>
          <p className="text-gray-600 mt-1">Gestiona i consulta les teves sol·licituds</p>
        </div>
        <Button
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 gap-2"
          onClick={() => navigate('/expenses/new')}
        >
          <Plus className="h-5 w-5" />
          Nova Despesa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Receipt}
          label="Total"
          count={stats.total.count}
          total={stats.total.total}
          variant="default"
        />

        <SummaryCard
          icon={Clock}
          label="Pendent revisió"
          count={stats.pending.count}
          total={stats.pending.total}
          variant="yellow"
        />

        <SummaryCard
          icon={CreditCard}
          label="Per pagar"
          count={stats.approved.count}
          total={stats.approved.total}
          variant="blue"
        />

        <SummaryCard
          icon={Check}
          label="Completades"
          count={stats.paid.count}
          total={stats.paid.total}
          variant="green"
        />
      </div>

      {/* Expenses List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Despeses recents</h2>
        {!hasExpenses ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Receipt}
                title="No tens despeses"
                description="Comença creant la teva primera sol·licitud de despesa"
                action={{
                  label: 'Nova Despesa',
                  onClick: () => navigate('/expenses/new'),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <ExpensesTable expenses={expenses} />
        )}
      </div>
    </div>
  )
}
