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
}

export function PosDashboardView({
  recipes,
  tables,
  activeOrders,
  todayOrders,
  customers = [],
}: PosDashboardViewProps) {
  const [activeTab, setActiveTab] = useState('active-orders')

  const totalActiveCount = activeOrders.filter((o) => o.status !== 'cancelled').length
  const unpaidCount = activeOrders.filter((o) => o.payment_status === 'pending' && o.status !== 'cancelled').length
  const totalBilledToday = todayOrders
    .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Barra de Acciones y Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-center">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Comandas Activas</p>
              <p className="text-2xl font-mono font-extrabold text-foreground">{totalActiveCount}</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Por Cobrar</p>
              <p className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {unpaidCount}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Receipt className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Ventas Hoy</p>
              <p className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                ${totalBilledToday.toFixed(2)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Botón Principal para Nuevo Pedido Modal */}
        <div className="flex items-center justify-end">
          <NewOrderDialog
            recipes={recipes}
            tables={tables}
            customers={customers}
            trigger={
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-6 rounded-2xl font-extrabold text-sm gap-2.5 shadow-md active:scale-95 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-5" />
                <span>+ Nuevo Pedido</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Tabs de Navegación del POS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="p-1 rounded-2xl bg-muted/60 border h-12 inline-flex items-center">
          <TabsTrigger
            value="active-orders"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Receipt className="size-4" />
            <span>Pedidos Activos</span>
            {totalActiveCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0 rounded-full font-mono bg-background/50 text-foreground"
              >
                {totalActiveCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="fast-catalog"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all"
          >
            <LayoutGrid className="size-4" />
            <span>Terminal Rápida (Catálogo)</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="rounded-xl px-4 py-2 text-xs font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all"
          >
            <History className="size-4" />
            <span>Historial del Día ({todayOrders.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Pedidos Activos (Comandas Abiertas) */}
        <TabsContent value="active-orders" className="space-y-4 pt-1">
          <ActiveOrdersList orders={activeOrders} customers={customers} />
        </TabsContent>

        {/* 2. Terminal Rápida de Catálogo Directo */}
        <TabsContent value="fast-catalog" className="pt-1">
          <PosTerminal recipes={recipes} tables={tables} customers={customers} />
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
