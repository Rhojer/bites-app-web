'use client'

import { useState } from 'react'
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  DollarSign,
  TrendingDown,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordWasteDialog } from './record-waste-dialog'

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
      {/* Search and Category Filters */}
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
          <table className="w-full min-w-[720px] text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Insumo / Código</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Stock Actual</th>
                <th className="py-3.5 px-4">Estado Stock</th>
                <th className="py-3.5 px-4 text-right">Costo Unitario</th>
                <th className="py-3.5 px-4 text-right">Valor en Inventario</th>
                <th className="py-3.5 px-4">Ubicación</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-muted-foreground">
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
                        <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 rounded-md">
                          {ing.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">
                          {ing.current_stock} <span className="text-[11px] font-normal text-muted-foreground">{ing.unit}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Mín: {ing.min_stock} {ing.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isZero ? (
                          <Badge variant="destructive" className="gap-1 text-[10px] font-semibold">
                            <AlertTriangle className="size-3" /> Agotado
                          </Badge>
                        ) : isCritical ? (
                          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold">
                            <AlertTriangle className="size-3 text-amber-600" /> Stock Crítico
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-500/30 font-semibold bg-emerald-500/5">
                            <CheckCircle2 className="size-3 text-emerald-600" /> Óptimo
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-foreground font-medium">
                        ${ing.cost_per_unit.toFixed(2)} / {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        ${totalValue.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {ing.location || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <RecordWasteDialog
                          ingredients={ingredients}
                          initialIngredientId={ing.id}
                        />
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
