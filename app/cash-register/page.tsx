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

  // 1. Obtener pagos recibidos
  const { data: paymentsData } = await supabase
    .from('order_payments')
    .select('amount, created_at, payment_method_id')
    .order('created_at', { ascending: false })

  // 2. Obtener egresos registrados (de expenses / cash_expenses)
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })

  const payments = paymentsData || []
  const expenses = expensesData || []

  // Cálculos de caja
  const initialCash = 50.00 // Fondo de caja base
  const totalIncome = payments.reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  const expectedCashBalance = initialCash + totalIncome - totalExpenses

  return (
    <AdminShell>
      <Navbar
        title="Caja & Arqueo de Turno"
        description="Control de efectivo, ingresos por ventas y egresos justificados con notas de diferimiento"
        actions={<RecordExpenseDialog />}
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* KPI Cards de Caja */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Fondo Inicial de Caja</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">${initialCash.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">Apertura de turno</p>
              </div>
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Wallet className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Ingresos por Ventas</p>
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  +${totalIncome.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">{payments.length} cobros procesados</p>
              </div>
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownRight className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Egresos con Justificación</p>
                <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  -${totalExpenses.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">{expenses.length} retiros registrados</p>
              </div>
              <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-primary font-semibold">Saldo Esperado en Caja</p>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  ${expectedCashBalance.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">Fondo + Ventas - Egresos</p>
              </div>
              <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
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
