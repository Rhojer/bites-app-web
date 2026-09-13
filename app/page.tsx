import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Boxes,
  UtensilsCrossed,
  MonitorCheck,
  Wallet,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ChefHat
} from 'lucide-react'
import { SavingsTargetsCard } from '@/components/finances/savings-targets-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Consultar datos reales de la base de datos
  const [
    { data: ingredients },
    { data: recipes },
    { data: orders },
    { data: bills }
  ] = await Promise.all([
    supabase.from('ingredients').select('current_stock, min_stock, cost_per_unit'),
    supabase.from('recipes').select('id, name, price, cost_per_unit'),
    supabase.from('orders').select('id, total, status, created_at'),
    supabase.from('bills_payable').select('id, amount, due_date, status')
  ])

  // KPIs de inventario
  const totalIngredients = ingredients?.length || 0
  const criticalStock = (ingredients || []).filter((i) => i.current_stock <= i.min_stock)
  const totalStockValue = (ingredients || []).reduce((acc, curr) => acc + curr.current_stock * curr.cost_per_unit, 0)

  // KPIs de ventas y órdenes
  const totalOrders = orders?.length || 0
  const totalSales = (orders || []).reduce((acc, curr) => acc + (curr.total || 0), 0)
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

  // KPIs de facturas por pagar
  const pendingBills = (bills || []).filter((b) => b.status === 'pending')
  const totalBillsAmount = pendingBills.reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <AdminShell>
      <Navbar
        title="Resumen del Negocio"
        description="Ventas de hoy, alertas de inventario y metas del mes en un vistazo"
        actions={
          <Link href="/pos">
            <Button size="sm" className="gap-1.5 shadow-xs">
              <MonitorCheck className="size-4" />
              Abrir Punto de Venta (POS)
            </Button>
          </Link>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* KPI Cards Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Facturación Neta</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  ${totalSales.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUp className="size-3" />
                  <span>Ventas acumuladas</span>
                </div>
              </div>
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Ticket Promedio</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  ${averageTicket.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">Por comanda / orden</p>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Valor Inventario</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  ${totalStockValue.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">{totalIngredients} insumos activos</p>
              </div>
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Boxes className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Cuentas por Pagar</p>
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  ${totalBillsAmount.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">{pendingBills.length} facturas pendientes</p>
              </div>
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metas Financieras & Objetivos de Ahorro (Savings Targets) */}
        <SavingsTargetsCard
          currentSales={totalSales}
          pendingBillsAmount={totalBillsAmount}
          currentFoodCostPct={29.5}
        />

        {/* Panel de Alertas Consolidadas y Accesos Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Alertas Operativas */}
          <Card className="lg:col-span-2 border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <CardTitle className="text-sm font-semibold">Alertas Consolidadas del Sistema</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {criticalStock.length + pendingBills.length} Alertas
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Notificaciones automáticas de stock crítico y cuentas próximas a vencer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalStock.length === 0 && pendingBills.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  <ShieldCheck className="size-8 mx-auto mb-1.5 text-emerald-500 opacity-60" />
                  <p className="font-semibold text-foreground">Todo en orden operativo</p>
                  <p>No hay alertas críticas de stock ni facturas vencidas en este momento.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {criticalStock.length > 0 && (
                    <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Boxes className="size-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="font-semibold text-amber-900 dark:text-amber-200">
                            {criticalStock.length} Insumos con Stock Crítico
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            Se recomienda emitir órdenes de compra a proveedores.
                          </p>
                        </div>
                      </div>
                      <Link href="/inventory">
                        <Button size="xs" variant="outline" className="text-xs gap-1">
                          Ver Insumos <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  )}

                  {pendingBills.length > 0 && (
                    <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Clock className="size-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-200">
                            {pendingBills.length} Facturas de Proveedores Pendientes
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            Monto total por liquidar: ${totalBillsAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Link href="/finances">
                        <Button size="xs" variant="outline" className="text-xs gap-1">
                          Ver Cuentas <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accesos Rápidos a Módulos */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Módulos del Sistema</CardTitle>
              <CardDescription className="text-xs">Accesos rápidos de operación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/inventory"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="size-4 text-primary" />
                  <span className="font-medium text-foreground">Inventario & Insumos</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>

              <Link
                href="/recipes"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="size-4 text-orange-500" />
                  <span className="font-medium text-foreground">Recetas & Sub-recetas</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>

              <Link
                href="/pos"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <MonitorCheck className="size-4 text-emerald-500" />
                  <span className="font-medium text-foreground">Punto de Venta (POS)</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>

              <Link
                href="/kitchen"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ChefHat className="size-4 text-rose-500" />
                  <span className="font-medium text-foreground">Monitor de Cocina (KDS)</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>

              <Link
                href="/cash-register"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="size-4 text-blue-500" />
                  <span className="font-medium text-foreground">Caja & Egresos con Nota</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

        </div>
      </main>
    </AdminShell>
  )
}
