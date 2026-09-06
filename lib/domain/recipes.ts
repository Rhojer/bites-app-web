export interface IngredientItem {
  id: string
  name: string
  current_stock: number
  cost_per_unit: number
  unit?: string
}

export interface RecipeItem {
  id: string
  name?: string | null
  type?: string | null // 'final_product' | 'sub_recipe'
  price?: number | null
  yield_quantity?: number | null
  yield_unit?: string | null
  cost_per_unit?: number | null
}

export interface RecipeIngredientRelation {
  recipe_id: string
  ingredient_id: string
  quantity: number
}

export interface RecipeSubRecipeRelation {
  parent_recipe_id: string
  child_recipe_id: string
  quantity: number
}

export interface RecipeCostBreakdown {
  recipeId: string
  recipeName: string
  type: string
  directIngredientsCost: number
  subRecipesCost: number
  totalBatchCost: number
  unitCost: number
  price: number
  grossProfit: number
  profitMarginPct: number
  details: {
    ingredients: Array<{
      ingredientId: string
      name: string
      quantity: number
      unitCost: number
      totalCost: number
    }>
    subRecipes: Array<{
      subRecipeId: string
      name: string
      quantity: number
      unitCost: number
      totalCost: number
    }>
  }
}

export interface LimitingIngredientInfo {
  ingredientId: string
  name: string
  currentStock: number
  requiredPerPortion: number
  maxPossiblePortions: number
}

export interface PreparableDishesResult {
  recipeId: string
  preparableUnits: number
  limitingIngredient: LimitingIngredientInfo | null
  ingredientsBreakdown: Array<{
    ingredientId: string
    name: string
    currentStock: number
    requiredPerPortion: number
    maxPossible: number
  }>
}

/**
 * Calcula el costo dinámico en cascada de una receta y sus sub-recetas anidadas.
 * Soporta anidamiento recursivo de sub-recetas (ej. salsa tártara -> mayonesa base -> aceite/huevo).
 */
export function calculateRecipeCost(
  recipeId: string,
  recipes: RecipeItem[],
  ingredients: IngredientItem[],
  recipeIngredients: RecipeIngredientRelation[],
  recipeSubRecipes: RecipeSubRecipeRelation[],
  visited = new Set<string>()
): RecipeCostBreakdown {
  if (visited.has(recipeId)) {
    throw new Error(`Dependencia circular detectada en la receta con ID: ${recipeId}`)
  }
  visited.add(recipeId)

  const recipe = recipes.find((r) => r.id === recipeId)
  const recipeName = recipe?.name || 'Receta'
  const type = recipe?.type || 'final_product'
  const price = recipe?.price || 0
  const yieldQuantity = recipe?.yield_quantity && recipe.yield_quantity > 0 ? recipe.yield_quantity : 1

  // 1. Insumos directos
  const directIngs = recipeIngredients.filter((ri) => ri.recipe_id === recipeId)
  const ingredientsDetails = directIngs.map((ri) => {
    const ing = ingredients.find((i) => i.id === ri.ingredient_id)
    const ingCost = ing ? ing.cost_per_unit : 0
    const totalCost = ingCost * ri.quantity
    return {
      ingredientId: ri.ingredient_id,
      name: ing?.name || 'Insumo',
      quantity: ri.quantity,
      unitCost: ingCost,
      totalCost,
    }
  })
  const directIngredientsCost = ingredientsDetails.reduce((acc, curr) => acc + curr.totalCost, 0)

  // 2. Sub-recetas anidadas (cálculo en cascada recursivo)
  const childSubs = recipeSubRecipes.filter((rs) => rs.parent_recipe_id === recipeId)
  const subRecipesDetails = childSubs.map((rs) => {
    const childCost = calculateRecipeCost(
      rs.child_recipe_id,
      recipes,
      ingredients,
      recipeIngredients,
      recipeSubRecipes,
      new Set(visited)
    )
    const childUnitCost = childCost.unitCost
    const totalCost = childUnitCost * rs.quantity
    return {
      subRecipeId: rs.child_recipe_id,
      name: childCost.recipeName,
      quantity: rs.quantity,
      unitCost: childUnitCost,
      totalCost,
    }
  })
  const subRecipesCost = subRecipesDetails.reduce((acc, curr) => acc + curr.totalCost, 0)

  // 3. Costo Total del Lote y Costo Unitario
  const totalBatchCost = directIngredientsCost + subRecipesCost
  const unitCost = type === 'sub_recipe' ? totalBatchCost / yieldQuantity : totalBatchCost

  // 4. Margen de Ganancia
  const grossProfit = price - unitCost
  const profitMarginPct = price > 0 ? (grossProfit / price) * 100 : 0

  return {
    recipeId,
    recipeName,
    type,
    directIngredientsCost,
    subRecipesCost,
    totalBatchCost,
    unitCost,
    price,
    grossProfit,
    profitMarginPct,
    details: {
      ingredients: ingredientsDetails,
      subRecipes: subRecipesDetails,
    },
  }
}

/**
 * Descompone una receta y sus sub-recetas en los insumos base requeridos por porción.
 */
export function getFlattenedIngredientRequirements(
  recipeId: string,
  recipes: RecipeItem[],
  recipeIngredients: RecipeIngredientRelation[],
  recipeSubRecipes: RecipeSubRecipeRelation[],
  multiplier = 1,
  visited = new Set<string>()
): Map<string, number> {
  if (visited.has(recipeId)) {
    throw new Error(`Dependencia circular detectada en la receta con ID: ${recipeId}`)
  }
  visited.add(recipeId)

  const recipe = recipes.find((r) => r.id === recipeId)
  const yieldQuantity = recipe?.yield_quantity && recipe.yield_quantity > 0 ? recipe.yield_quantity : 1
  const requirements = new Map<string, number>()

  // Insumos directos
  const directIngs = recipeIngredients.filter((ri) => ri.recipe_id === recipeId)
  for (const item of directIngs) {
    const qtyPerPortion = (item.quantity / yieldQuantity) * multiplier
    requirements.set(item.ingredient_id, (requirements.get(item.ingredient_id) || 0) + qtyPerPortion)
  }

  // Sub-recetas
  const childSubs = recipeSubRecipes.filter((rs) => rs.parent_recipe_id === recipeId)
  for (const sub of childSubs) {
    const subMultiplier = (sub.quantity / yieldQuantity) * multiplier
    const subRequirements = getFlattenedIngredientRequirements(
      sub.child_recipe_id,
      recipes,
      recipeIngredients,
      recipeSubRecipes,
      subMultiplier,
      new Set(visited)
    )

    for (const [ingId, qty] of subRequirements.entries()) {
      requirements.set(ingId, (requirements.get(ingId) || 0) + qty)
    }
  }

  return requirements
}

/**
 * Calcula la cantidad de platos preparables con el stock disponible de insumos,
 * identificando el insumo limitante (cuello de botella del escandallo).
 */
export function calculatePreparableDishes(
  recipeId: string,
  recipes: RecipeItem[],
  ingredients: IngredientItem[],
  recipeIngredients: RecipeIngredientRelation[],
  recipeSubRecipes: RecipeSubRecipeRelation[]
): PreparableDishesResult {
  const requirements = getFlattenedIngredientRequirements(
    recipeId,
    recipes,
    recipeIngredients,
    recipeSubRecipes
  )

  if (requirements.size === 0) {
    return {
      recipeId,
      preparableUnits: 0,
      limitingIngredient: null,
      ingredientsBreakdown: [],
    }
  }

  const breakdown: Array<{
    ingredientId: string
    name: string
    currentStock: number
    requiredPerPortion: number
    maxPossible: number
  }> = []

  let minUnits = Infinity
  let limiting: LimitingIngredientInfo | null = null

  for (const [ingredientId, requiredPerPortion] of requirements.entries()) {
    const ing = ingredients.find((i) => i.id === ingredientId)
    const currentStock = ing ? ing.current_stock : 0
    const maxPossible = requiredPerPortion > 0 ? Math.floor(currentStock / requiredPerPortion) : 0

    const itemInfo = {
      ingredientId,
      name: ing?.name || 'Insumo',
      currentStock,
      requiredPerPortion,
      maxPossible: Math.max(0, maxPossible),
    }

    breakdown.push(itemInfo)

    if (maxPossible < minUnits) {
      minUnits = maxPossible
      limiting = {
        ingredientId,
        name: itemInfo.name,
        currentStock,
        requiredPerPortion,
        maxPossiblePortions: Math.max(0, maxPossible),
      }
    }
  }

  const preparableUnits = minUnits === Infinity ? 0 : Math.max(0, minUnits)

  return {
    recipeId,
    preparableUnits,
    limitingIngredient: limiting,
    ingredientsBreakdown: breakdown,
  }
}
