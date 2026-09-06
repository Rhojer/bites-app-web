import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { createRecipeAction } from '@/app/recipes/actions'

describe('Integration: Creación de Recetas y Sub-recetas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient({
      recipes: [],
      recipe_ingredients: [],
      recipe_sub_recipes: [],
    })
  })

  it('debe registrar una receta con sus ingredientes directos y sub-recetas anidadas asociadas', async () => {
    const result = await createRecipeAction({
      name: 'Sandwich Gourmet',
      description: 'Sandwich de lomo con salsa casera',
      type: 'final_product',
      price: 14.50,
      prep_time_minutes: 10,
      cook_time_minutes: 8,
      servings: 1,
      category: 'Sandwiches',
      ingredients: [
        { ingredient_id: 'ing-pan-ciabatta', quantity: 1 },
        { ingredient_id: 'ing-lomo', quantity: 0.18 },
      ],
      sub_recipes: [
        { child_recipe_id: 'sub-salsa-chimichurri', quantity: 1 },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.id).toBeDefined()

    // 1. Verificar receta creada en 'recipes'
    const recipes = mockSupabase._dataStore['recipes']
    expect(recipes).toHaveLength(1)
    expect(recipes[0].name).toBe('Sandwich Gourmet')
    expect(recipes[0].price).toBe(14.50)
    expect(recipes[0].type).toBe('final_product')

    // 2. Verificar ingredientes en 'recipe_ingredients'
    const recipeIngredients = mockSupabase._dataStore['recipe_ingredients']
    expect(recipeIngredients).toHaveLength(2)
    expect(recipeIngredients[0].ingredient_id).toBe('ing-pan-ciabatta')
    expect(recipeIngredients[1].ingredient_id).toBe('ing-lomo')

    // 3. Verificar sub-receta en 'recipe_sub_recipes'
    const recipeSubRecipes = mockSupabase._dataStore['recipe_sub_recipes']
    expect(recipeSubRecipes).toHaveLength(1)
    expect(recipeSubRecipes[0].child_recipe_id).toBe('sub-salsa-chimichurri')
  })
})
