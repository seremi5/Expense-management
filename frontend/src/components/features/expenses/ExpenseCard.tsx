import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { Calendar, FileText, Building2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useActiveEvents } from '@/hooks/useSettings'
import type { Expense } from '@/types/api.types'
import { useMemo } from 'react'

interface ExpenseCardProps {
  expense: Expense
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const navigate = useNavigate()
  const { data: activeEvents } = useActiveEvents()

  // Create a label lookup for displaying event names
  const eventLabel = useMemo(() => {
    if (!activeEvents) return expense.event
    const event = activeEvents.find(e => e.key === expense.event)
    return event?.label || expense.event
  }, [activeEvents, expense.event])

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/expenses/${expense.id}`)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-xl font-bold text-gray-900">
            {formatCurrency(expense.totalAmount)}
          </CardTitle>
          <CardDescription className="mt-1">{expense.vendorName}</CardDescription>
        </div>
        <StatusBadge status={expense.status as any} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{formatDate(expense.invoiceDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{expense.referenceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {eventLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
