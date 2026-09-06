import { describe, it, expect } from 'vitest'
import {
  calculatePLStatement,
  OrderRecord,
  OrderItemRecord,
  ExpenseRecord,
  PaymentMethodRecord,
  PaymentTransactionRecord,
  InventoryMovementRecord,
} from '@/lib/domain/finances'
import { RecipeItem, IngredientItem, RecipeIngredientRelation } from '@/lib/domain/recipes'

describe('Domain: Cálculo del Estado de Pérdidas y Ganancias (P&L)', () => {
  // 1. Órdenes y ventas
  const orders: OrderRecord[] = [
    { id: 'ord-1', total: 120.0, status: 'completed' },
    { id: 'ord-2', total: 80.0, status: 'completed' },
    { id: 'ord-3', total: 300.0, status: 'completed' },
  ] // Ingresos Totales = $500.00

  // 2. Desglose de items vendidos y recetas
  const recipes: RecipeItem[] = [
    { id: 'rec-pasta', name: 'Pasta Carbonara', cost_per_unit: 4.0 },
    { id: 'rec-ribeye', name: 'Bife de Chorizo', cost_per_unit: 12.0 },
  ]

  const orderItems: OrderItemRecord[] = [
    { id: 'item-1', order_id: 'ord-1', recipe_id: 'rec-pasta', quantity: 5, unit_price: 24.0, subtotal: 120.0 }, // Costo = 5 * 4 = $20.00
    { id: 'item-2', order_id: 'ord-2', recipe_id: 'rec-pasta', quantity: 2, unit_price: 24.0, subtotal: 48.0 }, // Costo = 2 * 4 = $8.00
    { id: 'item-3', order_id: 'ord-3', recipe_id: 'rec-ribeye', quantity: 10, unit_price: 30.0, subtotal: 300.0 }, // Costo = 10 * 12 = $120.00
  ] // Costo de ventas de alimentos (Sales Food Cost) = 20 + 8 + 120 = $148.00

  // 3. Movimientos de inventario (incluyendo mermas)
  const inventoryMovements: InventoryMovementRecord[] = [
    { id: 'mov-1', ingredient_id: 'ing-1', type: 'waste', quantity: -2.0, unit_cost: 6.0, reason: 'Queso vencido' }, // Merma = 2 * 6 = $12.00
  ] // Total Food Cost = 148 + 12 = $160.00

  // 4. Gastos Operativos (Fijos y Variables)
  const expenses: ExpenseRecord[] = [
    // Fijos: $100 alquiler + $50 servicios básicos = $150.00
    { id: 'exp-1', category: 'Alquiler', type: 'fixed', amount: 100.0 },
    { id: 'exp-2', category: 'Servicios Básicos (Luz/Gas)', type: 'fixed', amount: 50.0 },
    // Variables: $30 mantenimiento + $20 egreso justificado = $50.00
    { id: 'exp-3', category: 'Mantenimiento', type: 'variable', amount: 30.0 },
    { id: 'exp-4', category: 'Insumos Menores', type: 'variable', amount: 20.0 },
  ] // Total Opex = 150 + 50 = $200.00

  // 5. Métodos de pago y transacciones con comisiones
  const paymentMethods: PaymentMethodRecord[] = [
    { id: 'pm-cash', name: 'Efectivo', commission_percentage: 0, commission_fixed: 0 },
    { id: 'pm-card', name: 'Tarjeta Crédito', commission_percentage: 3.0, commission_fixed: 0.25 }, // 3% + $0.25
  ]

  const payments: PaymentTransactionRecord[] = [
    { id: 'pay-1', order_id: 'ord-1', payment_method_id: 'pm-cash', amount: 120.0 }, // Comisión = $0
    { id: 'pay-2', order_id: 'ord-2', payment_method_id: 'pm-card', amount: 80.0 }, // Comisión = (80 * 0.03) + 0.25 = 2.40 + 0.25 = $2.65
    { id: 'pay-3', order_id: 'ord-3', payment_method_id: 'pm-card', amount: 300.0 }, // Comisión = (300 * 0.03) + 0.25 = 9.00 + 0.25 = $9.25
  ] // Comisiones Bancarias Totales = 2.65 + 9.25 = $11.90

  it('debe calcular correctamente todas las líneas del estado P&L hasta la Utilidad Neta', () => {
    const pl = calculatePLStatement({
      orders,
      orderItems,
      recipes,
      inventoryMovements,
      expenses,
      paymentMethods,
      payments,
    })

    // 1. Ingresos = $500.00
    expect(pl.totalRevenue).toBe(500.0)

    // 2. Costos de Alimentos: Venta $148 + Merma $12 = $160.00
    expect(pl.salesFoodCost).toBe(148.0)
    expect(pl.wasteCost).toBe(12.0)
    expect(pl.totalFoodCost).toBe(160.0)

    // 3. Utilidad Bruta = $500 - $160 = $340.00
    // Margen Bruto = (340 / 500) * 100 = 68.00%
    expect(pl.grossProfit).toBe(340.0)
    expect(pl.grossMarginPct).toBe(68.0)

    // 4. Gastos Operativos: Fijos $150 + Variables $50 = $200.00
    expect(pl.fixedExpenses).toBe(150.0)
    expect(pl.variableExpenses).toBe(50.0)
    expect(pl.totalExpenses).toBe(200.0)

    // 5. Comisiones Pasarelas = $11.90
    expect(pl.bankCommissions).toBe(11.90)

    // 6. Utilidad Neta = Utilidad Bruta ($340) - Gastos Operativos ($200) - Comisiones ($11.90) = $128.10
    // Margen Neto = (128.10 / 500) * 100 = 25.62%
    expect(pl.netProfit).toBe(128.10)
    expect(pl.netMarginPct).toBeCloseTo(25.62, 2)
  })

  it('debe calcular dinámicamente el costo de insumos de recetas si no tienen cost_per_unit precalculado', () => {
    const dynamicRecipes: RecipeItem[] = [
      { id: 'rec-ensalada', name: 'Ensalada César', cost_per_unit: null },
    ]

    const ingredients: IngredientItem[] = [
      { id: 'ing-lechuga', name: 'Lechuga Romana', cost_per_unit: 1.5, current_stock: 10 },
      { id: 'ing-aderezo', name: 'Aderezo César', cost_per_unit: 4.0, current_stock: 5 },
    ]

    const recipeIngredients: RecipeIngredientRelation[] = [
      { recipe_id: 'rec-ensalada', ingredient_id: 'ing-lechuga', quantity: 0.5 }, // 0.5 * 1.5 = $0.75
      { recipe_id: 'rec-ensalada', ingredient_id: 'ing-aderezo', quantity: 0.1 }, // 0.1 * 4.0 = $0.40
    ] // Costo calculado = $1.15 por porción

    const dynamicOrderItems: OrderItemRecord[] = [
      { id: 'item-caesar', order_id: 'ord-1', recipe_id: 'rec-ensalada', quantity: 4, unit_price: 10.0, subtotal: 40.0 },
    ] // Costo total = 4 * 1.15 = $4.60

    const pl = calculatePLStatement({
      orders: [{ id: 'ord-1', total: 40.0 }],
      orderItems: dynamicOrderItems,
      recipes: dynamicRecipes,
      ingredients,
      recipeIngredients,
      expenses: [],
    })

    expect(pl.salesFoodCost).toBe(4.6)
    expect(pl.grossProfit).toBe(35.4) // 40 - 4.60
    expect(pl.netProfit).toBe(35.4)
  })

  it('debe manejar adecuadamente un escenario sin ventas (0 revenue) sin errores de división por cero', () => {
    const pl = calculatePLStatement({
      orders: [],
      expenses: [{ id: 'exp-1', category: 'Alquiler', type: 'fixed', amount: 200.0 }],
    })

    expect(pl.totalRevenue).toBe(0)
    expect(pl.grossMarginPct).toBe(0)
    expect(pl.netProfit).toBe(-200.0) // Pérdida de $200
    expect(pl.netMarginPct).toBe(0)
  })
})
