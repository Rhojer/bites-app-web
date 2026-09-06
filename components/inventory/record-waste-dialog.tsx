'use client'

import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react'
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
import { registerMovementAction } from '@/app/inventory/actions'

interface RecordWasteDialogProps {
  ingredients: { id: string; name: string; unit: string; current_stock: number }[]
  initialIngredientId?: string
}

export function RecordWasteDialog({ ingredients, initialIngredientId }: RecordWasteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<'waste' | 'purchase'>('waste')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('type', type)

    try {
      await registerMovementAction(formData)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 shadow-xs">
            <ArrowDownRight className="size-4 text-rose-500" />
            <span>Registrar Merma / Entrada</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajuste de Inventario</DialogTitle>
            <DialogDescription>
              Registra una merma (desperdicio, caída, vencimiento) o una entrada de insumos manual.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            {/* Tipo de Movimiento */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('waste')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  type === 'waste'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <ArrowDownRight className="size-4 text-rose-500" />
                Registrar Merma (Resta)
              </button>
              <button
                type="button"
                onClick={() => setType('purchase')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  type === 'purchase'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <ArrowUpRight className="size-4 text-emerald-500" />
                Entrada / Compra (Suma)
              </button>
            </div>

            {/* Insumo */}
            <div className="space-y-1.5">
              <Label htmlFor="ingredient_id">Seleccionar Insumo *</Label>
              <select
                id="ingredient_id"
                name="ingredient_id"
                defaultValue={initialIngredientId}
                required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>-- Selecciona un ingrediente --</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-popover text-popover-foreground">
                    {ing.name} (Stock actual: {ing.current_stock} {ing.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity">
                {type === 'waste' ? 'Cantidad de Merma *' : 'Cantidad Ingresada *'}
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.001"
                placeholder="0.00"
                required
              />
            </div>

            {/* Motivo / Justificación */}
            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo / Justificación *</Label>
              <Input
                id="reason"
                name="reason"
                placeholder={
                  type === 'waste'
                    ? 'Ej: Vencimiento de lote, quemado en cocción, caída'
                    : 'Ej: Compra directa en mercado mayorista'
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant={type === 'waste' ? 'destructive' : 'default'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Procesando...
                </>
              ) : type === 'waste' ? (
                'Registrar Merma'
              ) : (
                'Ingresar Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
