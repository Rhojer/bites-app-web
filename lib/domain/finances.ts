import { RecipeItem, IngredientItem, RecipeIngredientRelation } from './recipes'

export interface OrderRecord {
  id: string
  total: number | null
  status?: string | null
  payment_status?: string | null
}

export interface OrderItemRecord {
  id: string
  order_id: string
  recipe_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface InventoryMovementRecord {
  id: string
  ingredient_id: string | null
  type: string // 'purchase' | 'waste' | 'sale_deduction' | 'adjustment'
  quantity: number
  unit_cost: number
  reason?: string | null
}

export interface ExpenseRecord {
  id: string
  category: string
  type: string // 'fixed' | 'variable'
  amount: number
  date?: string
  description?: string | null
}

export interface PaymentMethodRecord {
  id: string
  name: string
  commission_percentage?: number | null
  commission_fixed?: number | null
  is_active?: boolean | null
}

export interface PaymentTransactionRecord {
  id: string
  order_id: string
  payment_method_id: string
  amount: number
}

export interface PLStatementResult {
  totalRevenue: number
  salesFoodCost: number
  wasteCost: number
  totalFoodCost: number
  grossProfit: number
  grossMarginPct: number
  fixedExpenses: number
  variableExpenses: number
  totalExpenses: number
  bankCommissions: number
  netProfit: number
  netMarginPct: number
  ordersCount: number
}

/**
 * Calcula el Estado de Resultados (P&L - Profit & Loss) integral del restaurante:
 * - Ingresos por Ventas
 * - Costo de Alimentos Vendidos (Food Cost)
 * - Costo de Mermas / Desperdicios
 * - Utilidad Bruta = Ingresos - Costos Totales de Alimentos
 * - Gastos Operativos Fijos (alquiler, salarios fijos, servicios)
 * - Gastos Operativos Variables (mantenimiento, imprevistos, retiros con nota)
 * - Comisiones Pasarelas / Bancarias
 * - Utilidad Neta = Utilidad Bruta - Gastos Fijos - Gastos Variables - Comisiones
 */
export function calculatePLStatement(params: {
  orders: OrderRecord[]
  orderItems?: OrderItemRecord[]
  recipes?: RecipeItem[]
  ingredients?: IngredientItem[]
  recipeIngredients?: RecipeIngredientRelation[]
  inventoryMovements?: InventoryMovementRecord[]
  expenses: ExpenseRecord[]
  paymentMethods?: PaymentMethodRecord[]
  payments?: PaymentTransactionRecord[]
}): PLStatementResult {
  const {
    orders = [],
    orderItems = [],
    recipes = [],
    ingredients = [],
    recipeIngredients = [],
    inventoryMovements = [],
    expenses = [],
    paymentMethods = [],
    payments = [],
  } = params

  // 1. Ingresos por ventas
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0)

  // 2. Costo de insumos de las recetas vendidas (Food Cost)
  let salesFoodCost = 0

  if (orderItems.length > 0) {
    for (const item of orderItems) {
      const recipe = recipes.find((r) => r.id === item.recipe_id)
      let unitCost = recipe?.cost_per_unit || 0

      // Si la receta no tiene cost_per_unit precalculado, calcularlo de sus ingredientes
      if (!unitCost && item.recipe_id && recipeIngredients.length > 0) {
        const itemRecipeIngs = recipeIngredients.filter((ri) => ri.recipe_id === item.recipe_id)
        unitCost = itemRecipeIngs.reduce((acc, curr) => {
          const ing = ingredients.find((i) => i.id === curr.ingredient_id)
          return acc + (ing ? ing.cost_per_unit * curr.quantity : 0)
        }, 0)
      }

      salesFoodCost += (unitCost || 0) * (item.quantity || 1)
    }
  } else if (inventoryMovements.length > 0) {
    // Si no hay items desglosados, obtener el costo de las deducciones de venta registradas
    const saleDeductions = inventoryMovements.filter((m) => m.type === 'sale_deduction')
    salesFoodCost = saleDeductions.reduce(
      (acc, curr) => acc + Math.abs(curr.quantity) * (curr.unit_cost || 0),
      0
    )
  }

  // 3. Costo de Mermas / Desperdicios
  const wasteMovements = inventoryMovements.filter((m) => m.type === 'waste')
  const wasteCost = wasteMovements.reduce(
    (acc, curr) => acc + Math.abs(curr.quantity) * (curr.unit_cost || 0),
    0
  )

  const totalFoodCost = salesFoodCost + wasteCost

  // 4. Utilidad Bruta
  const grossProfit = totalRevenue - totalFoodCost
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // 5. Gastos Operativos (Fijos vs Variables)
  const fixedExpenses = expenses
    .filter((e) => e.type === 'fixed')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const variableExpenses = expenses
    .filter((e) => e.type !== 'fixed')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalExpenses = fixedExpenses + variableExpenses

  // 6. Comisiones Bancarias / Pasarelas
  const methodMap = new Map<string, PaymentMethodRecord>()
  paymentMethods.forEach((pm) => methodMap.set(pm.id, pm))

  let bankCommissions = 0
  for (const payment of payments) {
    const method = methodMap.get(payment.payment_method_id)
    const commPct = method?.commission_percentage || 0
    const commFixed = method?.commission_fixed || 0
    const commission = (payment.amount * commPct) / 100 + commFixed
    bankCommissions += commission
  }

  // 7. Utilidad Neta Real
  const netProfit = grossProfit - totalExpenses - bankCommissions
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    salesFoodCost: Number(salesFoodCost.toFixed(2)),
    wasteCost: Number(wasteCost.toFixed(2)),
    totalFoodCost: Number(totalFoodCost.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossMarginPct: Number(grossMarginPct.toFixed(2)),
    fixedExpenses: Number(fixedExpenses.toFixed(2)),
    variableExpenses: Number(variableExpenses.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    bankCommissions: Number(bankCommissions.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    netMarginPct: Number(netMarginPct.toFixed(2)),
    ordersCount: orders.length,
  }
}
