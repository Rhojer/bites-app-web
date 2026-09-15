'use client'

import { useState } from 'react'
import { PlusCircle, Trash2, Loader2, Sparkles, UtensilsCrossed, Layers, DollarSign, AlertTriangle } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { createRecipeAction } from '@/app/recipes/actions'
import { calculateNormalizedUnitCost, checkRecipeQuantitySanity, SUPPORTED_UNITS } from '@/lib/domain/units'

interface IngredientOption {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  current_stock: number
}

interface SubRecipeOption {
  id: string
  name: string
  yield_unit: string
  cost_per_unit: number
}

interface CreateRecipeDialogProps {
  availableIngredients: IngredientOption[]
  availableSubRecipes: SubRecipeOption[]
}

export function CreateRecipeDialog({
  availableIngredients,
  availableSubRecipes,
}: CreateRecipeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [type, setType] = useState<'final_product' | 'sub_recipe'>('final_product')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Hamburguesas & Sandwiches')
  const [price, setPrice] = useState<number>(10)
  const [yieldQuantity, setYieldQuantity] = useState<number>(1)
  const [yieldUnit, setYieldUnit] = useState('porción')

  // Selected components
  const [selectedIngredients, setSelectedIngredients] = useState<
    { ingredient_id: string; quantity: number; unit?: string }[]
  >([])

  const [selectedSubRecipes, setSelectedSubRecipes] = useState<
    { child_recipe_id: string; quantity: number }[]
  >([])

  // Cálculos en tiempo real con normalización de unidades
  const ingredientsCost = selectedIngredients.reduce((acc, curr) => {
    const item = availableIngredients.find((i) => i.id === curr.ingredient_id)
    if (!item) return acc
    const storageUnit = item.unit || 'und'
    const recipeUnit = curr.unit || storageUnit
    let unitCost = item.cost_per_unit
    try {
      unitCost = calculateNormalizedUnitCost(item.cost_per_unit, storageUnit, recipeUnit)
    } catch {
      unitCost = item.cost_per_unit
    }
    return acc + unitCost * curr.quantity
  }, 0)

  const subRecipesCost = selectedSubRecipes.reduce((acc, curr) => {
    const item = availableSubRecipes.find((s) => s.id === curr.child_recipe_id)
    return acc + (item ? item.cost_per_unit * curr.quantity : 0)
  }, 0)

  const totalCost = ingredientsCost + subRecipesCost
  const profitMargin = type === 'final_product' && price > 0 ? ((price - totalCost) / price) * 100 : 0
  const grossProfit = type === 'final_product' ? price - totalCost : 0

  function addIngredientRow() {
    if (availableIngredients.length === 0) return
    const defaultIng = availableIngredients[0]
    setSelectedIngredients((prev) => [
      ...prev,
      { ingredient_id: defaultIng.id, quantity: 1, unit: defaultIng.unit || 'und' },
    ])
  }

  function removeIngredientRow(index: number) {
    setSelectedIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  function addSubRecipeRow() {
    if (availableSubRecipes.length === 0) return
    setSelectedSubRecipes((prev) => [
      ...prev,
      { child_recipe_id: availableSubRecipes[0].id, quantity: 1 },
    ])
  }

  function removeSubRecipeRow(index: number) {
    setSelectedSubRecipes((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createRecipeAction({
        name,
        description,
        type,
        price: type === 'final_product' ? price : 0,
        category,
        yield_quantity: yieldQuantity,
        yield_unit: yieldUnit,
        ingredients: selectedIngredients,
        sub_recipes: selectedSubRecipes,
      })

      setOpen(false)
      setName('')
      setDescription('')
      setSelectedIngredients([])
      setSelectedSubRecipes([])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la receta')
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
            <span>Nueva Receta / Escandallo</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Compositor de Recetas & Escandallos</DialogTitle>
            <DialogDescription>
              Define la receta a partir de insumos directos y/o sub-recetas (salsas, marinados, masas).
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            {/* Selector de Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('final_product')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === 'final_product'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <UtensilsCrossed className="size-4" />
                <span>Plato Final (Venta al Público)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('sub_recipe')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === 'sub_recipe'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <Layers className="size-4 text-orange-500" />
                <span>Sub-receta / Pre-elaboración (Salsa/Base)</span>
              </button>
            </div>

            {/* Datos Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rec_name">Nombre de la Receta *</Label>
                <Input
                  id="rec_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'final_product' ? 'Ej: Hamburguesa Crispy Especial' : 'Ej: Salsa Tártara Secreta'}
                  required
                />
              </div>

              {type === 'final_product' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="rec_price">Precio de Venta al Público ($) *</Label>
                  <Input
                    id="rec_price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rec_yield_qty">Rendimiento Total</Label>
                    <Input
                      id="rec_yield_qty"
                      type="number"
                      step="0.01"
                      value={yieldQuantity}
                      onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rec_yield_unit">Unidad</Label>
                    <select
                      id="rec_yield_unit"
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs"
                    >
                      <option value="porción">porción</option>
                      <option value="ml">ml</option>
                      <option value="lt">litro (lt)</option>
                      <option value="gr">gramo (gr)</option>
                      <option value="kg">kg</option>
                      <option value="unidad">unidad</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Insumos Directos */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span>1. Insumos e Ingredientes Base</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedIngredients.length} insumos
                  </Badge>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={addIngredientRow}
                  className="gap-1 text-xs"
                  disabled={availableIngredients.length === 0}
                >
                  <PlusCircle className="size-3" /> Añadir Insumo
                </Button>
              </div>

              {selectedIngredients.length === 0 ? (
                <div className="p-3 text-center border rounded-lg border-dashed text-muted-foreground text-xs">
                  No has añadido insumos directos aún.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedIngredients.map((item, idx) => {
                    const currentIng = availableIngredients.find((i) => i.id === item.ingredient_id)
                    const storageUnit = currentIng?.unit || 'und'
                    const recipeUnit = item.unit || storageUnit
                    let unitCost = currentIng ? currentIng.cost_per_unit : 0
                    try {
                      unitCost = calculateNormalizedUnitCost(unitCost, storageUnit, recipeUnit)
                    } catch {
                      // ignore
                    }
                    const subCost = unitCost * item.quantity
                    const sanity = checkRecipeQuantitySanity(item.quantity, recipeUnit)

                    return (
                      <div key={idx} className="space-y-1 p-2 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <select
                              value={item.ingredient_id}
                              onChange={(e) => {
                                const val = e.target.value
                                const ing = availableIngredients.find((i) => i.id === val)
                                setSelectedIngredients((prev) =>
                                  prev.map((row, i) =>
                                    i === idx
                                      ? { ...row, ingredient_id: val, unit: ing?.unit || 'und' }
                                      : row
                                  )
                                )}
                              }
                              className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                            >
                              {availableIngredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} (${ing.cost_per_unit.toFixed(2)} / {ing.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseFloat(e.target.value) || 0
                                setSelectedIngredients((prev) =>
                                  prev.map((row, i) => (i === idx ? { ...row, quantity: qty } : row))
                                )
                              }}
                              className="h-8 text-xs font-mono"
                              placeholder="Cant."
                            />
                          </div>
                          <div className="w-24">
                            <select
                              value={recipeUnit}
                              onChange={(e) => {
                                const newUnit = e.target.value
                                setSelectedIngredients((prev) =>
                                  prev.map((row, i) => (i === idx ? { ...row, unit: newUnit } : row))
                                )
                              }}
                              className="w-full h-8 rounded-md border border-input bg-transparent px-1.5 text-xs"
                            >
                              <option value="gr">gr (gramos)</option>
                              <option value="kg">kg (kilos)</option>
                              <option value="ml">ml (mililitros)</option>
                              <option value="lt">lt (litros)</option>
                              <option value="und">und (unidades)</option>
                              <option value="porcion">porción</option>
                            </select>
                          </div>
                          <div className="w-16 text-right font-mono font-semibold text-[11px] text-foreground">
                            ${subCost.toFixed(2)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeIngredientRow(idx)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                        {!sanity.isSane && sanity.warningMessage && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-md">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            <span>{sanity.warningMessage}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sub-recetas Anidadas */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span>2. Sub-recetas / Pre-elaboraciones</span>
                  <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-500/20">
                    {selectedSubRecipes.length} bases
                  </Badge>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={addSubRecipeRow}
                  className="gap-1 text-xs"
                  disabled={availableSubRecipes.length === 0}
                >
                  <PlusCircle className="size-3 text-orange-500" /> Añadir Sub-receta
                </Button>
              </div>

              {availableSubRecipes.length === 0 ? (
                <div className="p-3 text-center border rounded-lg border-dashed text-muted-foreground text-[11px]">
                  No hay sub-recetas creadas aún. Puedes crear una cambiando el tipo a &quot;Sub-receta&quot; arriba.
                </div>
              ) : selectedSubRecipes.length === 0 ? (
                <div className="p-3 text-center border rounded-lg border-dashed text-muted-foreground text-xs">
                  Opcional: Añade salsas, carnes marinadas o bases elaboradas.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSubRecipes.map((item, idx) => {
                    const currentSub = availableSubRecipes.find((s) => s.id === item.child_recipe_id)
                    const subCost = (currentSub ? currentSub.cost_per_unit : 0) * item.quantity

                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-orange-500/5 border-orange-500/20">
                        <div className="flex-1">
                          <select
                            value={item.child_recipe_id}
                            onChange={(e) => {
                              const val = e.target.value
                              setSelectedSubRecipes((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, child_recipe_id: val } : row))
                              )
                            }}
                            className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                          >
                            {availableSubRecipes.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} (${sub.cost_per_unit.toFixed(2)} / {sub.yield_unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.001"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseFloat(e.target.value) || 0
                              setSelectedSubRecipes((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, quantity: qty } : row))
                              )
                            }}
                            className="h-8 text-xs font-mono"
                            placeholder="Cantidad"
                          />
                        </div>
                        <div className="w-16 text-right font-mono font-semibold text-[11px] text-foreground">
                          ${subCost.toFixed(2)}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeSubRecipeRow(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Resumen Financiero del Plato / Sub-receta */}
            <div className="p-3 rounded-xl bg-card border shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Costo Total de Insumos & Bases (Food Cost):</span>
                <span className="font-mono font-bold text-foreground text-sm">${totalCost.toFixed(2)}</span>
              </div>
              {type === 'final_product' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Ganancia Bruta por Plato:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${grossProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t">
                    <span className="text-muted-foreground font-medium">Margen de Rentabilidad:</span>
                    <Badge
                      variant={profitMargin >= 65 ? 'default' : profitMargin >= 40 ? 'secondary' : 'destructive'}
                      className="text-xs font-mono"
                    >
                      {profitMargin.toFixed(1)}% Margen
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Receta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
