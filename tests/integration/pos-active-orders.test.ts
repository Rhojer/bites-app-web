import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { processOrderAction, updateOrderStatusAction, payActiveOrderAction, cancelOrderAction } from '@/app/pos/actions'

describe('Integration: Flujo de Pedidos Activos y Cobro Posterior', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabaseClient({
      payment_methods: [
        { id: 'pm-cash', name: 'Efectivo USD', is_active: true },
        { id: 'pm-zelle', name: 'Zelle', is_active: true },
      ],
      ingredients: [
        { id: 'ing-1', name: 'Pan Brioche', current_stock: 50, cost_per_unit: 0.6 },
        { id: 'ing-2', name: 'Carne Angus', current_stock: 100, cost_per_unit: 2.0 },
      ],
      recipes: [
        { id: 'rec-1', name: 'Hamburguesa Doble Angus', price: 14.0, type: 'final_product' },
      ],
      recipe_ingredients: [
        { recipe_id: 'rec-1', ingredient_id: 'ing-1', quantity: 1 },
        { recipe_id: 'rec-1', ingredient_id: 'ing-2', quantity: 2 },
      ],
      orders: [],
      order_items: [],
      order_payments: [],
      inventory_movements: [],
    })
  })

  it('debe crear una comanda activa en estado pending (por cobrar), guardando items y descontando stock', async () => {
    const res = await processOrderAction({
      type: 'dine_in',
      customer_name: 'Mesa 2 - Juan',
      is_paid: false,
      items: [
        {
          recipe_id: 'rec-1',
          name: 'Hamburguesa Doble Angus',
          quantity: 2,
          unit_price: 14.0,
          notes: 'Sin cebolla',
        },
      ],
      subtotal: 28.0,
      total: 28.0,
      payment_method_name: 'Pendiente',
    })

    expect(res.success).toBe(true)
    expect(res.orderId).toBeDefined()

    const orders = mockSupabase._dataStore['orders']
    expect(orders).toHaveLength(1)
    expect(orders[0].payment_status).toBe('pending')
    expect(orders[0].status).toBe('active')
    expect(orders[0].total).toBe(28.0)

    // No debe haber registrado pago aún
    expect(mockSupabase._dataStore['order_payments']).toHaveLength(0)

    // Stock debe descontarse: Pan 50 - (1*2) = 48, Carne 100 - (2*2) = 96
    const pan = mockSupabase._dataStore['ingredients'].find((i) => i.id === 'ing-1')
    expect(pan?.current_stock).toBe(48)
    const carne = mockSupabase._dataStore['ingredients'].find((i) => i.id === 'ing-2')
    expect(carne?.current_stock).toBe(96)
  })

  it('debe permitir cobrar posteriormente la orden activa', async () => {
    // 1. Crear orden
    const res = await processOrderAction({
      type: 'takeaway',
      customer_name: 'Cliente Mostrador',
      is_paid: false,
      items: [{ recipe_id: 'rec-1', name: 'Hamburguesa', quantity: 1, unit_price: 14.0 }],
      subtotal: 14.0,
      total: 14.0,
      payment_method_name: 'Pendiente',
    })

    // 2. Cobrar orden
    const payRes = await payActiveOrderAction({
      orderId: res.orderId,
      paymentMethodName: 'Zelle',
      paymentMethodId: 'pm-zelle',
      total: 14.0,
    })

    expect(payRes.success).toBe(true)

    // Verificar que se registró el pago y se completó
    const payments = mockSupabase._dataStore['order_payments']
    expect(payments).toHaveLength(1)
    expect(payments[0].payment_method_id).toBe('pm-zelle')
    expect(payments[0].amount).toBe(14.0)

    const order = mockSupabase._dataStore['orders'].find((o) => o.id === res.orderId)
    expect(order?.payment_status).toBe('paid')
    expect(order?.status).toBe('completed')
  })

  it('debe permitir actualizar el estado operativo de la comanda (ej: a listo)', async () => {
    const res = await processOrderAction({
      type: 'delivery',
      customer_name: 'Delivery Pedro',
      is_paid: true,
      items: [{ recipe_id: 'rec-1', name: 'Hamburguesa', quantity: 1, unit_price: 14.0 }],
      subtotal: 14.0,
      total: 14.0,
      payment_method_name: 'Efectivo USD',
    })

    await updateOrderStatusAction(res.orderId, {
      kitchen_status: 'ready',
    })

    const order = mockSupabase._dataStore['orders'].find((o) => o.id === res.orderId)
    expect(order?.kitchen_status).toBe('ready')
  })
})
