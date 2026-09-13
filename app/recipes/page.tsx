import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { CreateRecipeDialog } from '@/components/recipes/create-recipe-dialog'
import { RecipesGrid } from '@/components/recipes/recipes-grid'

export default async function RecipesPage() {
  const supabase = await createClient()

  // 1. Obtener recetas, ingredientes y relaciones
  const [
    { data: recipesData },
    { data: ingredientsData },
    { data: recipeIngredientsData },
    { data: recipeSubRecipesData }
  ] = await Promise.all([
    supabase.from('recipes').select('*').order('created_at', { ascending: false }),
    supabase.from('ingredients').select('*'),
    supabase.from('recipe_ingredients').select('*'),
    supabase.from('recipe_sub_recipes').select('*')
  ])

  const recipes = recipesData || []
  const ingredients = ingredientsData || []
  const recipeIngredients = recipeIngredientsData || []
  const recipeSubRecipes = recipeSubRecipesData || []

  // Mapear insumos disponibles para el selector
  const availableIngredients = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    cost_per_unit: i.cost_per_unit,
    current_stock: i.current_stock,
  }))

  // Mapear sub-recetas para el selector
  const subRecipes = recipes.filter((r) => r.type === 'sub_recipe')
  const availableSubRecipes = subRecipes.map((s) => ({
    id: s.id,
    name: s.name || 'Sub-receta',
    yield_unit: s.yield_unit || 'porción',
    cost_per_unit: s.cost_per_unit || 1,
  }))

  // 2. Procesar y calcular costeo dinámico y platos preparables para cada receta
  const processedRecipes = recipes.map((r) => {
    // Insumos directos de esta receta
    const directIngs = recipeIngredients.filter((ri) => ri.recipe_id === r.id)
    const directCost = directIngs.reduce((acc, curr) => {
      const ing = ingredients.find((i) => i.id === curr.ingredient_id)
      return acc + (ing ? ing.cost_per_unit * curr.quantity : 0)
    }, 0)

    // Sub-recetas que consume esta receta
    const childSubs = recipeSubRecipes.filter((rs) => rs.parent_recipe_id === r.id)
    const subsCost = childSubs.reduce((acc, curr) => {
      const sub = recipes.find((s) => s.id === curr.child_recipe_id)
      return acc + (sub ? (sub.cost_per_unit || 0) * curr.quantity : 0)
    }, 0)

    const totalCost = directCost + subsCost
    const price = r.price || 0
    const profitMargin = price > 0 ? ((price - totalCost) / price) * 100 : 0

    // Cálculo de platos preparables según el stock de insumos limitantes
    let preparable = 9999
    if (directIngs.length > 0) {
      for (const item of directIngs) {
        const ing = ingredients.find((i) => i.id === item.ingredient_id)
        if (ing && item.quantity > 0) {
          const possible = Math.floor(ing.current_stock / item.quantity)
          if (possible < preparable) {
            preparable = possible
          }
        }
      }
    } else {
      preparable = 0
    }
    if (preparable === 9999) preparable = 0

    return {
      id: r.id,
      name: r.name || 'Sin nombre',
      description: r.description,
      type: r.type || 'final_product',
      price: r.price,
      cost: totalCost,
      profitMargin,
      preparableUnits: Math.max(0, preparable),
      yield_quantity: r.yield_quantity || 1,
      yield_unit: r.yield_unit || 'porción',
      category: r.category || 'General',
      ingredientsCount: directIngs.length,
      subRecipesCount: childSubs.length,
    }
  })

  return (
    <AdminShell>
      <Navbar
        title="Menú, Platos y Costos"
        description="Platos a la venta, ingredientes requeridos y cálculo de ganancias"
        actions={
          <CreateRecipeDialog
            availableIngredients={availableIngredients}
            availableSubRecipes={availableSubRecipes}
          />
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        <RecipesGrid recipes={processedRecipes} />
      </main>
    </AdminShell>
  )
}
