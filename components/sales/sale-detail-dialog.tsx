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
  Clock,
  UtensilsCrossed,
  Receipt,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ChefHat,
  Printer,
  X
} from 'lucide-react'
import { SaleRecord, formatCustomerDisplay, formatSaleTime } from '@/lib/domain/sales'
import { formatBs, convertUsdToBs } from '@/lib/bcv'

interface SaleDetailDialogProps {
  sale: SaleRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  bcvRate?: number
}

export function SaleDetailDialog({
  sale,
  open,
  onOpenChange,
  bcvRate = 813.74,
}: SaleDetailDialogProps) {
  if (!sale) return null

  const customerInfo = formatCustomerDisplay(sale.customer_name, sale.type, sale.table_number)
  const isCredit = sale.payment_status === 'credit'
  const isPaid = sale.payment_status === 'paid'
  const isPending = sale.payment_status === 'pending'
  const totalBs = convertUsdToBs(sale.total, bcvRate)
  const timeFormatted = formatSaleTime(sale.created_at)

  const dateObj = new Date(sale.created_at)
  const dateFormatted = dateObj.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-2xl overflow-hidden">
        {/* Cabecera de la Modal */}
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                Venta #{sale.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {isCredit ? (
                <Badge className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5">
                  Venta a Crédito
                </Badge>
              ) : isPaid ? (
                <Badge className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5">
                  Pagada
                </Badge>
              ) : (
                <Badge className="bg-amber-500 text-black text-[11px] font-bold px-2.5 py-0.5">
                  Pendiente
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="capitalize">{dateFormatted}</span>
              <span>•</span>
              <Clock className="size-3 text-muted-foreground" />
              <span className="font-mono font-bold text-foreground">{timeFormatted}</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-bold">
              {sale.type === 'dine_in'
                ? `🍽️ Salón ${sale.table_number ? `(Mesa ${sale.table_number})` : ''}`
                : sale.type === 'takeaway'
                ? '🛍️ Para Llevar'
                : '🛵 Delivery'}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Tarjeta de Cliente o Invitado */}
          <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div
                className={`size-8 rounded-full flex items-center justify-center ${
                  customerInfo.isGuest
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary font-bold'
                }`}
              >
                <User className="size-4" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">
                  {customerInfo.displayName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {customerInfo.isGuest ? 'Cliente Casual / Sin Registro' : 'Cliente Frecuente'}
                </p>
              </div>
            </div>

            {sale.customer_phone && (
              <a
                href={`tel:${sale.customer_phone}`}
                className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
              >
                <Phone className="size-3" />
                <span>{sale.customer_phone}</span>
              </a>
            )}
          </div>

          {/* Notas Generales o Dirección si aplica */}
          {sale.notes && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-0.5">Nota de la orden:</span>
              <p className="leading-snug">{sale.notes}</p>
            </div>
          )}

          {/* Desglose de Platos Consumidos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ChefHat className="size-3.5 text-primary" />
                <span>Platos Consumidos ({sale.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              </span>
            </div>

            <div className="border rounded-xl divide-y bg-card overflow-hidden">
              {sale.items.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No se registraron platos detallados para esta venta.
                </div>
              ) : (
                sale.items.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground px-1.5 py-0.5 bg-muted rounded text-[11px]">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-foreground">{item.recipe_name}</span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 pl-6 leading-tight">
                          ⚠️ {item.notes}
                        </p>
                      )}

                      <span className="text-[10px] text-muted-foreground font-mono pl-6 block">
                        ${item.unit_price.toFixed(2)} c/u
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-sm text-foreground block">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatBs(convertUsdToBs(item.quantity * item.unit_price, bcvRate))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Información de Pago */}
          {sale.payments && sale.payments.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" />
                <span>Métodos de Pago Aplicados</span>
              </span>

              <div className="space-y-1.5">
                {sale.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border bg-muted/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{p.method_name}</span>
                      {p.reference_number && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Ref: {p.reference_number}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-foreground text-xs block">
                        ${p.amount.toFixed(2)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatBs(convertUsdToBs(p.amount, bcvRate))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desglose Financiero */}
          <div className="p-3.5 rounded-xl bg-card border space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">${sale.subtotal.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t flex items-baseline justify-between">
              <span className="font-bold text-xs text-foreground">Total Cobrado:</span>
              <div className="text-right">
                <span className="font-mono font-black text-xl text-primary leading-none block">
                  ${sale.total.toFixed(2)}
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {formatBs(totalBs)} (Tasa: {bcvRate.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de Modal */}
        <DialogFooter className="shrink-0 pt-3 border-t bg-card flex flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs gap-1.5"
          >
            <Printer className="size-3.5" />
            <span>Imprimir Recibo</span>
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold px-4"
          >
            <span>Cerrar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
