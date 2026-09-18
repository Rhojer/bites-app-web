'use client'

import { useState } from 'react'
import { Plus, Receipt, LayoutGrid, History, DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewOrderDialog } from '@/components/pos/new-order-dialog'
import { ActiveOrdersList, ActiveOrder } from '@/components/pos/active-orders-list'
import { PosTerminal } from '@/components/pos/pos-terminal'

import { CustomerOption } from '@/components/pos/customer-selector'

interface RecipeItem {
  id: string
  name: string
  price: number
  category: string
  type: string
}

interface TableItem {
  id: string
  number: string
  name: string | null
  status: string
}

interface PosDashboardViewProps {
  recipes: RecipeItem[]
  tables: TableItem[]
  activeOrders: ActiveOrder[]
  todayOrders: ActiveOrder[]
  customers?: CustomerOption[]
  recipeIngredientsMap?: Record<string, string[]>
}

export function PosDashboardView({
  recipes,
  tables,
  activeOrders,
  todayOrders,
  customers = [],
  recipeIngredientsMap = {},
}: PosDashboardViewProps) {
  const [activeTab, setActiveTab] = useState('active-orders')

  const totalActiveCount = activeOrders.filter((o) => o.status !== 'cancelled').length
  const unpaidCount = activeOrders.filter((o) => o.payment_status === 'pending' && o.status !== 'cancelled').length
  const totalBilledToday = todayOrders
    .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Barra de Acciones y Métricas Rápidas Estilizada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border">
        <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-6 divide-x divide-border/60">
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Activas</p>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-foreground">{totalActiveCount}</p>
          </div>

          <div className="pl-3 sm:pl-6 space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Por Cobrar</p>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
              {unpaidCount}
            </p>
          </div>

          <div className="pl-3 sm:pl-6 space-y-0.5">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Ventas Hoy</p>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              ${totalBilledToday.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Botón Principal para Nuevo Pedido Modal */}
        <div className="flex items-center justify-end shrink-0">
          <NewOrderDialog
            recipes={recipes}
            tables={tables}
            customers={customers}
            recipeIngredientsMap={recipeIngredientsMap}
            trigger={
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-sm gap-2 shadow-xs active:scale-95 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4.5" />
                <span>Nuevo Pedido</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Tabs de Navegación del POS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="p-1 rounded-xl bg-muted/60 border h-11 inline-flex items-center">
          <TabsTrigger
            value="active-orders"
            className="rounded-lg px-3.5 py-1.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Receipt className="size-4 text-primary" />
            <span>Comandas Activas</span>
            {totalActiveCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 rounded-full font-mono bg-primary/10 text-primary border-primary/20"
              >
                {totalActiveCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="fast-catalog"
            className="rounded-lg px-3.5 py-1.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <LayoutGrid className="size-4" />
            <span>Terminal Rápida (Catálogo)</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="rounded-lg px-3.5 py-1.5 text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <History className="size-4" />
            <span>Historial ({todayOrders.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Pedidos Activos (Comandas Abiertas) */}
        <TabsContent value="active-orders" className="space-y-4 pt-1">
          <ActiveOrdersList orders={activeOrders} customers={customers} />
        </TabsContent>

        {/* 2. Terminal Rápida de Catálogo Directo */}
        <TabsContent value="fast-catalog" className="pt-1">
          <PosTerminal
            recipes={recipes}
            tables={tables}
            customers={customers}
            recipeIngredientsMap={recipeIngredientsMap}
          />
        </TabsContent>

        {/* 3. Historial del Día */}
        <TabsContent value="history" className="space-y-4 pt-1">
          <Card className="border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Comanda #</th>
                    <th className="p-3.5">Hora</th>
                    <th className="p-3.5">Cliente / Mesa</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Estado Pago</th>
                    <th className="p-3.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-medium">
                  {todayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No hay ventas registradas el día de hoy.
                      </td>
                    </tr>
                  ) : (
                    todayOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/20">
                        <td className="p-3.5 font-mono font-bold text-foreground">
                          #{ord.id.slice(0, 8)}
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono">
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 font-bold text-foreground">
                          {ord.customer_name || 'Salón'}
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {ord.type === 'dine_in' ? '🍽️ Salón' : ord.type === 'takeaway' ? '🛍️ Para Llevar' : '🛵 Delivery'}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          {ord.payment_status === 'paid' ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                              Pagado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-black text-[10px] font-bold">
                              Por Cobrar
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-sm text-foreground">
                          ${ord.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
