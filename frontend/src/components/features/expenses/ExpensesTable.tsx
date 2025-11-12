import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useActiveEvents, useActiveCategories } from '@/hooks/useSettings'
import type { Expense } from '@/types/api.types'

interface ExpensesTableProps {
  expenses: Expense[]
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: activeEvents } = useActiveEvents()
  const { data: activeCategories } = useActiveCategories()

  // Create label lookups for displaying event and category names
  const eventLabelMap = useMemo(() => {
    return new Map(activeEvents?.map(e => [e.key, e.label]) || [])
  }, [activeEvents])

  const categoryLabelMap = useMemo(() => {
    return new Map(activeCategories?.map(c => [c.key, c.label]) || [])
  }, [activeCategories])

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const eventLabel = eventLabelMap.get(expense.event) || expense.event
    const categoryLabel = categoryLabelMap.get(expense.category) || expense.category

    return (
      expense.invoiceNumber.toLowerCase().includes(query) ||
      expense.vendorName.toLowerCase().includes(query) ||
      eventLabel.toLowerCase().includes(query) ||
      categoryLabel.toLowerCase().includes(query) ||
      expense.totalAmount.includes(query)
    )
  })

  const handleRowClick = (expenseId: string) => {
    navigate(`/expenses/${expenseId}`)
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Cerca per número de factura, proveïdor, esdeveniment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Factura</TableHead>
              <TableHead>Proveïdor</TableHead>
              <TableHead className="hidden md:table-cell">Esdeveniment</TableHead>
              <TableHead className="hidden lg:table-cell">Categoria</TableHead>
              <TableHead className="text-right">Import</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead className="w-[140px]">Estat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  {searchQuery ? 'No s\'han trobat despeses amb aquest criteri de cerca' : 'No hi ha despeses'}
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  onClick={() => handleRowClick(expense.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium text-gray-900">
                    {expense.invoiceNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.vendorName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600">
                    {eventLabelMap.get(expense.event) || expense.event}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-600">
                    {categoryLabelMap.get(expense.category) || expense.category}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-gray-900">
                    {formatCurrency(expense.totalAmount)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-600">
                    {formatDate(expense.invoiceDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={expense.status as any} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-600">
          Mostrant {filteredExpenses.length} de {expenses.length} despeses
        </p>
      )}
    </div>
  )
}
