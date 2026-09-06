'use client'

import { useState } from 'react'
import { PlusCircle, Loader2 } from 'lucide-react'
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
import { createIngredientAction } from '@/app/inventory/actions'

const CATEGORIES = [
  'Carnes & Aves',
  'Lácteos & Quesos',
  'Verduras & Frutas',
  'Panadería & Masas',
  'Salsas & Condimentos',
  'Abarrotes & Especias',
  'Bebidas & Licores',
  'Empaques & Desechables',
  'Limpieza & Otros',
]

const UNITS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'gr', label: 'Gramos (gr)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'und', label: 'Unidades (und)' },
  { value: 'porcion', label: 'Porciones (porción)' },
]

export function CreateIngredientDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      await createIngredientAction(formData)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el insumo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5 shadow-xs">
            <PlusCircle className="size-4" />
            <span>Nuevo Insumo</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Insumo</DialogTitle>
            <DialogDescription>
              Añade un ingrediente o material al inventario para usarlo en escandallos y recetas.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre del Insumo *</Label>
                <Input id="name" name="name" placeholder="Ej: Pechuga de Pollo" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Código / SKU</Label>
                <Input id="code" name="code" placeholder="Ej: POL-001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  name="category"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-popover text-popover-foreground">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidad de Medida *</Label>
                <select
                  id="unit"
                  name="unit"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value} className="bg-popover text-popover-foreground">
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="current_stock">Stock Actual</Label>
                <Input
                  id="current_stock"
                  name="current_stock"
                  type="number"
                  step="0.001"
                  defaultValue="0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min_stock">Stock Mínimo (Alerta)</Label>
                <Input
                  id="min_stock"
                  name="min_stock"
                  type="number"
                  step="0.001"
                  defaultValue="5"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost_per_unit">Costo Unitario ($) *</Label>
                <Input
                  id="cost_per_unit"
                  name="cost_per_unit"
                  type="number"
                  step="0.0001"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Ubicación en Cocina / Bodega</Label>
              <Input id="location" name="location" placeholder="Ej: Nevera 2 - Estante Carnes" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Insumo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
