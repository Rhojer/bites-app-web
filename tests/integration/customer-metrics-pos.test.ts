import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { processOrderAction, payActiveOrderAction } from '@/app/pos/actions'
import { syncAllCustomerMetricsAction } from '@/app/crm/actions'

describe('Métricas de Cliente: Sincronización de Total Gastado, Visitas y Deuda en POS y CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabaseClient({
      payment_methods: [
        { id: 'pm-cash', name: 'Efectivo USD', is_active: true },
        { id: 'pm-credit', name: 'Crédito', is_active: true },
      ],
      ingredients: [],
      recipe_ingredients: [],
      recipes: [
        { id: 'rec-1', name: 'Burger', price: 10.0, type: 'final_product' },
      ],
      profiles: [
        {
          id: 'cust-1111-1111-1111-111111111111',
          full_name: 'Juan Perez',
          role: 'customer',
          current_debt: 0,
          total_spent: 0,
          total_orders_count: 0,
        },
        {
          id: 'cust-2222-2222-2222-222222222222',
          full_name: 'Maria Gomez',
          role: 'customer',
          current_debt: 50.0, // Deuda inicial sin órdenes previas
          total_spent: 0,
          total_orders_count: 0,
        },
      ],
      orders: [],
      order_items: [],
      order_payments: [],
      inventory_movements: [],
    })
  })

  it('debe actualizar total_spent y total_orders_count sin alterar deuda cuando la venta es de contado', async () => {
    const result = await processOrderAction({
      type: 'takeout',
      customer_id: 'cust-1111-1111-1111-111111111111',
      customer_name: 'Juan Perez',
      payment_method_name: 'Efectivo USD',
      payment_method_id: 'pm-cash',
      is_paid: true,
      is_credit: false,
      items: [
        { recipe_id: 'rec-1', name: 'Burger', quantity: 2, unit_price: 10.0 },
      ],
      subtotal: 20.0,
      total: 20.0,
    })

    expect(result.success).toBe(true)

    const customer = mockSupabase._dataStore['profiles'].find(
      (p) => p.id === 'cust-1111-1111-1111-111111111111'
    )
    expect(customer?.total_spent).toBe(20.0)
    expect(customer?.total_orders_count).toBe(1)
    expect(customer?.current_debt).toBe(0)
  })

  it('debe incrementar deuda, total_spent y total_orders_count cuando la venta es a crédito', async () => {
    const result = await processOrderAction({
      type: 'takeout',
      customer_id: 'cust-1111-1111-1111-111111111111',
      customer_name: 'Juan Perez',
      payment_method_name: 'Crédito',
      payment_method_id: 'pm-credit',
      is_credit: true,
      items: [
        { recipe_id: 'rec-1', name: 'Burger', quantity: 3, unit_price: 10.0 },
      ],
      subtotal: 30.0,
      total: 30.0,
    })

    expect(result.success).toBe(true)

    const customer = mockSupabase._dataStore['profiles'].find(
      (p) => p.id === 'cust-1111-1111-1111-111111111111'
    )
    expect(customer?.total_spent).toBe(30.0)
    expect(customer?.total_orders_count).toBe(1)
    expect(customer?.current_debt).toBe(30.0)
  })

  it('debe actualizar métricas al cobrar una orden activa pendiente con payActiveOrderAction', async () => {
    // Simulamos una orden activa previamente guardada
    mockSupabase._dataStore['orders'].push({
      id: 'ord-active-1',
      status: 'active',
      payment_status: 'pending',
      total: 25.0,
    })

    const result = await payActiveOrderAction({
      orderId: 'ord-active-1',
      customerId: 'cust-1111-1111-1111-111111111111',
      paymentMethodName: 'Efectivo USD',
      total: 25.0,
      referenceNumber: 'REF-123456',
    })

    expect(result.success).toBe(true)

    const customer = mockSupabase._dataStore['profiles'].find(
      (p) => p.id === 'cust-1111-1111-1111-111111111111'
    )
    expect(customer?.total_spent).toBe(25.0)
    expect(customer?.total_orders_count).toBe(1)
    expect(customer?.current_debt).toBe(0)
  })

  it('syncAllCustomerMetricsAction debe recalcular total_spent desde órdenes y reconciliar deuda huérfana', async () => {
    // Órdenes históricas para Juan Perez
    mockSupabase._dataStore['orders'].push(
      {
        id: 'ord-10',
        user_id: 'cust-1111-1111-1111-111111111111',
        total: 40.0,
        status: 'completed',
        payment_status: 'paid',
      },
      {
        id: 'ord-11',
        customer_id: 'cust-1111-1111-1111-111111111111',
        total: 15.0,
        status: 'completed',
        payment_status: 'paid',
      }
    )

    // Ejecutar sincronización
    const res = await syncAllCustomerMetricsAction()
    expect(res.success).toBe(true)
    expect(res.updatedCount).toBe(2)

    // Juan Perez: 40 + 15 = 55 total gastado, 2 órdenes
    const juan = mockSupabase._dataStore['profiles'].find(
      (p) => p.id === 'cust-1111-1111-1111-111111111111'
    )
    expect(juan?.total_spent).toBe(55.0)
    expect(juan?.total_orders_count).toBe(2)

    // Maria Gomez: no tiene órdenes pero tiene 50.0 de deuda -> total_spent reconciliado a 50.0
    const maria = mockSupabase._dataStore['profiles'].find(
      (p) => p.id === 'cust-2222-2222-2222-222222222222'
    )
    expect(maria?.total_spent).toBe(50.0)
    expect(maria?.total_orders_count).toBe(1)
  })
})
