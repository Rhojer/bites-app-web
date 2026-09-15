'use client'

import { ShoppingBag, ChevronUp, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface MobileCartDrawerProps {
  itemCount: number
  totalUSD: number
  totalVES: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
  children: React.ReactNode
}

export function MobileCartDrawer({
  itemCount,
  totalUSD,
  totalVES,
  open,
  onOpenChange,
  onCheckout,
  children,
}: MobileCartDrawerProps) {
  if (itemCount === 0) return null

  return (
    <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 p-3 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="w-full h-14 bg-primary text-primary-foreground rounded-2xl p-3 px-4 shadow-xl flex items-center justify-between transition-all duration-150 active:scale-[0.98] border border-primary/20"
                aria-label="Ver comanda actual"
              />
            }
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <ShoppingBag className="size-5 text-primary-foreground" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 size-5 bg-background text-foreground font-black text-[11px] rounded-full flex items-center justify-center shadow-xs border">
                  {itemCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-primary-foreground/90 leading-tight">Comanda Actual</p>
                <p className="text-[10px] text-primary-foreground/75 font-mono">Toca para revisar platos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-mono font-black text-sm text-primary-foreground leading-tight">
                  ${totalUSD.toFixed(2)}
                </p>
                <p className="font-mono text-[10px] text-primary-foreground/80 leading-tight">
                  Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <ChevronUp className="size-5 text-primary-foreground/80" />
            </div>
          </SheetTrigger>

          <SheetContent side="bottom" className="p-4 rounded-t-3xl max-h-[85vh] flex flex-col">
            <SheetHeader className="pb-3 border-b shrink-0 flex flex-row items-center justify-between">
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingBag className="size-5 text-primary" />
                <span>Comanda en Curso ({itemCount} {itemCount === 1 ? 'ítem' : 'ítems'})</span>
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {children}
            </div>

            <div className="pt-3 border-t shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Estimado:</span>
                <span className="font-mono text-[11px]">Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>Monto a Cobrar:</span>
                <span className="font-mono text-xl text-primary">${totalUSD.toFixed(2)} USD</span>
              </div>

              <Button
                size="lg"
                className="w-full h-13 font-bold text-sm rounded-xl gap-2 shadow-lg active:scale-95 transition-transform"
                onClick={() => {
                  onOpenChange(false)
                  onCheckout()
                }}
              >
                <CheckCircle2 className="size-5" />
                <span>Proceder al Cobro (${totalUSD.toFixed(2)})</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
