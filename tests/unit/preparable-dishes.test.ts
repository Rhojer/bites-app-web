import { describe, it, expect } from 'vitest'
import {
  calculatePreparableDishes,
  RecipeItem,
  IngredientItem,
  RecipeIngredientRelation,
  RecipeSubRecipeRelation,
} from '@/lib/domain/recipes'

describe('Domain: Cálculo de Platos Preparables con Stock de Insumos Limitantes', () => {
  const recipes: RecipeItem[] = [
    { id: 'sub-salsa', name: 'Salsa Especial', type: 'sub_recipe', yield_quantity: 4 },
    { id: 'dish-taco', name: 'Tacos de Res', type: 'final_product', price: 8.0 },
  ]

  const recipeIngredients: RecipeIngredientRelation[] = [
    // Sub-receta salsa: 0.4 kg tomate + 0.1 kg cebolla para 4 porciones (0.1 kg tomate y 0.025 kg cebolla por porción)
    { recipe_id: 'sub-salsa', ingredient_id: 'ing-tomate', quantity: 0.4 },
    { recipe_id: 'sub-salsa', ingredient_id: 'ing-cebolla', quantity: 0.1 },

    // Plato taco: 3 tortillas + 0.15 kg carne + 1 porción de salsa especial
    { recipe_id: 'dish-taco', ingredient_id: 'ing-tortilla', quantity: 3 },
    { recipe_id: 'dish-taco', ingredient_id: 'ing-carne', quantity: 0.15 },
  ]

  const recipeSubRecipes: RecipeSubRecipeRelation[] = [
    { parent_recipe_id: 'dish-taco', child_recipe_id: 'sub-salsa', quantity: 1 },
  ]

  it('debe calcular correctamente las porciones preparables identificando el insumo limitante directo', () => {
    const ingredients: IngredientItem[] = [
      { id: 'ing-tortilla', name: 'Tortillas de Maíz', current_stock: 60, cost_per_unit: 0.1 }, // 60 / 3 = 20 tacos
      { id: 'ing-carne', name: 'Carne para Tacos', current_stock: 1.5, cost_per_unit: 9.0 }, // 1.5 kg / 0.15 kg = 10 tacos (LIMITANTE)
      { id: 'ing-tomate', name: 'Tomate', current_stock: 5.0, cost_per_unit: 2.0 }, // 5.0 kg / 0.1 kg = 50 porciones
      { id: 'ing-cebolla', name: 'Cebolla', current_stock: 2.0, cost_per_unit: 1.5 }, // 2.0 kg / 0.025 kg = 80 porciones
    ]

    const result = calculatePreparableDishes(
      'dish-taco',
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes
    )

    // El insumo limitante es la carne (solo alcanza para 10 tacos)
    expect(result.preparableUnits).toBe(10)
    expect(result.limitingIngredient).not.toBeNull()
    expect(result.limitingIngredient?.ingredientId).toBe('ing-carne')
    expect(result.limitingIngredient?.name).toBe('Carne para Tacos')
    expect(result.limitingIngredient?.maxPossiblePortions).toBe(10)
  })

  it('debe identificar como limitante un insumo que forma parte de una sub-receta anidada', () => {
    const ingredients: IngredientItem[] = [
      { id: 'ing-tortilla', name: 'Tortillas de Maíz', current_stock: 100, cost_per_unit: 0.1 }, // 100 / 3 = 33 tacos
      { id: 'ing-carne', name: 'Carne para Tacos', current_stock: 5.0, cost_per_unit: 9.0 }, // 5.0 / 0.15 = 33 tacos
      { id: 'ing-tomate', name: 'Tomate', current_stock: 0.5, cost_per_unit: 2.0 }, // 0.5 kg / 0.1 kg = 5 porciones (LIMITANTE)
      { id: 'ing-cebolla', name: 'Cebolla', current_stock: 10.0, cost_per_unit: 1.5 },
    ]

    const result = calculatePreparableDishes(
      'dish-taco',
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes
    )

    // El tomate de la sub-receta solo alcanza para 5 porciones
    expect(result.preparableUnits).toBe(5)
    expect(result.limitingIngredient?.ingredientId).toBe('ing-tomate')
    expect(result.limitingIngredient?.name).toBe('Tomate')
  })

  it('debe retornar 0 platos preparables si algún insumo requerido tiene stock 0', () => {
    const ingredients: IngredientItem[] = [
      { id: 'ing-tortilla', name: 'Tortillas de Maíz', current_stock: 0, cost_per_unit: 0.1 }, // Stock 0
      { id: 'ing-carne', name: 'Carne para Tacos', current_stock: 5.0, cost_per_unit: 9.0 },
      { id: 'ing-tomate', name: 'Tomate', current_stock: 5.0, cost_per_unit: 2.0 },
      { id: 'ing-cebolla', name: 'Cebolla', current_stock: 5.0, cost_per_unit: 1.5 },
    ]

    const result = calculatePreparableDishes(
      'dish-taco',
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes
    )

    expect(result.preparableUnits).toBe(0)
    expect(result.limitingIngredient?.ingredientId).toBe('ing-tortilla')
    expect(result.limitingIngredient?.currentStock).toBe(0)
  })

  it('debe retornar 0 platos si la receta no tiene ingredientes configurados', () => {
    const emptyRecipe: RecipeItem = { id: 'dish-empty', name: 'Plato Vacío' }
    const result = calculatePreparableDishes(
      'dish-empty',
      [emptyRecipe],
      [],
      [],
      []
    )

    expect(result.preparableUnits).toBe(0)
    expect(result.limitingIngredient).toBeNull()
  })
})
