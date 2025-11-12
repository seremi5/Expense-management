import { useState, useMemo } from 'react'
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
import { StatusBadge } from '@/components/features/expenses/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useActiveEvents, useActiveCategories } from '@/hooks/useSettings'
import type { Expense } from '@/types/api.types'

interface AdminExpensesTableProps {
  expenses: Expense[]
  onReview: (expense: Expense) => void
}

export function AdminExpensesTable({ expenses, onReview }: AdminExpensesTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [requesterFilter, setRequesterFilter] = useState<string>('all')

  const { data: activeEvents, isLoading: isLoadingEvents } = useActiveEvents()
  const { data: activeCategories, isLoading: isLoadingCategories } = useActiveCategories()

  // Get unique requesters for filter
  const uniqueRequesters = Array.from(
    new Set(expenses.map((e) => `${e.name} ${e.surname}`))
  ).sort()

  // Sort events and categories alphabetically by label
  const sortedEvents = useMemo(() => {
    if (!activeEvents) return []
    return [...activeEvents].sort((a, b) => a.label.localeCompare(b.label))
  }, [activeEvents])

  const sortedCategories = useMemo(() => {
    if (!activeCategories) return []
    return [...activeCategories].sort((a, b) => a.label.localeCompare(b.label))
  }, [activeCategories])

  // Create a label lookup for displaying event and category names in table
  const eventLabelMap = useMemo(() => {
    return new Map(activeEvents?.map(e => [e.key, e.label]) || [])
  }, [activeEvents])

  const categoryLabelMap = useMemo(() => {
    return new Map(activeCategories?.map(c => [c.key, c.label]) || [])
  }, [activeCategories])

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        expense.invoiceNumber.toLowerCase().includes(query) ||
        expense.vendorName.toLowerCase().includes(query) ||
        expense.email.toLowerCase().includes(query) ||
        `${expense.name} ${expense.surname}`.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all' && expense.status !== statusFilter) {
      return false
    }

    // Event filter
    if (eventFilter !== 'all' && expense.event !== eventFilter) {
      return false
    }

    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false
    }

    // Requester filter
    if (requesterFilter !== 'all' && `${expense.name} ${expense.surname}` !== requesterFilter) {
      return false
    }

    return true
  })

  // Count by status
  const statusCounts = {
    all: expenses.length,
    submitted: expenses.filter((e) => e.status === 'submitted').length,
    ready_to_pay: expenses.filter((e) => e.status === 'ready_to_pay').length,
    paid: expenses.filter((e) => e.status === 'paid').length,
    declined: expenses.filter((e) => e.status === 'declined').length,
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Cerca per factura, proveïdor, email, nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estat</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tots estats ({statusCounts.all})</option>
              <option value="submitted">Enviades ({statusCounts.submitted})</option>
              <option value="ready_to_pay">Aprovades ({statusCounts.ready_to_pay})</option>
              <option value="paid">Pagades ({statusCounts.paid})</option>
              <option value="declined">Denegades ({statusCounts.declined})</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Esdeveniment</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoadingEvents}
            >
              <option value="all">
                {isLoadingEvents ? 'Carregant...' : 'Tots Esdeven.'}
              </option>
              {sortedEvents.map((event) => (
                <option key={event.key} value={event.key}>
                  {event.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoadingCategories}
            >
              <option value="all">
                {isLoadingCategories ? 'Carregant...' : 'Totes Cat.'}
              </option>
              {sortedCategories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Requester Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sol·licitant</label>
            <select
              value={requesterFilter}
              onChange={(e) => setRequesterFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tots Sol·licitants</option>
              {uniqueRequesters.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Factura</TableHead>
              <TableHead>Sol·licitant</TableHead>
              <TableHead className="hidden md:table-cell">Proveïdor</TableHead>
              <TableHead className="hidden lg:table-cell">Esdeveniment</TableHead>
              <TableHead className="hidden xl:table-cell">Categoria</TableHead>
              <TableHead className="text-right">Import</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead className="w-[120px]">Estat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                  {searchQuery ||
                  statusFilter !== 'all' ||
                  eventFilter !== 'all' ||
                  categoryFilter !== 'all' ||
                  requesterFilter !== 'all'
                    ? "No s'han trobat despeses amb aquest criteri"
                    : 'No hi ha despeses'}
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  onClick={() => onReview(expense)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="font-medium text-gray-900">
                    {expense.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {expense.name} {expense.surname}
                      </p>
                      <p className="text-xs text-gray-500">{expense.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600">
                    {expense.vendorName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-600">
                    {eventLabelMap.get(expense.event) || expense.event}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-gray-600">
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
      {(searchQuery ||
        statusFilter !== 'all' ||
        eventFilter !== 'all' ||
        categoryFilter !== 'all' ||
        requesterFilter !== 'all') && (
        <p className="text-sm text-gray-600">
          Mostrant {filteredExpenses.length} de {expenses.length} despeses
        </p>
      )}
    </div>
  )
}
