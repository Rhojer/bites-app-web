import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '../mocks/supabase'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let mockSupabase: ReturnType<typeof createMockSupabaseClient>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

import { createCashExpenseAction } from '@/app/cash-register/actions'

describe('Integration: Registro de Egresos de Caja con Nota de Justificación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient({
      cash_expenses: [],
      expenses: [],
    })
  })

  it('debe registrar el egreso tanto en cash_expenses como en la tabla general de expenses', async () => {
    const formData = new FormData()
    formData.append('amount', '35.50')
    formData.append('category', 'Compras Urgentes')
    formData.append('recipient', 'Proveedor Frutas')
    formData.append('notes', 'Compra de 5 kg de naranjas para jugo del turno')

    const result = await createCashExpenseAction(formData)
    expect(result.success).toBe(true)

    // 1. Verificar cash_expenses
    const cashExpenses = mockSupabase._dataStore['cash_expenses']
    expect(cashExpenses).toHaveLength(1)
    expect(cashExpenses[0].amount).toBe(35.50)
    expect(cashExpenses[0].category).toBe('Compras Urgentes')
    expect(cashExpenses[0].recipient).toBe('Proveedor Frutas')
    expect(cashExpenses[0].notes).toBe('Compra de 5 kg de naranjas para jugo del turno')

    // 2. Verificar expenses general (para balance P&L)
    const generalExpenses = mockSupabase._dataStore['expenses']
    expect(generalExpenses).toHaveLength(1)
    expect(generalExpenses[0].amount).toBe(35.50)
    expect(generalExpenses[0].type).toBe('variable')
    expect(generalExpenses[0].description).toContain('Egreso de Caja: Compra de 5 kg de naranjas')
  })

  it('debe fallar si el monto es menor o igual a cero', async () => {
    const formData = new FormData()
    formData.append('amount', '0')
    formData.append('category', 'Otros')
    formData.append('notes', 'Sin monto')

    await expect(createCashExpenseAction(formData)).rejects.toThrow(
      'El monto debe ser mayor a cero y la nota de justificación es obligatoria.'
    )
  })

  it('debe fallar si falta la nota de justificación', async () => {
    const formData = new FormData()
    formData.append('amount', '50.00')
    formData.append('category', 'Otros')
    formData.append('notes', '')

    await expect(createCashExpenseAction(formData)).rejects.toThrow(
      'El monto debe ser mayor a cero y la nota de justificación es obligatoria.'
    )
  })
})
