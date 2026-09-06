import { describe, it, expect } from 'vitest'
import {
  calculateRecipeCost,
  RecipeItem,
  IngredientItem,
  RecipeIngredientRelation,
  RecipeSubRecipeRelation,
} from '@/lib/domain/recipes'

describe('Domain: Costeo Dinámico de Recetas y Sub-recetas en Cascada', () => {
  // Setup de datos base de insumos
  const ingredients: IngredientItem[] = [
    { id: 'ing-carne', name: 'Carne Molida Premium', current_stock: 10, cost_per_unit: 8.0, unit: 'kg' }, // $8/kg
    { id: 'ing-pan', name: 'Pan Brioche Artesanal', current_stock: 50, cost_per_unit: 0.5, unit: 'und' }, // $0.50/und
    { id: 'ing-queso', name: 'Queso Cheddar', current_stock: 5, cost_per_unit: 10.0, unit: 'kg' }, // $10/kg
    { id: 'ing-huevo', name: 'Huevo', current_stock: 100, cost_per_unit: 0.2, unit: 'und' }, // $0.20/und
    { id: 'ing-aceite', name: 'Aceite Vegetal', current_stock: 20, cost_per_unit: 3.0, unit: 'lt' }, // $3.00/lt
    { id: 'ing-pepinillo', name: 'Pepinillos Encurtidos', current_stock: 4, cost_per_unit: 5.0, unit: 'kg' }, // $5.00/kg
  ]

  // Recetas y sub-recetas
  const recipes: RecipeItem[] = [
    // Sub-receta Nivel 1: Mayonesa Base (rinde 10 porciones)
    {
      id: 'sub-mayo',
      name: 'Mayonesa Casera Base',
      type: 'sub_recipe',
      yield_quantity: 10,
      yield_unit: 'porcion',
    },
    // Sub-receta Nivel 2: Salsa Tártara Especial (usa Mayonesa Casera + Pepinillos, rinde 5 porciones)
    {
      id: 'sub-tartara',
      name: 'Salsa Tártara Especial',
      type: 'sub_recipe',
      yield_quantity: 5,
      yield_unit: 'porcion',
    },
    // Plato Final: Hamburguesa Doble Deluxe (usa Pan, Carne, Queso + Salsa Tártara)
    {
      id: 'dish-burger-deluxe',
      name: 'Hamburguesa Doble Deluxe',
      type: 'final_product',
      price: 12.0,
      yield_quantity: 1,
      yield_unit: 'plato',
    },
  ]

  // Relaciones de ingredientes
  const recipeIngredients: RecipeIngredientRelation[] = [
    // Mayonesa: 2 huevos ($0.40) + 0.5 lt aceite ($1.50) = $1.90 total lote / 10 porciones = $0.19 por porción
    { recipe_id: 'sub-mayo', ingredient_id: 'ing-huevo', quantity: 2 },
    { recipe_id: 'sub-mayo', ingredient_id: 'ing-aceite', quantity: 0.5 },

    // Salsa Tártara: 0.1 kg pepinillos ($0.50) + sub-receta mayo
    { recipe_id: 'sub-tartara', ingredient_id: 'ing-pepinillo', quantity: 0.1 },

    // Hamburguesa: 1 pan ($0.50) + 0.2 kg carne ($1.60) + 0.05 kg queso ($0.50) = $2.60 ingredientes directos
    { recipe_id: 'dish-burger-deluxe', ingredient_id: 'ing-pan', quantity: 1 },
    { recipe_id: 'dish-burger-deluxe', ingredient_id: 'ing-carne', quantity: 0.2 },
    { recipe_id: 'dish-burger-deluxe', ingredient_id: 'ing-queso', quantity: 0.05 },
  ]

  // Relaciones de sub-recetas
  const recipeSubRecipes: RecipeSubRecipeRelation[] = [
    // Salsa Tártara usa 2 porciones de Mayonesa Base: 2 * $0.19 = $0.38
    // Costo total lote Tártara = $0.50 (pepinillos) + $0.38 (mayo) = $0.88
    // Costo por porción Tártara (5 porciones) = $0.88 / 5 = $0.176
    { parent_recipe_id: 'sub-tartara', child_recipe_id: 'sub-mayo', quantity: 2 },

    // Hamburguesa usa 1 porción de Salsa Tártara ($0.176)
    { parent_recipe_id: 'dish-burger-deluxe', child_recipe_id: 'sub-tartara', quantity: 1 },
  ]

  it('debe calcular el costo unitario de una sub-receta simple basada en insumos directos y rendimiento', () => {
    const mayoCost = calculateRecipeCost(
      'sub-mayo',
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes
    )

    // Insumos directos: 2 * 0.20 + 0.5 * 3.00 = 0.40 + 1.50 = $1.90
    expect(mayoCost.directIngredientsCost).toBeCloseTo(1.90, 4)
    expect(mayoCost.subRecipesCost).toBe(0)
    expect(mayoCost.totalBatchCost).toBeCloseTo(1.90, 4)
    // Rendimiento: 10 porciones => Costo unitario = 1.90 / 10 = $0.19
    expect(mayoCost.unitCost).toBeCloseTo(0.19, 4)
  })

  it('debe calcular el costo en cascada de una sub-receta anidada que contiene otra sub-receta', () => {
    const tartaraCost = calculateRecipeCost(
      'sub-tartara',
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes
    )

    // Directos: 0.1 kg pepinillos * $5.00/kg = $0.50
    expect(tartaraCost.directIngredientsCost).toBeCloseTo(0.50, 4)
    // Sub-receta mayo: 2 porciones * $0.19 = $0.38
    expect(tartaraCost.subRecipesCost).toBeCloseTo(0.38, 4)
    // Total lote = $0.50 + $0.38 = $0.88
    expect(tartaraCost.totalBatchCost).toBeCloseTo(0.88, 4)
    // Rendimiento: 5 porciones => Costo unitario = 0.88 / 5 = $0.176
    expect(tartaraCost.unitCost).toBeCloseTo(0.176, 4)
  })

  it('debe calcular el costo total, food cost y margen % de ganancia de un plato final con sub-recetas anidadas', () => {
    const burgerCost = calculateRecipeCost(
      'dish-burger-deluxe',
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes
    )

    // Directos: Pan ($0.50) + Carne ($1.60) + Queso ($0.50) = $2.60
    expect(burgerCost.directIngredientsCost).toBeCloseTo(2.60, 4)
    // Sub-receta tártara: 1 porción * $0.176 = $0.176
    expect(burgerCost.subRecipesCost).toBeCloseTo(0.176, 4)
    // Costo total unitario = $2.60 + $0.176 = $2.776
    expect(burgerCost.unitCost).toBeCloseTo(2.776, 4)

    // Precio venta: $12.00
    // Utilidad bruta = $12.00 - $2.776 = $9.224
    expect(burgerCost.grossProfit).toBeCloseTo(9.224, 3)
    // Margen % = (9.224 / 12.00) * 100 = 76.8667%
    expect(burgerCost.profitMarginPct).toBeCloseTo(76.867, 2)
  })

  it('debe actualizar dinámicamente el costo del plato si sube el precio de un insumo base (efecto cascada)', () => {
    // Supongamos que el aceite vegetal sube de $3.00 a $6.00 por litro (+100%)
    const updatedIngredients: IngredientItem[] = ingredients.map((ing) =>
      ing.id === 'ing-aceite' ? { ...ing, cost_per_unit: 6.0 } : ing
    )

    const updatedBurgerCost = calculateRecipeCost(
      'dish-burger-deluxe',
      recipes,
      updatedIngredients,
      recipeIngredients,
      recipeSubRecipes
    )

    // Nueva mayo: 2*0.2 + 0.5*6.0 = 0.40 + 3.00 = $3.40 / 10 = $0.34 por porción
    // Nueva tártara: $0.50 + 2*$0.34 ($0.68) = $1.18 / 5 = $0.236 por porción
    // Nueva hamburguesa: $2.60 + $0.236 = $2.836
    expect(updatedBurgerCost.unitCost).toBeCloseTo(2.836, 4)
    // Nuevo margen % = (12 - 2.836) / 12 * 100 = 76.3667%
    expect(updatedBurgerCost.profitMarginPct).toBeCloseTo(76.367, 2)
  })

  it('debe detectar y prevenir ciclos de dependencia circular en recetas', () => {
    const circularSubRecipes: RecipeSubRecipeRelation[] = [
      { parent_recipe_id: 'sub-mayo', child_recipe_id: 'sub-tartara', quantity: 1 },
      { parent_recipe_id: 'sub-tartara', child_recipe_id: 'sub-mayo', quantity: 1 },
    ]

    expect(() => {
      calculateRecipeCost(
        'sub-mayo',
        recipes,
        ingredients,
        recipeIngredients,
        circularSubRecipes
      )
    }).toThrow(/Dependencia circular detectada/)
  })
})
