'use client'

import { useState } from 'react'
import {
  FileSpreadsheet,
  Building2,
  Zap,
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  Layers,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { deleteExpenseAction } from '@/app/finances/actions'

export interface ExpenseItem {
  id: string
  created_at: string
  category: string
  type: string
  amount: number
  date: string
  description: string | null
  receipt_url?: string | null
}

interface ExpensesTableProps {
  expenses: ExpenseItem[]
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'variable'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fixedExpenses = expenses.filter((e) => e.type === 'fixed')
  const variableExpenses = expenses.filter((e) => e.type !== 'fixed') // default is variable

  const totalFixed = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const totalVariable = variableExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpenses = totalFixed + totalVariable

  const filteredExpenses = expenses.filter((e) => {
    const desc = e.description?.toLowerCase() || ''
    const cat = e.category?.toLowerCase() || ''
    const query = searchTerm.toLowerCase()

    const matchesSearch = desc.includes(query) || cat.includes(query)
    if (!matchesSearch) return false

    if (typeFilter === 'fixed') return e.type === 'fixed'
    if (typeFilter === 'variable') return e.type !== 'fixed'

    return true
  })

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este registro de gasto?')) return
    setDeletingId(id)
    try {
      await deleteExpenseAction(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Gastos Operativos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total Gastos Operativos (Opex)</p>
              <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                ${totalExpenses.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{expenses.length} registros totales</p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Gastos Fijos</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                ${totalFixed.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {fixedExpenses.length} fijos ({totalExpenses > 0 ? ((totalFixed / totalExpenses) * 100).toFixed(1) : '0'}%)
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Gastos Variables</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                ${totalVariable.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {variableExpenses.length} variables ({totalExpenses > 0 ? ((totalVariable / totalExpenses) * 100).toFixed(1) : '0'}%)
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por categoría o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Button
            size="xs"
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
            className="text-xs"
          >
            Todos ({expenses.length})
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'fixed' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('fixed')}
            className="text-xs gap-1"
          >
            <Building2 className="size-3" />
            Fijos ({fixedExpenses.length})
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'variable' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('variable')}
            className="text-xs gap-1"
          >
            <Zap className="size-3" />
            Variables ({variableExpenses.length})
          </Button>
        </div>
      </div>

      {/* Tabla de Gastos con Scroll Limpio */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Descripción / Justificación</th>
                <th className="py-3.5 px-4 text-right">Monto ($ USD)</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-muted-foreground">
                    <FileSpreadsheet className="size-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="font-semibold text-sm text-foreground">No hay gastos operativos registrados</p>
                    <p className="text-xs text-muted-foreground">
                      Utiliza el botón &quot;Registrar Gasto Operativo&quot; para añadir egresos fijos o variables.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isFixed = exp.type === 'fixed'

                  return (
                    <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          <span>{exp.date || new Date(exp.created_at).toISOString().split('T')[0]}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isFixed
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isFixed ? 'Gasto Fijo' : 'Gasto Variable'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground">{exp.category}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-foreground text-xs leading-relaxed">{exp.description || '—'}</p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        -${exp.amount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive size-8 rounded-lg"
                          disabled={deletingId === exp.id}
                          onClick={() => handleDelete(exp.id)}
                          title="Eliminar gasto"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
