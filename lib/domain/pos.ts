import { IngredientItem, RecipeItem, RecipeIngredientRelation, RecipeSubRecipeRelation, getFlattenedIngredientRequirements } from './recipes'

export interface POSCartItem {
  recipe_id: string
  name?: string
  quantity: number
  unit_price: number
  notes?: string
}

export interface OrderTotals {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export interface InventoryDeductionItem {
  ingredient_id: string
  name: string
  previous_stock: number
  deducted_quantity: number
  new_stock: number
  unit_cost: number
  total_cost: number
}

export interface PaymentItem {
  payment_method_id: string
  amount: number
  reference_number?: string | null
}

/**
 * Calcula subtotal, descuentos, impuestos y total de una orden POS.
 */
export function calculateOrderTotals(
  items: POSCartItem[],
  discount = 0,
  taxRate = 0
): OrderTotals {
  const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0)
  const discountAmount = Math.min(subtotal, Math.max(0, discount))
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const tax = taxableAmount * (taxRate >= 0 ? taxRate : 0)
  const total = taxableAmount + tax

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discountAmount.toFixed(2)),
    tax: Number(taxRate > 0 ? tax.toFixed(2) : 0),
    total: Number(total.toFixed(2)),
  }
}

/**
 * Valida que los pagos cubran exactamente el monto total de la orden (soporte multi-método).
 */
export function validatePaymentSplit(
  total: number,
  payments: PaymentItem[],
  tolerance = 0.01
): { isValid: boolean; totalPaid: number; difference: number } {
  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0)
  const difference = Number((totalPaid - total).toFixed(2))
  const isValid = Math.abs(difference) <= tolerance

  return {
    isValid,
    totalPaid: Number(totalPaid.toFixed(2)),
    difference,
  }
}

/**
 * Calcula las deducciones exactas de inventario que deben aplicarse a los ingredientes base
 * al procesar una orden de venta en el POS (incluyendo ingredientes directos y sub-recetas en cascada).
 */
export function calculatePOSInventoryDeductions(
  items: POSCartItem[],
  ingredients: IngredientItem[],
  recipes: RecipeItem[],
  recipeIngredients: RecipeIngredientRelation[],
  recipeSubRecipes: RecipeSubRecipeRelation[]
): {
  deductions: InventoryDeductionItem[]
  totalFoodCost: number
} {
  const requiredStockMap = new Map<string, number>()

  for (const item of items) {
    if (item.quantity <= 0) continue

    const reqs = getFlattenedIngredientRequirements(
      item.recipe_id,
      recipes,
      recipeIngredients,
      recipeSubRecipes,
      item.quantity,
      new Set<string>(),
      ingredients
    )

    for (const [ingId, qty] of reqs.entries()) {
      requiredStockMap.set(ingId, (requiredStockMap.get(ingId) || 0) + qty)
    }
  }

  const deductions: InventoryDeductionItem[] = []
  let totalFoodCost = 0

  for (const [ingId, qty] of requiredStockMap.entries()) {
    const ing = ingredients.find((i) => i.id === ingId)
    const prevStock = ing ? ing.current_stock : 0
    const unitCost = ing ? ing.cost_per_unit : 0
    const newStock = Math.max(0, Number((prevStock - qty).toFixed(4)))
    const cost = Number((qty * unitCost).toFixed(4))

    totalFoodCost += cost
    deductions.push({
      ingredient_id: ingId,
      name: ing?.name || 'Insumo',
      previous_stock: prevStock,
      deducted_quantity: Number(qty.toFixed(4)),
      new_stock: newStock,
      unit_cost: unitCost,
      total_cost: cost,
    })
  }

  return {
    deductions,
    totalFoodCost: Number(totalFoodCost.toFixed(2)),
  }
}
