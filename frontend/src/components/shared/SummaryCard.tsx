import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  count: number
  total: number
  variant?: 'default' | 'yellow' | 'blue' | 'green' | 'red'
}

const variantStyles = {
  default: 'text-gray-900',
  yellow: 'text-yellow-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
}

export function SummaryCard({ icon: Icon, label, count, total, variant = 'default' }: SummaryCardProps) {
  const colorClass = variantStyles[variant]

  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        <div className="space-y-3">
          {/* Icon + Label */}
          <div className="flex items-center gap-2 text-gray-600">
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
          </div>

          {/* Count */}
          <div className={`text-3xl font-bold ${colorClass}`}>{count}</div>

          {/* Total Amount */}
          <div className="text-sm text-gray-500">{formatCurrency(total)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
