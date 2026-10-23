'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UtensilsCrossed,
  Layers,
  PackageCheck,
  Search,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { deleteRecipeAction } from '@/app/recipes/actions'

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
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'final_product' | 'sub_recipe'>('ALL')

  // Estado para modal de confirmación de eliminación
  const [deletingRecipe, setDeletingRecipe] = useState<RecipeCardData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'ALL' || r.type === filterType
    return matchesSearch && matchesType
  })

  async function handleConfirmDelete() {
    if (!deletingRecipe) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteRecipeAction(deletingRecipe.id)
      setDeletingRecipe(null)
      router.refresh()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar la receta.')
    } finally {
      setIsDeleting(false)
    }
  }

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
              <Card key={recipe.id} className="border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
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
                        <span className="text-[11px] text-muted-foreground truncate">{recipe.category}</span>
                      </div>
                      <CardTitle className="text-base font-bold text-foreground mt-1.5 leading-snug">
                        {recipe.name}
                      </CardTitle>
                    </div>

                    {/* Botón Eliminar Receta */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setDeleteError(null)
                        setDeletingRecipe(recipe)
                      }}
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                      title={`Eliminar receta: ${recipe.name}`}
                      aria-label={`Eliminar ${recipe.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
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

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={!!deletingRecipe}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingRecipe(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <Trash2 className="size-5" />
              <DialogTitle className="text-base font-bold text-foreground">
                Eliminar Receta
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              ¿Estás seguro de que deseas eliminar la receta{' '}
              <strong className="text-foreground">{deletingRecipe?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="size-4 shrink-0" />
                <span>No se pudo eliminar</span>
              </div>
              <p className="leading-relaxed">{deleteError}</p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1.5 text-muted-foreground">
            <p>
              • <strong>Tipo:</strong>{' '}
              {deletingRecipe?.type === 'final_product' ? 'Plato Final' : 'Sub-receta / Preparación Base'}
            </p>
            <p>
              • <strong>Composición:</strong> {deletingRecipe?.ingredientsCount} insumos directos y{' '}
              {deletingRecipe?.subRecipesCount} sub-recetas anidadas.
            </p>
            <p className="text-[11px] pt-1 border-t text-muted-foreground/80 leading-normal">
              Nota: Los insumos individuales en el almacén de inventario no se borrarán; solo se eliminará la ficha técnica y su escandallo.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingRecipe(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Eliminar Receta</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
