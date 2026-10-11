import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { createBillAction, payBillAction, createExpenseAction, createSupplierAction, deleteSupplierAction } from '@/app/finances/actions'

describe('Integration: Acciones Financieras, Gastos Opex y Cuentas por Pagar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient({
      bills_payable: [
        {
          id: 'bill-1',
          supplier_id: 'sup-1',
          invoice_number: 'FAC-1001',
          amount: 250.0,
          due_date: '2026-09-30',
          status: 'pending',
          notes: 'Compra de quesos',
        },
      ],
      suppliers: [
        { id: 'sup-1', name: 'Distribuidora Lácteos', credit_days: 15 },
        { id: 'sup-2', name: 'Panadería San Pedro', credit_days: 7 },
      ],
      ingredients: [
        { id: 'ing-1', name: 'Pan Brioche', supplier_id: 'sup-2' },
      ],
      expenses: [],
    })
  })

  it('debe crear un gasto operativo con monto y categoría', async () => {
    const formData = new FormData()
    formData.append('category', 'Servicios Básicos')
    formData.append('type', 'fixed')
    formData.append('amount', '120.00')
    formData.append('description', 'Pago mensual de luz')

    const result = await createExpenseAction(formData)
    expect(result.success).toBe(true)

    const expenses = mockSupabase._dataStore['expenses']
    expect(expenses).toHaveLength(1)
    expect(expenses[0].amount).toBe(120.0)
    expect(expenses[0].type).toBe('fixed')
  })

  it('debe marcar una factura como pagada y registrarla opcionalmente en expenses', async () => {
    const formData = new FormData()
    formData.append('bill_id', 'bill-1')
    formData.append('payment_notes', 'Transferencia bancaria #998811')
    formData.append('register_as_expense', 'true')

    const result = await payBillAction(formData)
    expect(result.success).toBe(true)

    // 1. Factura actualizada
    const bill = mockSupabase._dataStore['bills_payable'].find((b) => b.id === 'bill-1')
    expect(bill?.status).toBe('paid')
    expect(bill?.paid_at).toBeDefined()
    expect(bill?.notes).toContain('Transferencia bancaria #998811')

    // 2. Registrado en expenses
    const expenses = mockSupabase._dataStore['expenses']
    expect(expenses).toHaveLength(1)
    expect(expenses[0].amount).toBe(250.0)
    expect(expenses[0].category).toBe('Pago a Proveedores')
  })

  it('debe registrar una nueva factura de proveedor por pagar', async () => {
    const formData = new FormData()
    formData.append('supplier_id', 'sup-1')
    formData.append('invoice_number', 'INV-5544')
    formData.append('amount', '450.00')
    formData.append('due_date', '2026-10-15')
    formData.append('notes', 'Compra de harina y levadura a crédito')

    const result = await createBillAction(formData)
    expect(result.success).toBe(true)

    const bills = mockSupabase._dataStore['bills_payable']
    expect(bills).toHaveLength(2)
    const newBill = bills.find((b) => b.invoice_number === 'INV-5544')
    expect(newBill?.amount).toBe(450.0)
    expect(newBill?.status).toBe('pending')
  })

  it('debe crear un nuevo proveedor exitosamente con sus datos fiscales y comerciales', async () => {
    const formData = new FormData()
    formData.append('name', 'Carnes Premium La Hacienda')
    formData.append('tax_id', 'J-30495821-4')
    formData.append('contact_name', 'Carlos Mendoza')
    formData.append('phone', '+58 414-555-1234')
    formData.append('email', 'ventas@carneslahacienda.com')
    formData.append('credit_days', '21')
    formData.append('notes', 'Entregas semanales')

    const result = await createSupplierAction(formData)
    expect(result.success).toBe(true)

    const suppliers = mockSupabase._dataStore['suppliers']
    expect(suppliers).toHaveLength(3)
    const created = suppliers.find((s) => s.name === 'Carnes Premium La Hacienda')
    expect(created).toBeDefined()
    expect(created?.tax_id).toBe('J-30495821-4')
    expect(created?.credit_days).toBe(21)
  })

  it('debe impedir eliminar un proveedor si tiene facturas pendientes asociadas', async () => {
    await expect(deleteSupplierAction('sup-1')).rejects.toThrow(
      /No se puede eliminar a "Distribuidora Lácteos" porque tiene 1 factura\(s\)/
    )
    const suppliers = mockSupabase._dataStore['suppliers']
    expect(suppliers.find((s) => s.id === 'sup-1')).toBeDefined()
  })

  it('debe permitir eliminar un proveedor sin facturas y desvincular sus insumos', async () => {
    const result = await deleteSupplierAction('sup-2')
    expect(result.success).toBe(true)

    const suppliers = mockSupabase._dataStore['suppliers']
    expect(suppliers.find((s) => s.id === 'sup-2')).toBeUndefined()

    // Insumo desvinculado (supplier_id = null)
    const ingredient = mockSupabase._dataStore['ingredients'].find((i) => i.id === 'ing-1')
    expect(ingredient?.supplier_id).toBeNull()
  })
})

