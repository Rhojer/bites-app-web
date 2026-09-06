import { describe, it, expect } from 'vitest'
import {
  calculateOrderTotals,
  validatePaymentSplit,
  calculatePOSInventoryDeductions,
  POSCartItem,
  PaymentItem,
} from '@/lib/domain/pos'
import {
  IngredientItem,
  RecipeItem,
  RecipeIngredientRelation,
  RecipeSubRecipeRelation,
} from '@/lib/domain/recipes'

describe('Domain: Procesamiento de Cobro en POS y Deducción de Stock', () => {
  describe('Cálculo de Totales de Orden y Pagos Divididos', () => {
    const cartItems: POSCartItem[] = [
      { recipe_id: 'dish-1', name: 'Pizza Margarita', quantity: 2, unit_price: 15.0 }, // $30.00
      { recipe_id: 'dish-2', name: 'Refresco Cola', quantity: 3, unit_price: 2.5 }, // $7.50
    ]

    it('debe calcular subtotal y total sin descuento ni impuesto', () => {
      const totals = calculateOrderTotals(cartItems)
      expect(totals.subtotal).toBe(37.5)
      expect(totals.discount).toBe(0)
      expect(totals.tax).toBe(0)
      expect(totals.total).toBe(37.5)
    })

    it('debe aplicar descuentos y calcular impuestos correctamente', () => {
      // Subtotal $37.50, Descuento $7.50 => Base imponible $30.00 => Tax 10% = $3.00 => Total $33.00
      const totals = calculateOrderTotals(cartItems, 7.5, 0.1)
      expect(totals.subtotal).toBe(37.5)
      expect(totals.discount).toBe(7.5)
      expect(totals.tax).toBe(3.0)
      expect(totals.total).toBe(33.0)
    })

    it('debe validar un cobro multi-método dividido (efectivo + tarjeta + zelle)', () => {
      const total = 100.0
      const validPayments: PaymentItem[] = [
        { payment_method_id: 'pm-cash', amount: 50.0 },
        { payment_method_id: 'pm-card', amount: 30.0 },
        { payment_method_id: 'pm-zelle', amount: 20.0 },
      ]

      const result = validatePaymentSplit(total, validPayments)
      expect(result.isValid).toBe(true)
      expect(result.totalPaid).toBe(100.0)
      expect(result.difference).toBe(0)
    })

    it('debe rechazar pagos incompletos o sobrantes', () => {
      const total = 100.0
      const underPayments: PaymentItem[] = [
        { payment_method_id: 'pm-cash', amount: 40.0 },
      ]
      const underResult = validatePaymentSplit(total, underPayments)
      expect(underResult.isValid).toBe(false)
      expect(underResult.difference).toBe(-60.0)

      const overPayments: PaymentItem[] = [
        { payment_method_id: 'pm-cash', amount: 110.0 },
      ]
      const overResult = validatePaymentSplit(total, overPayments)
      expect(overResult.isValid).toBe(false)
      expect(overResult.difference).toBe(10.0)
    })
  })

  describe('Deducción de Inventario en Cascada tras Venta POS', () => {
    const ingredients: IngredientItem[] = [
      { id: 'ing-harina', name: 'Harina de Trigo', current_stock: 20.0, cost_per_unit: 1.0, unit: 'kg' },
      { id: 'ing-queso', name: 'Queso Mozzarella', current_stock: 10.0, cost_per_unit: 8.0, unit: 'kg' },
      { id: 'ing-tomate', name: 'Salsa de Tomate Base', current_stock: 15.0, cost_per_unit: 2.0, unit: 'kg' },
      { id: 'ing-albahaca', name: 'Albahaca Fresca', current_stock: 2.0, cost_per_unit: 10.0, unit: 'kg' },
    ]

    const recipes: RecipeItem[] = [
      // Sub-receta: Masa de Pizza (rinde 5 porciones)
      { id: 'sub-masa', name: 'Masa de Pizza Fermentada', type: 'sub_recipe', yield_quantity: 5 },
      // Plato: Pizza Margarita (usa 1 porción de masa + salsa + queso + albahaca)
      { id: 'dish-pizza', name: 'Pizza Margarita Familiar', type: 'final_product', price: 15.0 },
    ]

    const recipeIngredients: RecipeIngredientRelation[] = [
      // Masa de Pizza (5 porciones): 2.5 kg harina (0.5 kg por porción)
      { recipe_id: 'sub-masa', ingredient_id: 'ing-harina', quantity: 2.5 },
      // Pizza Margarita: 0.2 kg salsa tomate, 0.3 kg queso mozzarella, 0.02 kg albahaca
      { recipe_id: 'dish-pizza', ingredient_id: 'ing-tomate', quantity: 0.2 },
      { recipe_id: 'dish-pizza', ingredient_id: 'ing-queso', quantity: 0.3 },
      { recipe_id: 'dish-pizza', ingredient_id: 'ing-albahaca', quantity: 0.02 },
    ]

    const recipeSubRecipes: RecipeSubRecipeRelation[] = [
      { parent_recipe_id: 'dish-pizza', child_recipe_id: 'sub-masa', quantity: 1 },
    ]

    it('debe descontar correctamente del stock tanto los insumos directos como los de sub-recetas anidadas al vender 4 pizzas', () => {
      const orderItems: POSCartItem[] = [
        { recipe_id: 'dish-pizza', name: 'Pizza Margarita Familiar', quantity: 4, unit_price: 15.0 },
      ]

      const { deductions, totalFoodCost } = calculatePOSInventoryDeductions(
        orderItems,
        ingredients,
        recipes,
        recipeIngredients,
        recipeSubRecipes
      )

      // Se vendieron 4 pizzas:
      // 1. Harina (de sub-receta masa: 0.5 kg/pizza * 4 = 2.0 kg harina)
      //    Stock previo 20.0 -> Nuevo stock 18.0. Costo = 2.0 * $1.0 = $2.00
      const harinaDed = deductions.find((d) => d.ingredient_id === 'ing-harina')
      expect(harinaDed).toBeDefined()
      expect(harinaDed?.deducted_quantity).toBe(2.0)
      expect(harinaDed?.previous_stock).toBe(20.0)
      expect(harinaDed?.new_stock).toBe(18.0)
      expect(harinaDed?.total_cost).toBe(2.0)

      // 2. Queso Mozzarella (directo: 0.3 kg/pizza * 4 = 1.2 kg queso)
      //    Stock previo 10.0 -> Nuevo stock 8.8. Costo = 1.2 * $8.0 = $9.60
      const quesoDed = deductions.find((d) => d.ingredient_id === 'ing-queso')
      expect(quesoDed).toBeDefined()
      expect(quesoDed?.deducted_quantity).toBe(1.2)
      expect(quesoDed?.previous_stock).toBe(10.0)
      expect(quesoDed?.new_stock).toBe(8.8)
      expect(quesoDed?.total_cost).toBe(9.6)

      // 3. Salsa de Tomate (directo: 0.2 kg * 4 = 0.8 kg)
      //    Stock previo 15.0 -> Nuevo stock 14.2. Costo = 0.8 * $2.0 = $1.60
      const tomateDed = deductions.find((d) => d.ingredient_id === 'ing-tomate')
      expect(tomateDed).toBeDefined()
      expect(tomateDed?.deducted_quantity).toBe(0.8)
      expect(tomateDed?.new_stock).toBe(14.2)
      expect(tomateDed?.total_cost).toBe(1.6)

      // 4. Albahaca (directo: 0.02 kg * 4 = 0.08 kg)
      //    Stock previo 2.0 -> Nuevo stock 1.92. Costo = 0.08 * $10.0 = $0.80
      const albahacaDed = deductions.find((d) => d.ingredient_id === 'ing-albahaca')
      expect(albahacaDed).toBeDefined()
      expect(albahacaDed?.deducted_quantity).toBe(0.08)
      expect(albahacaDed?.new_stock).toBe(1.92)

      // Total Food Cost = 2.00 + 9.60 + 1.60 + 0.80 = $14.00
      expect(totalFoodCost).toBe(14.0)
    })
  })
})
