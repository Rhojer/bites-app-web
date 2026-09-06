'use client'

import { useState } from 'react'
import {
  CreditCard,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  ArrowDownLeft,
  Calendar,
  Search,
  FileText
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RecordCreditPaymentDialog } from './record-credit-payment-dialog'
import { UpdateCreditDialog } from './update-credit-dialog'
import { CustomerProfile } from './customer-detail-sheet'

export interface CreditPaymentRecord {
  id: string
  created_at: string
  customer_id: string
  amount: number
  payment_method_id: string
  reference_number: string | null
  notes: string | null
  customer_name?: string
  payment_method_name?: string
}

interface CreditAccountsViewProps {
  customers: CustomerProfile[]
  creditPayments: CreditPaymentRecord[]
  paymentMethods: { id: string; name: string; currency: string | null }[]
}

export function CreditAccountsView({
  customers,
  creditPayments,
  paymentMethods,
}: CreditAccountsViewProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Metrics
  const debtors = customers.filter((c) => (c.current_debt || 0) > 0)
  const totalCreditAssigned = customers.reduce((acc, c) => acc + (c.credit_limit || 0), 0)
  const totalDebt = debtors.reduce((acc, c) => acc + (c.current_debt || 0), 0)
  const totalRecovered = creditPayments.reduce((acc, p) => acc + p.amount, 0)
  const totalAvailableCredit = Math.max(0, totalCreditAssigned - totalDebt)

  const allCustomersForPayment = customers.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    current_debt: c.current_debt,
    credit_limit: c.credit_limit,
  }))

  const filteredDebtors = debtors.filter(
    (d) =>
      d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-foreground">Gestión de Créditos & Cuentas Corrientes</h2>
          <p className="text-xs text-muted-foreground">
            Monitorea el crédito otorgado, gestiona cuentas por cobrar y asienta los abonos realizados.
          </p>
        </div>
        <RecordCreditPaymentDialog
          customers={allCustomersForPayment}
          paymentMethods={paymentMethods}
          triggerButton={
            <Button size="sm" className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
              <Receipt className="size-4" />
              <span>Registrar Abono a Deuda</span>
            </Button>
          }
        />
      </div>

      {/* Credit KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Deuda Total por Cobrar</p>
              <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                ${totalDebt.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{debtors.length} clientes con saldo deudor</p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Línea de Crédito Otorgada</p>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                ${totalCreditAssigned.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{customers.filter(c => (c.credit_limit || 0) > 0).length} clientes autorizados</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Crédito Disponible Global</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                ${totalAvailableCredit.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">Capacidad crediticia restante</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total Recuperado en Abonos</p>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                ${totalRecovered.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{creditPayments.length} abonos registrados</p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowDownLeft className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Active Debtors & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Debtors Table */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Clientes con Deuda Pendiente
              </h3>
              <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-600">
                {debtors.length}
              </Badge>
            </div>
            <div className="relative w-48">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar deudor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-7"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3 text-right">Límite</th>
                  <th className="py-2.5 px-3 text-right">Deuda</th>
                  <th className="py-2.5 px-3">Uso</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="size-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                      <p className="font-semibold text-xs text-foreground">¡Sin deudas pendientes!</p>
                      <p className="text-[11px]">Todos los clientes se encuentran al día.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map((d) => {
                    const limit = d.credit_limit || 0
                    const debt = d.current_debt || 0
                    const pct = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 100
                    const isOverLimit = limit > 0 && debt > limit

                    return (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{d.full_name || 'Sin Nombre'}</div>
                          <div className="text-[10px] text-muted-foreground">{d.phone || 'Sin teléfono'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ${limit.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          ${debt.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1 min-w-[70px]">
                            <div className="flex items-center justify-between text-[10px]">
                              <span>{pct}%</span>
                              {isOverLimit && <span className="text-[9px] text-rose-500 font-bold">!</span>}
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <RecordCreditPaymentDialog
                            customers={allCustomersForPayment}
                            paymentMethods={paymentMethods}
                            initialCustomerId={d.id}
                            triggerButton={
                              <Button size="xs" className="h-6 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                Abonar
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Credit Payments History */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="size-3.5 text-emerald-600" />
              Historial de Abonos Recientes
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {creditPayments.length} registros
            </Badge>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            <div className="max-h-[380px] overflow-y-auto divide-y">
              {creditPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <FileText className="size-6 mx-auto mb-1 opacity-30" />
                  <p className="font-semibold">No hay abonos registrados</p>
                  <p className="text-[11px]">Los abonos que registres aparecerán aquí.</p>
                </div>
              ) : (
                creditPayments.map((p) => {
                  const customer = customers.find((c) => c.id === p.customer_id)
                  const pMethod = paymentMethods.find((pm) => pm.id === p.payment_method_id)

                  return (
                    <div key={p.id} className="p-3 hover:bg-muted/30 transition-colors flex items-center justify-between text-xs">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground truncate">
                            {customer?.full_name || p.customer_name || 'Cliente'}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-600">
                            {pMethod?.name || 'Abono'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.notes || p.reference_number || 'Abono a cuenta corriente'}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>{new Date(p.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          {p.reference_number && (
                            <span className="font-mono text-[10px] ml-1">Ref: {p.reference_number}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right pl-3">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          +${p.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
