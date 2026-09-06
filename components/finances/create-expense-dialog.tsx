'use client'

import { useState } from 'react'
import { Plus, Loader2, DollarSign, Calendar, Tag, FileSpreadsheet } from 'lucide-react'
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
import { createExpenseAction } from '@/app/finances/actions'

const FIXED_CATEGORIES = [
  'Alquiler de Local',
  'Nómina Fija / Salarios',
  'Servicios Básicos (Electricidad, Agua, Gas)',
  'Internet / Telecomunicaciones',
  'Licencias de Software & POS',
  'Seguros & Contabilidad',
  'Otros Gastos Fijos',
]

const VARIABLE_CATEGORIES = [
  'Mantenimiento & Reparaciones',
  'Marketing & Publicidad',
  'Transporte, Gasolina & Fletes',
  'Empaques & Descartables',
  'Artículos de Limpieza',
  'Insumos Imprevistos',
  'Comisiones Bancarias / POS',
  'Otros Gastos Variables',
]

export function CreateExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('fixed')

  const today = new Date().toISOString().split('T')[0]
  const currentCategories = expenseType === 'fixed' ? FIXED_CATEGORIES : VARIABLE_CATEGORIES

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      await createExpenseAction(formData)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Registrar Gasto Operativo</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-primary" />
              Nuevo Gasto Operativo (Fijo o Variable)
            </DialogTitle>
            <DialogDescription>
              Asienta gastos de la operación para reflejarlos con precisión en el Estado de Pérdidas y Ganancias (P&L).
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            {/* Selector de Tipo: Fijo vs Variable */}
            <div className="space-y-1.5">
              <Label>Tipo de Gasto Operativo *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseType('fixed')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    expenseType === 'fixed'
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                      : 'border-input bg-card text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <p className="text-xs">🏢 Gasto Fijo</p>
                  <p className="text-[10px] text-muted-foreground font-normal">
                    Alquiler, nómina, luz, agua, licencias
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExpenseType('variable')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    expenseType === 'variable'
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                      : 'border-input bg-card text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <p className="text-xs">⚡ Gasto Variable</p>
                  <p className="text-[10px] text-muted-foreground font-normal">
                    Mantenimiento, marketing, fletes, etc.
                  </p>
                </button>
              </div>
              <input type="hidden" name="type" value={expenseType} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría del Gasto *</Label>
              <select
                id="category"
                name="category"
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto ($ USD) *</Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="date">Fecha del Gasto *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={today}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción / Motivo del Gasto *</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                required
                placeholder="Ej: Pago mensual de arrendamiento correspondiente a Septiembre..."
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
                  Registrando...
                </>
              ) : (
                'Registrar Gasto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
