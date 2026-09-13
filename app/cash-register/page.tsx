import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordExpenseDialog } from '@/components/cash-register/record-expense-dialog'
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign, Clock, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'

export default async function CashRegisterPage() {
  const supabase = await createClient()

  // 1. Obtener pagos, egresos y métodos de pago
  const [
    { data: paymentsData },
    { data: expensesData },
    { data: cashExpensesData },
    { data: paymentMethodsData }
  ] = await Promise.all([
    supabase.from('order_payments').select('amount, created_at, reference_number, payment_method_id').order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('cash_expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('payment_methods').select('id, name, currency')
  ])

  const payments = paymentsData || []
  const expenses = expensesData || []
  const methods = paymentMethodsData || []

  const methodMap = new Map<string, { name: string; currency: string | null }>()
  methods.forEach((m) => methodMap.set(m.id, m))

  // Clasificación de pagos por Bóveda
  let cashUSDIncome = 0
  let cashBsIncome = 0
  let bankBsIncome = 0
  let bankUSDIncome = 0

  payments.forEach((p) => {
    const m = methodMap.get(p.payment_method_id)
    const methodName = m?.name || ''
    const ref = p.reference_number || ''

    if (methodName.includes('Efectivo USD') || ref.includes('EFECTIVO-USD') || ref === 'POS-EFECTIVO') {
      cashUSDIncome += p.amount
    } else if (methodName.includes('Efectivo Bs') || ref.includes('EFECTIVO-BS')) {
      cashBsIncome += p.amount
    } else if (methodName.includes('Pago Móvil') || methodName.includes('Punto') || methodName.includes('Tarjeta')) {
      bankBsIncome += p.amount
    } else if (methodName.includes('Zelle')) {
      bankUSDIncome += p.amount
    } else {
      cashUSDIncome += p.amount
    }
  })

  // Fondos iniciales y Egresos
  const initialCashUSD = 50.00
  const initialCashBs = 0.00
  const totalExpensesUSD = expenses.reduce((acc, curr) => acc + curr.amount, 0)

  const balanceCashUSD = initialCashUSD + cashUSDIncome - totalExpensesUSD
  const balanceCashBs = initialCashBs + cashBsIncome
  const balanceBankBs = bankBsIncome
  const balanceBankUSD = bankUSDIncome

  return (
    <AdminShell>
      <Navbar
        title="Caja del Día"
        description="Efectivo en gaveta, transferencias bancarias y salidas de dinero justificadas"
        actions={<RecordExpenseDialog />}
      />

      <main className="p-6 space-y-6 max-w-7xl">
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
                  ${balanceCashUSD.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  +${cashUSDIncome.toFixed(2)} ventas | -${totalExpensesUSD.toFixed(2)} egresos
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
                  ${balanceCashBs.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Billetes en bolívares en caja
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
                  <span className="text-xs text-foreground font-bold">🏦 Banco / Pago Móvil</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Digital Bs
                  </Badge>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground">
                  ${balanceBankBs.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Acreditado con Nº Referencia
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
                  <span className="text-xs text-foreground font-bold">📱 Banco USD (Zelle)</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-500/10 text-purple-600 border-purple-500/30">
                    Digital $
                  </Badge>
                </div>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground">
                  ${balanceBankUSD.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Cuentas internacionales
                </p>
              </div>
              <div className="size-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <DollarSign className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

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
