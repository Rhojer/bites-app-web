import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { createBillAction, payBillAction, createExpenseAction } from '@/app/finances/actions'

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
        { id: 'sup-1', name: 'Distribuidora Lácteos' },
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
})
