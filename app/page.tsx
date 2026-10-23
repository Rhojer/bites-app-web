import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
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
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ChefHat,
  Flame,
  ArrowRight,
  Store,
  Receipt,
  Truck,
  PlusCircle
} from 'lucide-react'
import { SavingsTargetsCard } from '@/components/finances/savings-targets-card'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const hasPosSession = cookieStore.get('bites_pos_session')?.value === 'active'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !hasPosSession) {
    redirect('/login')
  }

  // Consultar datos reales de la base de datos con campos descriptivos
  const [
    { data: ingredients },
    { data: recipes },
    { data: orders },
    { data: bills }
  ] = await Promise.all([
    supabase.from('ingredients').select('id, name, current_stock, min_stock, cost_per_unit, unit'),
    supabase.from('recipes').select('id, name, price, cost_per_unit'),
    supabase.from('orders').select('id, order_number, total, status, kitchen_status, type, created_at'),
    supabase.from('bills_payable').select('id, amount, due_date, status, invoice_number')
  ])

  // KPIs de inventario
  const totalIngredients = ingredients?.length || 0
  const criticalStock = (ingredients || [])
    .filter((i) => i.current_stock <= i.min_stock)
    .sort((a, b) => (a.current_stock / (a.min_stock || 1)) - (b.current_stock / (b.min_stock || 1)))
  const totalStockValue = (ingredients || []).reduce((acc, curr) => acc + curr.current_stock * curr.cost_per_unit, 0)

  // KPIs de ventas y órdenes
  const totalOrders = orders?.length || 0
  const totalSales = (orders || []).reduce((acc, curr) => acc + (curr.total || 0), 0)
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

  // Órdenes activas en cocina
  const activeKitchenOrders = (orders || []).filter(
    (o) => o.kitchen_status === 'pending' || o.kitchen_status === 'preparing'
  )

  // KPIs de facturas por pagar
  const pendingBills = (bills || []).filter((b) => b.status === 'pending')
  const totalBillsAmount = pendingBills.reduce((acc, curr) => acc + curr.amount, 0)

  // Saludo contextual según la hora del día
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? '¡Buen día!' : currentHour < 18 ? '¡Buenas tardes!' : '¡Buenas noches!'

  return (
    <AdminShell>
      <Navbar
        title="Panel de Operaciones"
        description="BOMBA BRISAS DEL ISIRO · Control de turno, ventas y cocina en vivo"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/kitchen">
              <Button variant="outline" size="sm" className="gap-1.5 shadow-2xs text-xs font-semibold">
                <ChefHat className="size-3.5 text-rose-500" />
                <span className="hidden sm:inline">Cocina</span>
                {activeKitchenOrders.length > 0 && (
                  <Badge className="px-1.5 py-0 text-[10px] bg-rose-500 text-white font-bold h-4">
                    {activeKitchenOrders.length}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/pos">
              <Button size="sm" className="gap-1.5 shadow-xs text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                <MonitorCheck className="size-4" />
                <span>Abrir POS</span>
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Cabecera amigable del restaurante y estado del turno */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-card border shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {greeting} Bites Street Food
              </span>
              <Badge variant="outline" className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                Servicio Activo
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sucursal <strong className="text-foreground font-semibold">Bomba Brisas del Isiro</strong> · Coro, Falcón. Supervisión operativa en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-center">
            <Link href="/pos">
              <Button variant="default" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                <PlusCircle className="size-3.5" />
                <span>Tomar Orden Rápida</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Métricas Tipográficas Limpias (Anti-Slop: Tipo sobre cromos, sin cajas idénticas con iconos en círculos) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Facturación */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-card shadow-2xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                Ventas del Turno
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                ${totalSales.toFixed(2)}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{totalOrders} {totalOrders === 1 ? 'comanda' : 'comandas'}</span>
              <span className="font-semibold text-foreground">
                ${averageTicket.toFixed(2)} prom.
              </span>
            </div>
          </div>

          {/* Cocina en Vivo */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-card shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  Cocina (KDS)
                </p>
                {activeKitchenOrders.length > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold px-1.5 py-0">
                    En marcha
                  </Badge>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
                {activeKitchenOrders.length}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
              <span>
                {activeKitchenOrders.length === 0 ? 'Sin tickets en espera' : 'Comandas por despachar'}
              </span>
              <Link href="/kitchen" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                Ver monitor <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Salud del Almacén */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-card shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  Almacén & Insumos
                </p>
                {criticalStock.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold px-1.5 py-0">
                    {criticalStock.length} bajo mínimo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold px-1.5 py-0">
                    Saludable
                  </Badge>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
                ${totalStockValue.toFixed(2)}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{totalIngredients} insumos activos</span>
              <Link href="/inventory" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                Ajustar <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Cuentas por Liquidar */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-card shadow-2xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                Cuentas por Pagar
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
                ${totalBillsAmount.toFixed(2)}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{pendingBills.length} {pendingBills.length === 1 ? 'factura pendiente' : 'facturas pendientes'}</span>
              <Link href="/finances" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                Finanzas <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Centro de Acciones Operativas Ergonómicas (Diseñado para la velocidad del restaurante) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Flame className="size-4 text-primary" />
              <span>Estaciones de Trabajo & Operación</span>
            </h2>
            <span className="text-xs text-muted-foreground">Accesos directos por rol de servicio</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* POS */}
            <Link
              href="/pos"
              className="p-4 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <MonitorCheck className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Punto de Venta (POS)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Cobro rápido en USD, Bs. BCV o Pago Móvil. Comandas para salón y delivery.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t text-[11px] font-semibold text-primary">
                Iniciar comanda →
              </div>
            </Link>

            {/* Cocina */}
            <Link
              href="/kitchen"
              className="p-4 rounded-2xl border bg-card hover:border-rose-500/50 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <ChefHat className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-rose-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Monitor de Cocina (KDS)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Visualización en vivo de pedidos entrantes, tiempos de cocción y despacho.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Ver monitor KDS →
              </div>
            </Link>

            {/* Inventario y Mermas */}
            <Link
              href="/inventory"
              className="p-4 rounded-2xl border bg-card hover:border-blue-500/50 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Boxes className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Inventario & Mermas
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Recepción de insumos de proveedores, conteo de stock y registro de desperdicio.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Gestionar existencias →
              </div>
            </Link>

            {/* Caja del Día */}
            <Link
              href="/cash-register"
              className="p-4 rounded-2xl border bg-card hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Wallet className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Caja del Día
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Apertura de turno, control de gastos en efectivo con soporte y cuadre final.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Abrir cuadre de caja →
              </div>
            </Link>
          </div>
        </div>

        {/* Panel de Alertas & Prioridades Operativas Concretas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alertas Operativas con Contexto Real (Muestra insumos específicos con nombres y cantidades) */}
          <Card className="lg:col-span-2 border shadow-2xs rounded-2xl">
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`size-4 ${criticalStock.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-sm font-bold">
                    Prioridades del Servicio de Hoy
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {criticalStock.length + pendingBills.length} {criticalStock.length + pendingBills.length === 1 ? 'atención' : 'atenciones'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Insumos que requieren reposición inmediata y compromisos financieros activos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {criticalStock.length === 0 && pendingBills.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs rounded-xl border border-dashed bg-muted/20">
                  <ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="font-bold text-foreground text-sm">Todo en orden operativo</p>
                  <p className="text-muted-foreground mt-0.5 max-w-sm mx-auto">
                    El inventario cuenta con stock superior a los mínimos de seguridad y no hay facturas pendientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Lista de insumos críticos con sus nombres reales y stocks */}
                  {criticalStock.length > 0 && (
                    <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Boxes className="size-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                            {criticalStock.length} {criticalStock.length === 1 ? 'Insumo bajo stock mínimo' : 'Insumos bajo stock mínimo'}
                          </span>
                        </div>
                        <Link href="/inventory">
                          <Button size="xs" variant="outline" className="text-xs gap-1 h-7">
                            Ir a Inventario <ChevronRight className="size-3" />
                          </Button>
                        </Link>
                      </div>

                      {/* Lista de los primeros insumos en peligro */}
                      <div className="space-y-1.5 pt-1">
                        {criticalStock.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs bg-card/60 p-2 rounded-lg border border-amber-500/10"
                          >
                            <span className="font-semibold text-foreground truncate mr-2">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0 text-[11px]">
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                Quedan {item.current_stock} {item.unit || 'uds'}
                              </span>
                              <span className="text-muted-foreground">
                                (mín. {item.min_stock})
                              </span>
                            </div>
                          </div>
                        ))}
                        {criticalStock.length > 3 && (
                          <p className="text-[11px] text-muted-foreground text-center pt-1">
                            y {criticalStock.length - 3} insumos adicionales en nivel de alerta...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Facturas pendientes */}
                  {pendingBills.length > 0 && (
                    <div className="p-3.5 rounded-xl border bg-blue-500/5 border-blue-500/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Clock className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-900 dark:text-blue-200">
                            {pendingBills.length} {pendingBills.length === 1 ? 'Factura de proveedor pendiente' : 'Facturas de proveedores pendientes'}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            Total por pagar: <strong className="text-foreground">${totalBillsAmount.toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>
                      <Link href="/finances">
                        <Button size="xs" variant="outline" className="text-xs gap-1 h-7">
                          Ver Finanzas <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menú y Costeo de Recetas */}
          <Card className="border shadow-2xs rounded-2xl flex flex-col justify-between">
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-primary" />
                <CardTitle className="text-sm font-bold">Carta & Rentabilidad</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {recipes?.length || 0} recetas configuradas con escandallo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5">
                <p className="text-xs font-semibold text-foreground">
                  Objetivo de Food Cost: ~30%
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mantén al día los costos de insumos para que el cálculo de margen por hamburguesa y combo refleje la ganancia neta exacta.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Link href="/recipes" className="w-full block">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-between h-8">
                    <span>Revisar Escandallos</span>
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </Button>
                </Link>
                <Link href="/sales" className="w-full block">
                  <Button variant="ghost" size="sm" className="w-full text-xs font-semibold justify-between h-8 text-muted-foreground hover:text-foreground">
                    <span>Historial de Ventas</span>
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metas Financieras & Objetivos de Ahorro */}
        <SavingsTargetsCard
          currentSales={totalSales}
          pendingBillsAmount={totalBillsAmount}
          currentFoodCostPct={29.5}
        />
      </main>
    </AdminShell>
  )
}
