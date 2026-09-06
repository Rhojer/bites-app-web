import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { CreateIngredientDialog } from '@/components/inventory/create-ingredient-dialog'
import { RecordWasteDialog } from '@/components/inventory/record-waste-dialog'
import { IngredientsTable } from '@/components/inventory/ingredients-table'
import { Boxes, AlertTriangle, DollarSign, ArrowDownRight, Layers } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()

  // Consultar insumos
  const { data: ingredientsData, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  const ingredients = ingredientsData || []

  // Calcular métricas
  const totalItems = ingredients.length
  const totalValuation = ingredients.reduce((acc, curr) => acc + curr.current_stock * curr.cost_per_unit, 0)
  const criticalStockCount = ingredients.filter((i) => i.current_stock <= i.min_stock).length
  const totalCategories = new Set(ingredients.map((i) => i.category)).size

  return (
    <AdminShell>
      <Navbar
        title="Inventario & Insumos"
        description="Control de stock en tiempo real, costeo de insumos y registro de mermas"
        actions={
          <div className="flex items-center gap-2">
            <RecordWasteDialog ingredients={ingredients} />
            <CreateIngredientDialog />
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Total Insumos</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{totalItems}</p>
                <p className="text-[11px] text-muted-foreground">{totalCategories} categorías</p>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Boxes className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Valorización Total</p>
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  ${totalValuation.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">En almacén y cocina</p>
              </div>
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Stock Crítico</p>
                <p className={`text-2xl font-bold tracking-tight ${criticalStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                  {criticalStockCount}
                </p>
                <p className="text-[11px] text-muted-foreground">Por debajo del mínimo</p>
              </div>
              <div className={`size-10 rounded-xl flex items-center justify-center ${criticalStockCount > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                <AlertTriangle className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Mermas & Salidas</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">Trazabilidad</p>
                <p className="text-[11px] text-muted-foreground">Deducción por receta activa</p>
              </div>
              <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDownRight className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Insumos */}
        <IngredientsTable ingredients={ingredients} />
      </main>
    </AdminShell>
  )
}
