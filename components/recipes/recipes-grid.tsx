'use client'

import { useState } from 'react'
import {
  UtensilsCrossed,
  Layers,
  DollarSign,
  TrendingUp,
  PackageCheck,
  Search,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface RecipeCardData {
  id: string
  name: string
  description: string | null
  type: string
  price: number | null
  cost: number
  profitMargin: number
  preparableUnits: number
  yield_quantity: number
  yield_unit: string
  category: string
  ingredientsCount: number
  subRecipesCount: number
}

interface RecipesGridProps {
  recipes: RecipeCardData[]
}

export function RecipesGrid({ recipes }: RecipesGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'final_product' | 'sub_recipe'>('ALL')

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'ALL' || r.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar plato o sub-receta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant={filterType === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterType('ALL')}
            className="text-xs"
          >
            Todos ({recipes.length})
          </Button>
          <Button
            size="xs"
            variant={filterType === 'final_product' ? 'default' : 'outline'}
            onClick={() => setFilterType('final_product')}
            className="text-xs gap-1.5"
          >
            <UtensilsCrossed className="size-3" />
            Platos Finales ({recipes.filter((r) => r.type === 'final_product').length})
          </Button>
          <Button
            size="xs"
            variant={filterType === 'sub_recipe' ? 'default' : 'outline'}
            onClick={() => setFilterType('sub_recipe')}
            className="text-xs gap-1.5"
          >
            <Layers className="size-3 text-orange-500" />
            Sub-recetas / Bases ({recipes.filter((r) => r.type === 'sub_recipe').length})
          </Button>
        </div>
      </div>

      {/* Grid de Recetas */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <UtensilsCrossed className="size-8 mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-sm">No hay recetas que coincidan</p>
          <p className="text-xs">Usa el botón &quot;Nueva Receta / Escandallo&quot; para registrar un plato o sub-receta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe) => {
            const isFinal = recipe.type === 'final_product'
            return (
              <Card key={recipe.id} className="border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {isFinal ? (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                            Plato Final
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                            Sub-receta / Base
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">{recipe.category}</span>
                      </div>
                      <CardTitle className="text-base font-bold text-foreground mt-1.5 leading-snug">
                        {recipe.name}
                      </CardTitle>
                    </div>
                  </div>
                  {recipe.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {recipe.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Composición */}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg">
                    <span>Insumos: <b>{recipe.ingredientsCount}</b></span>
                    <span>•</span>
                    <span>Sub-recetas: <b>{recipe.subRecipesCount}</b></span>
                    {!isFinal && (
                      <>
                        <span>•</span>
                        <span>Rinde: <b>{recipe.yield_quantity} {recipe.yield_unit}</b></span>
                      </>
                    )}
                  </div>

                  {/* Bloque Financiero y Costeo */}
                  <div className="p-3 rounded-xl border bg-card space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Costo de Insumos (Food Cost):</span>
                      <span className="font-mono font-bold text-foreground">${recipe.cost.toFixed(2)}</span>
                    </div>

                    {isFinal ? (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Precio de Venta:</span>
                          <span className="font-mono font-bold text-primary text-sm">
                            ${(recipe.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                          <span className="text-muted-foreground font-medium">Margen Bruto:</span>
                          <Badge
                            variant={recipe.profitMargin >= 65 ? 'default' : recipe.profitMargin >= 40 ? 'secondary' : 'destructive'}
                            className="text-[11px] font-mono"
                          >
                            {recipe.profitMargin.toFixed(1)}% Margen
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                        <span className="text-muted-foreground font-medium">Costo Unitario por {recipe.yield_unit}:</span>
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                          ${(recipe.cost / (recipe.yield_quantity || 1)).toFixed(2)} / {recipe.yield_unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Platos Preparables con Stock Actual */}
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium text-[11px]">
                      <PackageCheck className="size-3.5" />
                      <span>Stock Preparable:</span>
                    </div>
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-200">
                      {recipe.preparableUnits} {isFinal ? 'platos' : recipe.yield_unit}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
