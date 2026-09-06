'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  DollarSign,
  UtensilsCrossed,
  CheckCircle2,
  ChefHat,
  Receipt,
  MoreVertical,
  Trash2,
  AlertCircle,
  Smartphone,
  CreditCard,
  ShoppingBag,
  Coins
} from 'lucide-react'
import { updateOrderStatusAction, cancelOrderAction } from '@/app/pos/actions'
import { PayOrderDialog } from '@/components/pos/pay-order-dialog'
import { CustomerOption } from '@/components/pos/customer-selector'

export interface ActiveOrderItem {
  id: string
  recipe_name: string
  quantity: number
  unit_price: number
  notes: string | null
}

export interface ActiveOrder {
  id: string
  created_at: string
  type: string
  status: string | null
  payment_status: string | null
  kitchen_status: string | null
  customer_id?: string | null
  customer_name: string | null
  table_number?: string | null
  table_name?: string | null
  notes?: string | null
  total: number
  items: ActiveOrderItem[]
}

interface ActiveOrdersListProps {
  orders: ActiveOrder[]
  customers?: CustomerOption[]
}

export function ActiveOrdersList({ orders, customers = [] }: ActiveOrdersListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [payingOrder, setPayingOrder] = useState<ActiveOrder | null>(null)

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')

  const filteredOrders = activeOrders.filter((o) => {
    if (filterStatus === 'ALL') return true
    if (filterStatus === 'UNPAID') return o.payment_status === 'pending'
    if (filterStatus === 'CREDIT') return o.payment_status === 'credit'
    if (filterStatus === 'PREPARING') return o.kitchen_status === 'in_preparation' || o.kitchen_status === 'pending'
    if (filterStatus === 'READY') return o.kitchen_status === 'ready'
    return true
  })

  async function handleUpdateStatus(orderId: string, nextStatus: 'in_preparation' | 'ready' | 'delivered') {
    try {
      await updateOrderStatusAction(orderId, {
        kitchen_status: nextStatus,
        status: nextStatus === 'delivered' ? 'completed' : 'active',
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado')
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) return
    try {
      await cancelOrderAction(orderId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar orden')
    }
  }

  // Helper para minutos transcurridos
  function getElapsedMinutes(createdAt: string) {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    return Math.floor(diffMs / 60000)
  }

  return (
    <div className="space-y-4">
      {/* Filtros Rápidos */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Button
            size="sm"
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('ALL')}
            className="text-xs h-8 px-3 rounded-xl font-medium"
          >
            Todas ({activeOrders.length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'UNPAID' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('UNPAID')}
            className="text-xs h-8 px-3 rounded-xl font-medium"
          >
            Por Cobrar ({activeOrders.filter((o) => o.payment_status === 'pending').length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'CREDIT' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('CREDIT')}
            className="text-xs h-8 px-3 rounded-xl font-medium"
          >
            A Crédito ({activeOrders.filter((o) => o.payment_status === 'credit').length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'PREPARING' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('PREPARING')}
            className="text-xs h-8 px-3 rounded-xl font-medium"
          >
            En Cocina ({activeOrders.filter((o) => o.kitchen_status === 'in_preparation' || o.kitchen_status === 'pending').length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'READY' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('READY')}
            className="text-xs h-8 px-3 rounded-xl font-medium"
          >
            Listas ({activeOrders.filter((o) => o.kitchen_status === 'ready').length})
          </Button>
        </div>
      </div>

      {/* Grid de Pedidos Activos */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center border rounded-2xl bg-card text-muted-foreground space-y-3">
          <UtensilsCrossed className="size-10 mx-auto text-muted-foreground/30" />
          <p className="font-semibold text-sm text-foreground">No hay comandas con este filtro</p>
          <p className="text-xs max-w-sm mx-auto">
            Utiliza el botón &quot;+ Nuevo Pedido&quot; para abrir una comanda de salón, para llevar, delivery o a crédito.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const elapsed = getElapsedMinutes(ord.created_at)
            const isUnpaid = ord.payment_status === 'pending'
            const isCredit = ord.payment_status === 'credit'
            const isReady = ord.kitchen_status === 'ready'
            const isDelivered = ord.kitchen_status === 'delivered'

            return (
              <Card
                key={ord.id}
                className={`border rounded-2xl shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                  isCredit
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : isUnpaid
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'bg-card'
                }`}
              >
                <CardHeader className="p-4 pb-2 border-b bg-muted/20">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-foreground">
                          #{ord.id.slice(0, 8)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 font-semibold"
                        >
                          {ord.type === 'dine_in' ? '🍽️ Salón' : ord.type === 'takeaway' ? '🛍️ Para Llevar' : '🛵 Delivery'}
                        </Badge>
                      </div>
                      <p className="font-bold text-sm text-foreground mt-1">
                        {ord.customer_name || (ord.table_number ? `Mesa ${ord.table_number}` : 'Cliente')}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                        <Clock className="size-3" />
                        <span>hace {elapsed} min</span>
                      </div>
                      {isCredit ? (
                        <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                          A Crédito (Deuda)
                        </Badge>
                      ) : isUnpaid ? (
                        <Badge className="bg-amber-500 text-black text-[10px] font-bold">
                          Por Cobrar
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                          Pagado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Lista de Platos */}
                  <div className="space-y-1.5 flex-1">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-border/30 last:border-0">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground">
                            {it.quantity}x {it.recipe_name}
                          </span>
                          {it.notes && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              📝 {it.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-muted-foreground shrink-0 font-medium">
                          ${(it.quantity * it.unit_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total y Estado Operativo */}
                  <div className="pt-2 border-t space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Total comanda:</span>
                      <span className="font-mono font-black text-base text-primary">
                        ${ord.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Acciones para la Dueña / Cajera */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {isUnpaid ? (
                        <Button
                          size="sm"
                          onClick={() => setPayingOrder(ord)}
                          className="font-bold text-xs h-9 rounded-xl shadow-xs gap-1.5"
                        >
                          <DollarSign className="size-4" />
                          <span>Cobrar (${ord.total.toFixed(2)})</span>
                        </Button>
                      ) : isCredit ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="text-xs h-9 rounded-xl text-indigo-700 dark:text-indigo-300 border-indigo-500/30 gap-1 font-semibold"
                        >
                          <Coins className="size-3.5" />
                          <span>Cargado a Deuda</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="text-xs h-9 rounded-xl text-emerald-600 border-emerald-500/30"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>Cobrado</span>
                        </Button>
                      )}

                      {/* Botón de Estado de Cocina / Entrega */}
                      {ord.kitchen_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ord.id, 'in_preparation')}
                          className="text-xs h-9 rounded-xl font-semibold gap-1"
                        >
                          <ChefHat className="size-3.5" /> En Cocina
                        </Button>
                      )}
                      {ord.kitchen_status === 'in_preparation' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className="text-xs h-9 rounded-xl font-semibold gap-1 text-emerald-600"
                        >
                          <CheckCircle2 className="size-3.5" /> Marcar Listo
                        </Button>
                      )}
                      {ord.kitchen_status === 'ready' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                          className="text-xs h-9 rounded-xl font-semibold gap-1"
                        >
                          <CheckCircle2 className="size-3.5" /> Despachar
                        </Button>
                      )}
                      {ord.kitchen_status === 'delivered' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="text-xs h-9 rounded-xl text-muted-foreground"
                        >
                          Entregado
                        </Button>
                      )}
                    </div>

                    {/* Botón secundario para cancelar comanda */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        type="button"
                        onClick={() => handleCancel(ord.id)}
                        className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="size-3" /> Anular comanda
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Cobro */}
      <PayOrderDialog
        order={payingOrder}
        customers={customers}
        open={Boolean(payingOrder)}
        onOpenChange={(open) => !open && setPayingOrder(null)}
      />
    </div>
  )
}
