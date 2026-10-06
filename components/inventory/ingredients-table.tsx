'use client'

import { useState } from 'react'
import { Search, Package, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RecordWasteDialog } from './record-waste-dialog'
import { getDisplayStockAndCost, InventoryDisplayMode } from '@/lib/domain/units'

interface Ingredient {
  id: string
  name: string
  code: string | null
  category: string
  unit: string
  current_stock: number
  min_stock: number
  max_stock: number
  cost_per_unit: number
  location: string | null
  expiration_date: string | null
}

interface IngredientsTableProps {
  ingredients: Ingredient[]
}

export function IngredientsTable({ ingredients }: IngredientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [unitDisplayMode, setUnitDisplayMode] = useState<InventoryDisplayMode>('macro')

  const categories = Array.from(new Set(ingredients.map((i) => i.category || 'General')))

  const filtered = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ing.code && ing.code.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCat = selectedCategory === 'ALL' || ing.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-4">
      {/* Search, Unit Switch and Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Switch de Unidades: kg / L vs g / mL */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center p-0.5 rounded-lg border bg-muted/50 text-xs shadow-2xs">
              <span className="text-[11px] font-medium text-muted-foreground px-2 hidden sm:flex items-center gap-1">
                <Scale className="size-3" />
                <span>Unidades:</span>
              </span>
              <button
                type="button"
                onClick={() => setUnitDisplayMode('macro')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  unitDisplayMode === 'macro'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Mostrar cantidades en Kilogramos (kg) y Litros (lt)"
              >
                kg / L
              </button>
              <button
                type="button"
                onClick={() => setUnitDisplayMode('micro')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  unitDisplayMode === 'micro'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Mostrar cantidades en Gramos (g) y Mililitros (ml)"
              >
                g / mL
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="xs"
            variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('ALL')}
            className="text-xs"
          >
            Todos ({ingredients.length})
          </Button>
          {categories.map((cat) => {
            const count = ingredients.filter((i) => i.category === cat).length
            return (
              <Button
                key={cat}
                size="xs"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="text-xs whitespace-nowrap"
              >
                {cat} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Table with Clean Horizontal Scrolling */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Insumo / Código</th>
                <th className="py-3.5 px-4">Stock Actual</th>
                <th className="py-3.5 px-4 text-right">Costo Unitario</th>
                <th className="py-3.5 px-4 text-right">Valor en Inventario</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-muted-foreground">
                    <Package className="size-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="font-semibold text-sm text-foreground">No hay insumos que coincidan</p>
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? 'Prueba con otro término de búsqueda o categoría.'
                        : 'Añade insumos usando el botón "Nuevo Insumo" para comenzar.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((ing) => {
                  const display = getDisplayStockAndCost(
                    ing.current_stock,
                    ing.cost_per_unit,
                    ing.min_stock,
                    ing.unit,
                    unitDisplayMode
                  )
                  const isCritical = ing.current_stock <= ing.min_stock
                  const isZero = ing.current_stock <= 0
                  const totalValue = ing.current_stock * ing.cost_per_unit

                  return (
                    <tr key={ing.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-xs">{ing.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {ing.code || 'Sin SKU'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-bold ${
                            isZero
                              ? 'text-rose-600 dark:text-rose-400'
                              : isCritical
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-foreground'
                          }`}
                        >
                          {Number(display.stock.toFixed(3))} <span className="text-[11px] font-normal text-muted-foreground">{display.unit}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Mín: {Number(display.minStock.toFixed(3))} {display.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-foreground font-medium">
                        ${display.costPerUnit < 0.01 ? display.costPerUnit.toFixed(4) : display.costPerUnit.toFixed(2)} / {display.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        ${totalValue.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <RecordWasteDialog
                            ingredients={ingredients}
                            initialIngredientId={ing.id}
                            defaultType="purchase"
                            trigger={
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 px-2 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
                                title="Ingresar nueva carga / compra"
                              >
                                <ArrowUpRight className="size-3.5" />
                                <span className="hidden md:inline">Carga</span>
                              </Button>
                            }
                          />
                          <RecordWasteDialog
                            ingredients={ingredients}
                            initialIngredientId={ing.id}
                            defaultType="waste"
                            trigger={
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 px-2 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30"
                                title="Registrar merma o desperdicio"
                              >
                                <ArrowDownRight className="size-3.5" />
                                <span className="hidden md:inline">Merma</span>
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
