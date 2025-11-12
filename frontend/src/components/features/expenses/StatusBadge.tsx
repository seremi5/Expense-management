import { Badge } from '@/components/ui/badge'
import { Clock, Check, X, CreditCard } from 'lucide-react'
import { EXPENSE_STATUS, EXPENSE_STATUS_LABELS } from '@/lib/constants'

interface StatusBadgeProps {
  status: keyof typeof EXPENSE_STATUS
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    submitted: { variant: 'warning' as const, icon: Clock },
    ready_to_pay: { variant: 'default' as const, icon: CreditCard },
    paid: { variant: 'success' as const, icon: Check },
    declined: { variant: 'destructive' as const, icon: X },
  }

  const config = variants[status as keyof typeof variants] || variants.submitted
  const Icon = config.icon
  const label = EXPENSE_STATUS_LABELS[status as keyof typeof EXPENSE_STATUS_LABELS] || status

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}
