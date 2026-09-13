'use client'

import { useState } from 'react'
import { ArrowUpRight, Loader2, DollarSign, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCashExpenseAction } from '@/app/cash-register/actions'

const CATEGORIES = [
  'Compra de Emergencia (Insumos faltantes)',
  'Pago Proveedor Menor',
  'Servicio / Mantenimiento urgente',
  'Propinas / Distribución',
  'Adelanto de Nómina / Personal',
  'Transporte / Flete',
  'Gastos Varios / Otros',
]

export function RecordExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      await createCashExpenseAction(formData)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar egreso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="destructive" className="gap-1.5 shadow-xs">
            <ArrowUpRight className="size-4" />
            <span>Registrar Egreso de Caja</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Egreso de Dinero / Retiro de Caja</DialogTitle>
            <DialogDescription>
              Registra una salida de dinero en efectivo con su nota de justificación para el arqueo de caja.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto a Retirar ($ USD) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                className="font-mono text-base font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vault">Bóveda / Origen del Dinero *</Label>
              <select
                id="vault"
                name="vault"
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="cash_usd" className="bg-popover text-popover-foreground">
                  💵 Gaveta Efectivo USD ($)
                </option>
                <option value="cash_bs" className="bg-popover text-popover-foreground">
                  🇻🇪 Gaveta Efectivo Bs (Bs)
                </option>
                <option value="bank_ves" className="bg-popover text-popover-foreground">
                  🏦 Banco / Transferencia Bs
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría del Egreso *</Label>
              <select
                id="category"
                name="category"
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient">Entregado a / Responsable</Label>
              <Input
                id="recipient"
                name="recipient"
                placeholder="Ej: Juan Pérez (Repartidor) o Don Pepe (Verduras)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Nota de Justificación / Diferimiento del Gasto *</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                required
                placeholder="Explica detalladamente en qué se gastó el dinero (ej. Se compraron 5kg de tomates de urgencia por falta de stock del proveedor habitual)..."
                className="w-full rounded-md border border-input bg-transparent p-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Confirmar Egreso'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
