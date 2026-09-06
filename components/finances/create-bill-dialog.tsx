'use client'

import { useState } from 'react'
import { Plus, Loader2, FileText, Calendar, Building2, DollarSign } from 'lucide-react'
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
import { createBillAction } from '@/app/finances/actions'

interface SupplierOption {
  id: string
  name: string
  tax_id?: string | null
  credit_days?: number | null
}

interface CreateBillDialogProps {
  suppliers: SupplierOption[]
}

export function CreateBillDialog({ suppliers }: CreateBillDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default due date: today + 15 days
  const defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      await createBillAction(formData)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar la factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Nueva Factura por Pagar</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Registrar Factura de Proveedor
            </DialogTitle>
            <DialogDescription>
              Añade una cuenta por pagar a proveedores con fecha límite para el control del semáforo de vencimientos.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="supplier_id">Proveedor *</Label>
              {suppliers.length > 0 ? (
                <select
                  id="supplier_id"
                  name="supplier_id"
                  required
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled selected>
                    Selecciona un proveedor...
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                      {s.name} {s.tax_id ? `(${s.tax_id})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    No hay proveedores registrados aún. Se usará el proveedor general predeterminado.
                  </p>
                  <Input
                    name="supplier_id"
                    value="00000000-0000-0000-0000-000000000001"
                    type="hidden"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invoice_number">N° de Factura / Control</Label>
                <Input
                  id="invoice_number"
                  name="invoice_number"
                  placeholder="Ej: FAC-2026-089"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto Total ($ USD) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  className="font-mono text-base font-bold text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due_date">Fecha de Vencimiento *</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={defaultDueDate}
                required
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                El semáforo alertará automáticamente cuando falten 7 días o menos para esta fecha.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas y Condiciones de Pago</Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Ej: Pago a 15 días mediante transferencia bancaria o Zelle tras entrega de insumos cárnicos..."
                className="w-full rounded-md border border-input bg-transparent p-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Factura'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
