'use client'

import { useState } from 'react'
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  Building2,
  Trash2,
  CreditCard,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PayBillDialog } from '@/components/finances/pay-bill-dialog'
import { deleteBillAction } from '@/app/finances/actions'

export interface BillItem {
  id: string
  created_at: string
  supplier_id: string
  invoice_number: string | null
  amount: number
  due_date: string
  status: string | null
  paid_at: string | null
  notes: string | null
  supplier?: {
    id?: string
    name: string
    contact_name?: string | null
    phone?: string | null
    tax_id?: string | null
  } | null
}

interface BillsPayableTableProps {
  bills: BillItem[]
}

export function BillsPayableTable({ bills }: BillsPayableTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'due_soon' | 'overdue' | 'paid'>('all')
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<{
    id: string
    invoice_number?: string | null
    amount: number
    due_date: string
    supplierName: string
  } | null>(null)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Helper para determinar estado del semáforo
  function getBillStatusInfo(bill: BillItem) {
    if (bill.status === 'paid') {
      return {
        key: 'paid',
        label: 'Pagada',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dotColor: 'bg-emerald-500',
        icon: CheckCircle2,
        daysText: bill.paid_at ? `Liquidada el ${new Date(bill.paid_at).toLocaleDateString()}` : 'Liquidada',
      }
    }

    const dueDate = new Date(bill.due_date + 'T00:00:00')
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays)
      return {
        key: 'overdue',
        label: 'Vencida',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        dotColor: 'bg-rose-500 animate-pulse',
        icon: AlertCircle,
        daysText: `Vencida hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}`,
      }
    }

    if (diffDays <= 7) {
      return {
        key: 'due_soon',
        label: 'Próxima a Vencer',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dotColor: 'bg-amber-500',
        icon: AlertTriangle,
        daysText: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
      }
    }

    return {
      key: 'on_track',
      label: 'Al Día',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      dotColor: 'bg-blue-500',
      icon: Clock,
      daysText: `Vence en ${diffDays} días`,
    }
  }

  // Filtrado de facturas
  const filteredBills = bills.filter((b) => {
    const supplierName = b.supplier?.name?.toLowerCase() || ''
    const invoiceNumber = b.invoice_number?.toLowerCase() || ''
    const taxId = b.supplier?.tax_id?.toLowerCase() || ''
    const notes = b.notes?.toLowerCase() || ''
    const query = searchTerm.toLowerCase()

    const matchesSearch =
      supplierName.includes(query) ||
      invoiceNumber.includes(query) ||
      taxId.includes(query) ||
      notes.includes(query)

    if (!matchesSearch) return false

    const statusInfo = getBillStatusInfo(b)
    if (statusFilter === 'all') return true
    if (statusFilter === 'paid') return statusInfo.key === 'paid'
    if (statusFilter === 'overdue') return statusInfo.key === 'overdue'
    if (statusFilter === 'due_soon') return statusInfo.key === 'due_soon'
    if (statusFilter === 'pending') return statusInfo.key !== 'paid'

    return true
  })

  // Métricas del semáforo
  const pendingBills = bills.filter((b) => b.status !== 'paid')
  const overdueBills = bills.filter((b) => getBillStatusInfo(b).key === 'overdue')
  const dueSoonBills = bills.filter((b) => getBillStatusInfo(b).key === 'due_soon')
  const paidBills = bills.filter((b) => b.status === 'paid')

  const totalPendingAmount = pendingBills.reduce((acc, curr) => acc + curr.amount, 0)
  const totalOverdueAmount = overdueBills.reduce((acc, curr) => acc + curr.amount, 0)
  const totalDueSoonAmount = dueSoonBills.reduce((acc, curr) => acc + curr.amount, 0)

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que deseas eliminar esta factura por pagar?')) return
    setDeletingId(id)
    try {
      await deleteBillAction(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Semáforo de Cuentas por Pagar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total por Pagar (Pendiente)</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                ${totalPendingAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{pendingBills.length} facturas activas</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Facturas Vencidas</p>
              </div>
              <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                ${totalOverdueAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                {overdueBills.length} facturas en mora
              </p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Próximas a Vencer (7d)</p>
              </div>
              <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                ${totalDueSoonAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                {dueSoonBills.length} facturas por liquidar
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Facturas Liquidadas</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {paidBills.length}
              </p>
              <p className="text-[11px] text-muted-foreground">Historial de pagos solventes</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por proveedor, N° factura, RIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="xs"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            Todas ({bills.length})
          </Button>
          <Button
            size="xs"
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            className="text-xs"
          >
            Pendientes ({pendingBills.length})
          </Button>
          <Button
            size="xs"
            variant={statusFilter === 'overdue' ? 'destructive' : 'outline'}
            onClick={() => setStatusFilter('overdue')}
            className="text-xs gap-1"
          >
            <span className="size-1.5 rounded-full bg-rose-500" />
            Vencidas ({overdueBills.length})
          </Button>
          <Button
            size="xs"
            variant={statusFilter === 'due_soon' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('due_soon')}
            className={`text-xs gap-1 ${
              statusFilter === 'due_soon' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
            }`}
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            Próximas ({dueSoonBills.length})
          </Button>
          <Button
            size="xs"
            variant={statusFilter === 'paid' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('paid')}
            className={`text-xs gap-1 ${
              statusFilter === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
            }`}
          >
            Pagadas ({paidBills.length})
          </Button>
        </div>
      </div>

      {/* Tabla de Facturas con Semáforo y Scroll Horizontal Limpio */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Semáforo / Estado</th>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4">N° Factura</th>
                <th className="py-3.5 px-4">Fecha Vencimiento</th>
                <th className="py-3.5 px-4">Notas / Términos</th>
                <th className="py-3.5 px-4 text-right">Monto ($ USD)</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-muted-foreground">
                    <FileText className="size-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="font-semibold text-sm text-foreground">No se encontraron facturas</p>
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? 'No hay resultados que coincidan con la búsqueda.'
                        : 'Utiliza el botón "Nueva Factura por Pagar" para registrar facturas a crédito.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const statusInfo = getBillStatusInfo(bill)
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${statusInfo.dotColor}`} />
                            <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusInfo.color}`}>
                              <StatusIcon className="size-3 mr-1 inline" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono pl-3.5">
                            {statusInfo.daysText}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground text-xs">
                            {bill.supplier?.name || 'Proveedor General'}
                          </p>
                          {bill.supplier?.tax_id && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              RIF: {bill.supplier.tax_id}
                            </p>
                          )}
                          {bill.supplier?.contact_name && (
                            <p className="text-[10px] text-muted-foreground">
                              Contacto: {bill.supplier.contact_name}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {bill.invoice_number ? (
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono">
                            {bill.invoice_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Sin número</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span>{bill.due_date}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                          {bill.notes || '—'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-sm ${
                            bill.status === 'paid'
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        >
                          ${bill.amount.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {bill.status !== 'paid' ? (
                            <Button
                              size="xs"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs shadow-xs h-8 px-2.5 rounded-lg active:scale-95 transition-transform"
                              onClick={() => {
                                setSelectedBillForPayment({
                                  id: bill.id,
                                  invoice_number: bill.invoice_number,
                                  amount: bill.amount,
                                  due_date: bill.due_date,
                                  supplierName: bill.supplier?.name || 'Proveedor',
                                })
                                setIsPayOpen(true)
                              }}
                            >
                              <CreditCard className="size-3.5" />
                              Pagar
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                              Solvente
                            </Badge>
                          )}

                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive size-8 rounded-lg"
                            disabled={deletingId === bill.id}
                            onClick={() => handleDelete(bill.id)}
                            title="Eliminar factura"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para liquidar factura */}
      <PayBillDialog
        bill={selectedBillForPayment}
        open={isPayOpen}
        onOpenChange={setIsPayOpen}
      />
    </div>
  )
}
