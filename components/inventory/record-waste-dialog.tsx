'use client'

import { useState, useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, Loader2, DollarSign, Calculator } from 'lucide-react'
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
import { calculateWeightedAverageCost } from '@/lib/domain/units'

interface RecordWasteDialogProps {
  ingredients: {
    id: string
    name: string
    unit: string
    current_stock: number
    cost_per_unit?: number
  }[]
  initialIngredientId?: string
  defaultType?: 'waste' | 'purchase'
  trigger?: React.ReactElement
}

export function RecordWasteDialog({
  ingredients,
  initialIngredientId,
  defaultType = 'waste',
  trigger,
}: RecordWasteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<'waste' | 'purchase'>(defaultType)

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(
    initialIngredientId || (ingredients.length > 0 ? ingredients[0].id : '')
  )
  const [quantity, setQuantity] = useState<string>('')
  const [purchaseUnitCost, setPurchaseUnitCost] = useState<string>('')
  const [purchaseTotalCost, setPurchaseTotalCost] = useState<string>('')
  const [lastCostEdited, setLastCostEdited] = useState<'unit' | 'total'>('unit')

  const selectedIngredient = useMemo(() => {
    return ingredients.find((i) => i.id === selectedIngredientId)
  }, [ingredients, selectedIngredientId])

  function handleQuantityChange(val: string) {
    setQuantity(val)
    const qNum = parseFloat(val)
    if (isNaN(qNum) || qNum <= 0) return

    if (lastCostEdited === 'total' && purchaseTotalCost !== '') {
      const tot = parseFloat(purchaseTotalCost)
      if (!isNaN(tot)) {
        setPurchaseUnitCost((tot / qNum).toFixed(4).replace(/\.?0+$/, ''))
      }
    } else if (lastCostEdited === 'unit' && purchaseUnitCost !== '') {
      const uCost = parseFloat(purchaseUnitCost)
      if (!isNaN(uCost)) {
        setPurchaseTotalCost((qNum * uCost).toFixed(2))
      }
    }
  }

  function handlePurchaseUnitCostChange(val: string) {
    setLastCostEdited('unit')
    setPurchaseUnitCost(val)
    const uNum = parseFloat(val)
    const qNum = parseFloat(quantity)
    if (!isNaN(uNum) && !isNaN(qNum) && qNum > 0) {
      setPurchaseTotalCost((qNum * uNum).toFixed(2))
    } else if (val === '') {
      setPurchaseTotalCost('')
    }
  }

  function handlePurchaseTotalCostChange(val: string) {
    setLastCostEdited('total')
    setPurchaseTotalCost(val)
    const totNum = parseFloat(val)
    const qNum = parseFloat(quantity)
    if (!isNaN(totNum) && !isNaN(qNum) && qNum > 0) {
      setPurchaseUnitCost((totNum / qNum).toFixed(4).replace(/\.?0+$/, ''))
    } else if (val === '') {
      setPurchaseUnitCost('')
    }
  }

  // Si cambia el insumo seleccionado y no hemos escrito costo, pre-cargamos su costo actual como referencia
  function handleSelectIngredient(id: string) {
    setSelectedIngredientId(id)
    const ing = ingredients.find((i) => i.id === id)
    if (ing && ing.cost_per_unit && purchaseUnitCost === '') {
      setPurchaseUnitCost(ing.cost_per_unit.toString())
      const qNum = parseFloat(quantity)
      if (!isNaN(qNum) && qNum > 0) {
        setPurchaseTotalCost((qNum * ing.cost_per_unit).toFixed(2))
      }
    }
  }

  // Cálculo en tiempo real de nuevo costo promedio ponderado
  const projectedWeightedCost = useMemo(() => {
    if (!selectedIngredient || type !== 'purchase') return null
    const qNum = parseFloat(quantity)
    const newCost = parseFloat(purchaseUnitCost)
    if (isNaN(qNum) || qNum <= 0 || isNaN(newCost)) return null

    const currentStock = selectedIngredient.current_stock || 0
    const currentCost = selectedIngredient.cost_per_unit || 0

    return calculateWeightedAverageCost(currentStock, currentCost, qNum, newCost)
  }, [selectedIngredient, type, quantity, purchaseUnitCost])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('type', type)

    try {
      await registerMovementAction(formData)
      setOpen(false)
      setQuantity('')
      setPurchaseUnitCost('')
      setPurchaseTotalCost('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el movimiento')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={`gap-1.5 shadow-xs ${
        defaultType === 'purchase'
          ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
          : ''
      }`}
    >
      {defaultType === 'purchase' ? (
        <>
          <ArrowUpRight className="size-4 text-emerald-500" />
          <span>Nueva Carga / Compra</span>
        </>
      ) : (
        <>
          <ArrowDownRight className="size-4 text-rose-500" />
          <span>Registrar Merma / Entrada</span>
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {type === 'purchase' ? 'Carga de Insumos / Compra' : 'Ajuste de Inventario / Merma'}
            </DialogTitle>
            <DialogDescription>
              {type === 'purchase'
                ? 'Registra una nueva compra o abastecimiento. Podrás especificar el nuevo precio pagado.'
                : 'Registra un desperdicio, merma o salida no comercial de insumo.'}
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
                value={selectedIngredientId}
                onChange={(e) => handleSelectIngredient(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>-- Selecciona un ingrediente --</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-popover text-popover-foreground">
                    {ing.name} (Stock: {ing.current_stock} {ing.unit}{ing.cost_per_unit !== undefined ? ` | $${ing.cost_per_unit}/u` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity">
                {type === 'waste'
                  ? `Cantidad de Merma (${selectedIngredient?.unit || 'unidades'}) *`
                  : `Cantidad de Nueva Carga (${selectedIngredient?.unit || 'unidades'}) *`}
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.001"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                required
              />
            </div>

            {/* Campos de Costo para Entrada / Compra */}
            {type === 'purchase' && (
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <DollarSign className="size-3.5 text-emerald-500" />
                    Precio de la Nueva Carga
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Elige unitario o total (se auto-calculan)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="purchase_unit_cost" className="text-[11px] font-medium">
                        Costo Unitario ($ / {selectedIngredient?.unit || 'u'})
                      </Label>
                      {lastCostEdited === 'total' && purchaseTotalCost && (
                        <span className="text-[10px] text-primary font-medium">Auto</span>
                      )}
                    </div>
                    <Input
                      id="purchase_unit_cost"
                      name="purchase_unit_cost"
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                      value={purchaseUnitCost}
                      onChange={(e) => handlePurchaseUnitCostChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="purchase_total_cost" className="text-[11px] font-medium">
                        Costo Total Factura ($)
                      </Label>
                      {lastCostEdited === 'unit' && purchaseUnitCost && (
                        <span className="text-[10px] text-primary font-medium">Auto</span>
                      )}
                    </div>
                    <Input
                      id="purchase_total_cost"
                      name="purchase_total_cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={purchaseTotalCost}
                      onChange={(e) => handlePurchaseTotalCostChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Previsualización del nuevo costo promedio ponderado */}
                {projectedWeightedCost !== null && selectedIngredient && (
                  <div className="rounded-md bg-background/80 p-2.5 border text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Stock actual: {selectedIngredient.current_stock} {selectedIngredient.unit} (${selectedIngredient.cost_per_unit?.toFixed(2)}/u)</span>
                      <span>+ {quantity} {selectedIngredient.unit}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-foreground pt-1 border-t">
                      <span>Nuevo Costo Ponderado (PMP):</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        ${projectedWeightedCost.toFixed(4)} / {selectedIngredient.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Motivo / Justificación */}
            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo / Justificación *</Label>
              <Input
                id="reason"
                name="reason"
                placeholder={
                  type === 'waste'
                    ? 'Ej: Vencimiento de lote, quemado en cocción, caída'
                    : 'Ej: Factura Proveedor #1234, Mercado Central'
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
                'Ingresar Carga'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
