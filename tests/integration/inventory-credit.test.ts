import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { createIngredientAction, registerMovementAction } from '@/app/inventory/actions'

describe('Integration: Carga de Insumos y Compras a Crédito con Proveedores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient({
      ingredients: [
        {
          id: 'ing-1',
          name: 'Queso Cheddar',
          current_stock: 10,
          cost_per_unit: 5.0,
          unit: 'kg',
          supplier_id: null,
        },
      ],
      suppliers: [
        { id: 'sup-1', name: 'Distribuidora Lácteos Los Andes', credit_days: 15 },
      ],
      bills_payable: [],
      inventory_movements: [],
    })
  })

  it('debe registrar un insumo nuevo con compra inicial a crédito y generar factura en bills_payable', async () => {
    const formData = new FormData()
    formData.append('name', 'Pechuga de Pollo')
    formData.append('category', 'Carnes & Aves')
    formData.append('unit', 'kg')
    formData.append('current_stock', '20')
    formData.append('cost_per_unit', '4.5')
    formData.append('min_stock', '5')
    formData.append('is_credit', 'true')
    formData.append('supplier_id', 'sup-1')
    formData.append('invoice_number', 'FAC-POLLO-001')
    formData.append('due_date', '2026-10-30')

    const result = await createIngredientAction(formData)
    expect(result.success).toBe(true)

    // 1. Insumo registrado con supplier_id
    const ingredients = mockSupabase._dataStore['ingredients']
    const pollo = ingredients.find((i) => i.name === 'Pechuga de Pollo')
    expect(pollo).toBeDefined()
    expect(pollo?.supplier_id).toBe('sup-1')
    expect(pollo?.current_stock).toBe(20)

    // 2. Factura por pagar generada automáticamente (20 kg * 4.5 = 90.0 USD)
    const bills = mockSupabase._dataStore['bills_payable']
    expect(bills).toHaveLength(1)
    expect(bills[0].supplier_id).toBe('sup-1')
    expect(bills[0].invoice_number).toBe('FAC-POLLO-001')
    expect(bills[0].amount).toBe(90.0)
    expect(bills[0].due_date).toBe('2026-10-30')
    expect(bills[0].status).toBe('pending')
  })

  it('debe registrar una nueva carga/compra a crédito de un insumo existente y generar cuenta por pagar', async () => {
    const formData = new FormData()
    formData.append('ingredient_id', 'ing-1')
    formData.append('type', 'purchase')
    formData.append('quantity', '15')
    formData.append('purchase_unit_cost', '5.5')
    formData.append('purchase_total_cost', '82.50')
    formData.append('reason', 'Reposición semanal')
    formData.append('is_credit', 'true')
    formData.append('supplier_id', 'sup-1')
    formData.append('invoice_number', 'FAC-QUESO-99')
    formData.append('due_date', '2026-11-05')

    const result = await registerMovementAction(formData)
    expect(result.success).toBe(true)

    // 1. Stock actualizado (10 + 15 = 25)
    const ingredient = mockSupabase._dataStore['ingredients'].find((i) => i.id === 'ing-1')
    expect(ingredient?.current_stock).toBe(25)
    expect(ingredient?.supplier_id).toBe('sup-1')

    // 2. Cuenta por pagar registrada por $82.50
    const bills = mockSupabase._dataStore['bills_payable']
    expect(bills).toHaveLength(1)
    expect(bills[0].supplier_id).toBe('sup-1')
    expect(bills[0].amount).toBe(82.5)
    expect(bills[0].invoice_number).toBe('FAC-QUESO-99')
    expect(bills[0].due_date).toBe('2026-11-05')
    expect(bills[0].status).toBe('pending')

    // 3. Movimiento de inventario
    const movements = mockSupabase._dataStore['inventory_movements']
    expect(movements).toHaveLength(1)
    expect(movements[0].type).toBe('purchase')
    expect(movements[0].quantity).toBe(15)
  })
})
