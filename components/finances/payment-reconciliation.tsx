'use client'

import { useState } from 'react'
import {
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  ArrowDownRight,
  TrendingDown,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export interface PaymentMethodItem {
  id: string
  name: string
  currency: string | null
  commission_percentage: number | null
  commission_fixed: number | null
  is_active: boolean | null
}

export interface PaymentTransaction {
  id: string
  created_at: string
  order_id: string
  payment_method_id: string
  amount: number
  reference_number: string | null
  methodName?: string
  commission_percentage?: number
  commission_fixed?: number
}

interface PaymentReconciliationProps {
  paymentMethods: PaymentMethodItem[]
  payments: PaymentTransaction[]
}

export function PaymentReconciliation({ paymentMethods, payments }: PaymentReconciliationProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Map icons for common payment methods
  function getMethodIcon(name: string) {
    const lower = name.toLowerCase()
    if (lower.includes('efectivo') || lower.includes('cash')) return Wallet
    if (lower.includes('zelle')) return Landmark
    if (lower.includes('pago móvil') || lower.includes('movil') || lower.includes('mobile')) return Smartphone
    if (lower.includes('pos') || lower.includes('tarjeta') || lower.includes('punto')) return CreditCard
    return DollarSign
  }

  // Calculate summary per payment method
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0)

  const methodSummaries = paymentMethods.map((pm) => {
    const methodPayments = payments.filter((p) => p.payment_method_id === pm.id)
    const txCount = methodPayments.length
    const grossAmount = methodPayments.reduce((acc, curr) => acc + curr.amount, 0)
    const commPct = pm.commission_percentage || 0
    const commFixed = pm.commission_fixed || 0

    // Commission = Gross * (commPct / 100) + (commFixed * txCount)
    const totalCommission = (grossAmount * commPct) / 100 + commFixed * txCount
    const netAmount = Math.max(0, grossAmount - totalCommission)
    const sharePercentage = totalRevenue > 0 ? (grossAmount / totalRevenue) * 100 : 0

    return {
      ...pm,
      txCount,
      grossAmount,
      totalCommission,
      netAmount,
      sharePercentage,
    }
  })

  // Also include payments that might not match an existing method
  const matchedMethodIds = new Set(paymentMethods.map((pm) => pm.id))
  const unmatchedPayments = payments.filter((p) => !matchedMethodIds.has(p.payment_method_id))
  if (unmatchedPayments.length > 0) {
    const unmatchedGross = unmatchedPayments.reduce((acc, curr) => acc + curr.amount, 0)
    methodSummaries.push({
      id: 'unmatched',
      name: 'Otros / No categorizado',
      currency: 'USD',
      commission_percentage: 0,
      commission_fixed: 0,
      is_active: true,
      txCount: unmatchedPayments.length,
      grossAmount: unmatchedGross,
      totalCommission: 0,
      netAmount: unmatchedGross,
      sharePercentage: totalRevenue > 0 ? (unmatchedGross / totalRevenue) * 100 : 0,
    })
  }

  const totalCommissions = methodSummaries.reduce((acc, curr) => acc + curr.totalCommission, 0)
  const totalNet = totalRevenue - totalCommissions

  // Filtered transactions for the reconciliation ledger
  const filteredLedger = payments.filter((p) => {
    const ref = p.reference_number?.toLowerCase() || ''
    const method = p.methodName?.toLowerCase() || ''
    const order = p.order_id?.toLowerCase() || ''
    const query = searchTerm.toLowerCase()

    return ref.includes(query) || method.includes(query) || order.includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Resumen Global de Conciliación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Recaudación Bruta Total</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                +${totalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{payments.length} transacciones procesadas</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Comisiones Bancarias Deducidas</p>
              <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                -${totalCommissions.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {totalRevenue > 0 ? ((totalCommissions / totalRevenue) * 100).toFixed(2) : '0'}% de costo financiero
              </p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-primary font-semibold">Fondos Netos Disponibles</p>
              <p className="text-2xl font-bold tracking-tight text-primary">
                ${totalNet.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">Bruto menos comisiones bancarias</p>
            </div>
            <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas por Método de Pago */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="size-4 text-primary" />
          Desglose y Conciliación por Pasarela / Método de Pago
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {methodSummaries.map((method) => {
            const MethodIcon = getMethodIcon(method.name)
            return (
              <Card key={method.id} className="border shadow-xs hover:border-primary/40 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <MethodIcon className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{method.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {method.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {method.sharePercentage.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Recaudado Bruto:</span>
                      <span className="font-mono font-bold text-foreground">
                        ${method.grossAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span className="text-[11px]">
                        Comisión ({method.commission_percentage || 0}%{method.commission_fixed ? ` + $${method.commission_fixed}` : ''}):
                      </span>
                      <span className="font-mono font-semibold">
                        -${method.totalCommission.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t">
                      <span className="font-semibold text-foreground text-[11px]">Neto Liquidado:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${method.netAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground bg-muted/40 p-1.5 rounded text-center">
                    {method.txCount} {method.txCount === 1 ? 'cobro procesado' : 'cobros procesados'}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Historial de Transacciones Conciliadas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Libro Mayor de Transacciones y Referencias de Cobro
            </h3>
            <p className="text-xs text-muted-foreground">
              Comprobantes, referencias y liquidación individual de órdenes
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por referencia, orden o método..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-8"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4">Referencia / Comprobante</th>
                  <th className="py-3 px-4 text-right">Monto Bruto</th>
                  <th className="py-3 px-4 text-right">Comisión Bancaria</th>
                  <th className="py-3 px-4 text-right">Monto Neto Real</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground">
                      <CreditCard className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No hay transacciones registradas</p>
                      <p className="text-xs">
                        Las ventas cobradas a través del POS aparecerán automáticamente en esta conciliación.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((p) => {
                    const commPct = p.commission_percentage || 0
                    const commFixed = p.commission_fixed || 0
                    const commAmount = (p.amount * commPct) / 100 + commFixed
                    const netAmount = Math.max(0, p.amount - commAmount)

                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>

                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {p.methodName || 'Método POS'}
                          </Badge>
                        </td>

                        <td className="py-2.5 px-4 font-mono text-[11px] text-foreground">
                          {p.reference_number || (
                            <span className="text-muted-foreground italic">POS-{p.id.slice(0, 6)}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                          ${p.amount.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-medium">
                          {commAmount > 0 ? `-$${commAmount.toFixed(2)}` : '$0.00'}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${netAmount.toFixed(2)}
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
    </div>
  )
}
