import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordExpenseDialog } from '@/components/cash-register/record-expense-dialog'
import { CurrencyExchangeDialog } from '@/components/cash-register/currency-exchange-dialog'
import { calculateMultiVaultBalances, VaultType } from '@/lib/domain/cash-register'
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign, Clock, FileText, CheckCircle2, AlertTriangle, ArrowLeftRight } from 'lucide-react'

export default async function CashRegisterPage() {
  const supabase = await createClient()

  // 1. Obtener pagos, egresos, canjes y métodos de pago
  const [
    { data: paymentsData },
    { data: expensesData },
    { data: exchangesData },
    { data: paymentMethodsData }
  ] = await Promise.all([
    supabase.from('order_payments').select('*').order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
    (supabase as any).from('currency_exchanges').select('*').order('created_at', { ascending: false }),
    supabase.from('payment_methods').select('id, name, currency')
  ])

  const payments: any[] = paymentsData || []
  const expenses: any[] = expensesData || []
  const exchanges: any[] = (exchangesData as any[]) || []
  const methods = paymentMethodsData || []

  const methodMap = new Map<string, { name: string; currency: string | null }>()
  methods.forEach((m) => methodMap.set(m.id, m))

  // Calcular balances estáticos de las 4 bóvedas usando la lógica pura de dominio
  const formattedPayments = payments.map((p) => {
    const m = methodMap.get(p.payment_method_id)
    return {
      amount: p.amount,
      amount_currency: p.amount_currency,
      currency: p.currency,
      exchange_rate: p.exchange_rate,
      vault: p.vault as VaultType,
      payment_method_name: m?.name || p.reference_number || '',
      created_at: p.created_at,
    }
  })

  const formattedExpenses = expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    category: e.category,
    notes: e.description,
    vault: 'cash_usd' as VaultType,
    currency: 'USD',
    created_at: e.created_at,
  }))

  const vaultBalances = calculateMultiVaultBalances({
    initialBalances: {
      cash_usd: 50.00,
      cash_ves: 0.00,
      bank_ves: 0.00,
      bank_usd: 0.00,
    },
    payments: formattedPayments,
    expenses: formattedExpenses,
    exchanges: exchanges.map((ex: any) => ({
      from_vault: ex.from_vault as VaultType,
      to_vault: ex.to_vault as VaultType,
      from_amount: ex.from_amount,
      from_currency: ex.from_currency as 'USD' | 'VES',
      to_amount: ex.to_amount,
      to_currency: ex.to_currency as 'USD' | 'VES',
      exchange_rate: ex.exchange_rate,
      notes: ex.notes,
      created_at: ex.created_at,
    })),
    currentBcvRate: 842.20,
  })

  return (
    <AdminShell>
      <Navbar
        title="Caja del Día"
        description="Efectivo en gaveta, transferencias bancarias y salidas de dinero justificadas"
        actions={
          <div className="flex items-center gap-2">
            <CurrencyExchangeDialog />
            <RecordExpenseDialog />
          </div>
        }
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Total Consolidado en Bóvedas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent gap-3">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Patrimonio Total en Bóvedas (Consolidado)
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
              ${vaultBalances.totalEquivalentUSD.toFixed(2)} USD
            </p>
            <p className="text-xs text-muted-foreground">
              Suma de efectivo y cuentas bancarias en dólares y bolívares.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-card text-xs font-semibold py-1 px-3 border shadow-xs">
              4 Bóvedas Operativas
            </Badge>
          </div>
        </div>

        {/* KPI Cards de Bóvedas Multicaja */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bóveda 1: Gaveta Efectivo USD */}
          <Card className="border shadow-xs bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground font-bold">💵 Gaveta Efectivo USD</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Físico $
                  </Badge>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground">
                  ${vaultBalances.cash_usd.nominal.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Billetes en dólares en gaveta
                </p>
              </div>
              <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono">
                $
              </div>
            </CardContent>
          </Card>

          {/* Bóveda 2: Gaveta Efectivo Bs */}
          <Card className="border shadow-xs bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground font-bold">🇻🇪 Gaveta Efectivo Bs</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Físico Bs
                  </Badge>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground">
                  Bs. {vaultBalances.cash_ves.nominal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Billetes en bolívares en gaveta
                </p>
              </div>
              <div className="size-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                Bs.
              </div>
            </CardContent>
          </Card>

          {/* Bóveda 3: Banco / Pago Móvil */}
          <Card className="border shadow-xs bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground font-bold">🏦 Banco Bolívares</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Pago Móvil / POS
                  </Badge>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground">
                  Bs. {vaultBalances.bank_ves.nominal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Transferencias y puntos de venta
                </p>
              </div>
              <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <ArrowDownRight className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Bóveda 4: Banco USD / Zelle */}
          <Card className="border shadow-xs bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground font-bold">🌐 Banco USD (Zelle)</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-500/10 text-purple-600 border-purple-500/30">
                    Digital $
                  </Badge>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground">
                  ${vaultBalances.bank_usd.nominal.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Cuentas internacionales / Divisas
                </p>
              </div>
              <div className="size-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <DollarSign className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Canjes de Divisas y Transferencias */}
        {exchanges.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Historial de Canjes y Transferencias entre Bóvedas</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {exchanges.length} Canjes Registrados
              </Badge>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Origen ➔ Destino</th>
                      <th className="py-3 px-4 text-right">Monto Retirado</th>
                      <th className="py-3 px-4 text-right">Monto Depositado</th>
                      <th className="py-3 px-4 text-right">Tasa Usada</th>
                      <th className="py-3 px-4">Motivo / Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {exchanges.map((ex: any) => (
                      <tr key={ex.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {new Date(ex.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span className="capitalize">{ex.from_vault.replace('_', ' ')}</span>
                          <span className="text-muted-foreground mx-1.5">➔</span>
                          <span className="capitalize text-primary">{ex.to_vault.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {ex.from_currency === 'USD' ? `$${Number(ex.from_amount).toFixed(2)}` : `Bs. ${Number(ex.from_amount).toFixed(2)}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {ex.to_currency === 'USD' ? `$${Number(ex.to_amount).toFixed(2)}` : `Bs. ${Number(ex.to_amount).toFixed(2)}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {ex.exchange_rate} Bs/$
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {ex.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Egresos y Salidas de Dinero con Nota */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-rose-500" />
              <h2 className="text-sm font-semibold text-foreground">Historial de Egresos y Salidas con Justificación</h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {expenses.length} Egresos Registrados
            </Badge>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3.5 px-4">Fecha / Hora</th>
                    <th className="py-3.5 px-4">Categoría del Gasto</th>
                    <th className="py-3.5 px-4">Nota de Justificación (En qué se difirió)</th>
                    <th className="py-3.5 px-4 text-right">Monto Retirado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-14 text-muted-foreground">
                        <FileText className="size-10 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="font-semibold text-sm text-foreground">No hay egresos registrados en este turno</p>
                        <p className="text-xs text-muted-foreground">Usa el botón &quot;Registrar Egreso de Caja&quot; para asentar una salida de dinero justificada.</p>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {new Date(exp.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-md">
                            {exp.category}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-foreground text-xs leading-relaxed">{exp.description}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                          -${exp.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}
