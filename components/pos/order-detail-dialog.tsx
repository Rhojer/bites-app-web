'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Clock,
  UtensilsCrossed,
  Receipt,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Coins,
  FileText
} from 'lucide-react'
import { ActiveOrder } from '@/components/pos/active-orders-list'
import { formatBs, convertUsdToBs } from '@/lib/bcv'

interface OrderDetailDialogProps {
  order: ActiveOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPay: (order: ActiveOrder) => void
  bcvRate?: number
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onPay,
  bcvRate = 813.74,
}: OrderDetailDialogProps) {
  if (!order) return null

  const isUnpaid = order.payment_status === 'pending'
  const isCredit = order.payment_status === 'credit'
  const isPaid = order.payment_status === 'paid'
  const totalBs = convertUsdToBs(order.total, bcvRate)

  function getElapsedMinutes(createdAt: string) {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    return Math.floor(diffMs / 60000)
  }

  const elapsed = getElapsedMinutes(order.created_at)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-5 sm:p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                Comanda #{order.id.slice(0, 6).toUpperCase()}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {isCredit ? (
                <Badge className="bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5">
                  A Crédito
                </Badge>
              ) : isUnpaid ? (
                <Badge className="bg-amber-500 text-black text-[11px] font-bold px-2 py-0.5">
                  Por Cobrar
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5">
                  Pagado
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center justify-between pt-1">
            <span>
              {order.type === 'dine_in' ? '🍽️ Salón' : order.type === 'takeaway' ? '🛍️ Para Llevar' : '🛵 Delivery'}
              {' • '}
              <strong className="text-foreground">
                {order.customer_name || (order.table_number ? `Mesa ${order.table_number}` : 'Cliente')}
              </strong>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="size-3" /> hace {elapsed}m
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Notas generales de la orden si existen */}
          {order.notes && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold block">Nota general:</span>
                <p>{order.notes}</p>
              </div>
            </div>
          )}

          {/* Lista de Platos en la Comanda */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground block">
              Desglose de Platos ({order.items.reduce((acc, i) => acc + i.quantity, 0)} unidades):
            </span>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
                  <div className="flex items-start justify-between text-xs gap-2">
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground text-xs leading-snug">
                        <span className="font-mono text-primary font-black mr-1.5">{it.quantity}x</span>
                        {it.recipe_name}
                      </p>
                      {it.notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold pl-4">
                          ↳ {it.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-foreground block">
                        ${(it.quantity * it.unit_price).toFixed(2)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ${it.unit_price.toFixed(2)} c/u
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Totales */}
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-foreground">Total Comanda (USD):</span>
              <span className="font-mono font-black text-xl text-primary">
                ${order.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/20">
              <span className="text-muted-foreground font-medium">Equivalente BCV:</span>
              <span className="font-mono font-bold text-foreground">
                {formatBs(totalBs)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t shrink-0 flex items-center justify-between gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl text-xs font-semibold"
          >
            Guardar por Cobrar
          </Button>

          {isUnpaid ? (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onPay(order)
              }}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <DollarSign className="size-4" />
              <span>Cobrar Orden (${order.total.toFixed(2)})</span>
            </Button>
          ) : isCredit ? (
            <Button
              type="button"
              variant="secondary"
              disabled
              className="h-10 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1.5"
            >
              <Coins className="size-4" />
              <span>Cargada a Cuenta Corriente</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled
              className="h-10 rounded-xl text-xs font-bold text-emerald-600 gap-1.5"
            >
              <CheckCircle2 className="size-4" />
              <span>Orden Pagada</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
