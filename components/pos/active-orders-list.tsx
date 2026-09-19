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
import { OrderDetailDialog } from '@/components/pos/order-detail-dialog'
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
  const [inspectingOrder, setInspectingOrder] = useState<ActiveOrder | null>(null)

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
              <div
                key={ord.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                  isCredit
                    ? 'border-indigo-500/30 bg-card'
                    : isUnpaid
                    ? 'border-amber-500/30 bg-card'
                    : 'border-border bg-card'
                }`}
              >
                {/* Cabecera Limpia del Ticket (Toca para ver comanda completa) */}
                <div
                  onClick={() => setInspectingOrder(ord)}
                  className="p-4 pb-3 border-b bg-muted/25 flex items-start justify-between gap-3 cursor-pointer hover:bg-muted/40 transition-colors"
                  title="Toca para ver detalle o cobrar"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-muted-foreground">
                        #{ord.id.slice(0, 6).toUpperCase()}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {ord.type === 'dine_in' ? '🍽️ Salón' : ord.type === 'takeaway' ? '🛍️ Para Llevar' : '🛵 Delivery'}
                      </span>
                    </div>
                    <p className="font-bold text-base text-foreground mt-0.5 tracking-tight">
                      {ord.customer_name || (ord.table_number ? `Mesa ${ord.table_number}` : 'Cliente')}
                    </p>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    {isCredit ? (
                      <Badge className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5">
                        A Crédito
                      </Badge>
                    ) : isUnpaid ? (
                      <Badge className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5">
                        Por Cobrar
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                        Pagado
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      hace {elapsed}m
                    </span>
                  </div>
                </div>

                {/* Lista de Platos Limpia y Espaciosa */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div
                    onClick={() => setInspectingOrder(ord)}
                    className="space-y-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                    title="Toca para ver detalle o cobrar"
                  >
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-snug">
                            <span className="font-mono font-bold text-primary mr-1.5">{it.quantity}x</span>
                            {it.recipe_name}
                          </p>
                          {it.notes && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pl-4">
                              ↳ {it.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-muted-foreground font-medium shrink-0">
                          ${(it.quantity * it.unit_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Botones de Acción */}
                  <div className="pt-3 border-t space-y-3 mt-auto">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Total comanda:</span>
                      <span className="font-mono font-black text-lg text-foreground">
                        ${ord.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Botones de Control con Jerarquía Clara */}
                    <div className="grid grid-cols-2 gap-2">
                      {isUnpaid ? (
                        <Button
                          size="sm"
                          onClick={() => setPayingOrder(ord)}
                          className="font-bold text-xs h-9 rounded-xl shadow-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <DollarSign className="size-4" />
                          <span>Cobrar</span>
                        </Button>
                      ) : isCredit ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="text-xs h-9 rounded-xl text-indigo-600 dark:text-indigo-400 border-indigo-500/30 gap-1 font-semibold"
                        >
                          <Coins className="size-3.5" />
                          <span>En Deuda</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="text-xs h-9 rounded-xl text-emerald-600 border-emerald-500/30 font-semibold"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>Cobrado</span>
                        </Button>
                      )}

                      {/* Estado Operativo Cocina / Despacho */}
                      {ord.kitchen_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ord.id, 'in_preparation')}
                          className="text-xs h-9 rounded-xl font-semibold gap-1 hover:bg-muted"
                        >
                          <ChefHat className="size-3.5" /> A Cocina
                        </Button>
                      )}
                      {ord.kitchen_status === 'in_preparation' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className="text-xs h-9 rounded-xl font-semibold gap-1 text-emerald-600 hover:bg-muted"
                        >
                          <CheckCircle2 className="size-3.5" /> Listo
                        </Button>
                      )}
                      {ord.kitchen_status === 'ready' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                          className="text-xs h-9 rounded-xl font-semibold gap-1 text-primary hover:bg-muted"
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

                    {/* Botones secundarios: Ver Comanda y Anular */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => setInspectingOrder(ord)}
                        className="text-primary hover:underline font-semibold flex items-center gap-1 text-xs"
                      >
                        <Receipt className="size-3" /> Ver Comanda
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(ord.id)}
                        className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors text-xs"
                      >
                        <Trash2 className="size-3" /> Anular
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalle de Comanda (Ver, Cobrar o Guardar por Cobrar) */}
      <OrderDetailDialog
        order={inspectingOrder}
        open={Boolean(inspectingOrder)}
        onOpenChange={(open) => !open && setInspectingOrder(null)}
        onPay={(ord) => {
          setInspectingOrder(null)
          setPayingOrder(ord)
        }}
      />

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
