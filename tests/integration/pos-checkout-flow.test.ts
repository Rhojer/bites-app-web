import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

// Mocks de Next.js y Supabase
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { processOrderAction } from '@/app/pos/actions'

describe('Integration: Flujo Completo de Cobro en POS y Deducción de Stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabaseClient({
      payment_methods: [
        { id: 'pm-cash-1', name: 'Efectivo', is_active: true },
      ],
      ingredients: [
        { id: 'ing-carne', name: 'Carne Hamburguesa', current_stock: 10, cost_per_unit: 5.0 },
        { id: 'ing-pan', name: 'Pan', current_stock: 20, cost_per_unit: 0.5 },
      ],
      recipes: [
        { id: 'rec-burger', name: 'Hamburguesa Clásica', price: 10.0, type: 'final_product' },
      ],
      recipe_ingredients: [
        { recipe_id: 'rec-burger', ingredient_id: 'ing-carne', quantity: 1 },
        { recipe_id: 'rec-burger', ingredient_id: 'ing-pan', quantity: 1 },
      ],
      orders: [],
      order_items: [],
      order_payments: [],
      inventory_movements: [],
    })
  })

  it('debe procesar la orden, registrar items, guardar pago y descontar stock con movimiento de trazabilidad', async () => {
    const result = await processOrderAction({
      type: 'dine_in',
      customer_name: 'Mesa 4 - Carlos',
      items: [
        {
          recipe_id: 'rec-burger',
          name: 'Hamburguesa Clásica',
          quantity: 2,
          unit_price: 10.0,
        },
      ],
      subtotal: 20.0,
      total: 20.0,
      payment_method_id: 'pm-cash-1',
      payment_method_name: 'Efectivo',
    })

    expect(result.success).toBe(true)
    expect(result.orderId).toBeDefined()

    // 1. Verificar orden creada
    const orders = mockSupabase._dataStore['orders']
    expect(orders).toHaveLength(1)
    expect(orders[0].total).toBe(20.0)
    expect(orders[0].customer_name).toBe('Mesa 4 - Carlos')
    expect(orders[0].status).toBe('completed')

    // 2. Verificar order_items
    const orderItems = mockSupabase._dataStore['order_items']
    expect(orderItems).toHaveLength(1)
    expect(orderItems[0].recipe_id).toBe('rec-burger')
    expect(orderItems[0].quantity).toBe(2)
    expect(orderItems[0].subtotal).toBe(20.0)

    // 3. Verificar order_payments
    const payments = mockSupabase._dataStore['order_payments']
    expect(payments).toHaveLength(1)
    expect(payments[0].amount).toBe(20.0)
    expect(payments[0].payment_method_id).toBe('pm-cash-1')

    // 4. Verificar descuento de inventario
    // Carne: 10 - (1 * 2) = 8
    const carne = mockSupabase._dataStore['ingredients'].find((i) => i.id === 'ing-carne')
    expect(carne?.current_stock).toBe(8)

    // Pan: 20 - (1 * 2) = 18
    const pan = mockSupabase._dataStore['ingredients'].find((i) => i.id === 'ing-pan')
    expect(pan?.current_stock).toBe(18)

    // 5. Verificar movimientos de inventario registrados para auditoría
    const movements = mockSupabase._dataStore['inventory_movements']
    expect(movements).toHaveLength(2)
    expect(movements[0].type).toBe('sale_deduction')
    expect(movements[0].quantity).toBe(-2)
  })

  it('debe arrojar error si se intenta procesar una orden vacía sin items', async () => {
    await expect(
      processOrderAction({
        type: 'takeaway',
        items: [],
        subtotal: 0,
        total: 0,
        payment_method_name: 'Efectivo',
      })
    ).rejects.toThrow('La orden no tiene productos.')
  })
})
