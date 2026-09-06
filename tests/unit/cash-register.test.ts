import { describe, it, expect } from 'vitest'
import {
  calculateCashRegisterBalance,
  calculateCashArqueo,
  validateCashExpense,
  CashPayment,
  CashExpenseItem,
} from '@/lib/domain/cash-register'

describe('Domain: Cálculo del Arqueo de Caja y Egresos Justificados con Nota', () => {
  describe('Validación de Egresos de Caja (Salidas de dinero)', () => {
    it('debe validar exitosamente un egreso con monto positivo y nota de justificación clara', () => {
      const result = validateCashExpense({
        amount: 25.5,
        category: 'Insumos de Emergencia',
        notes: 'Compra de 2 kg de limones por falta de stock en turno',
        recipient: 'Verdulería Don Pepe',
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('debe rechazar un egreso con monto cero o negativo', () => {
      const result = validateCashExpense({
        amount: 0,
        category: 'Varios',
        notes: 'Retiro no válido',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('El monto del egreso debe ser un número positivo mayor a 0.')
    })

    it('debe rechazar un egreso sin nota de justificación (regla crítica anti-fraude)', () => {
      const result = validateCashExpense({
        amount: 50,
        category: 'Gastos Menores',
        notes: '   ',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La nota de justificación es obligatoria para registrar cualquier egreso de caja.')
    })

    it('debe rechazar un egreso con nota de justificación demasiado corta (< 3 caracteres)', () => {
      const result = validateCashExpense({
        amount: 15,
        category: 'Otros',
        notes: 'ok',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La nota de justificación debe contener al menos 3 caracteres describiendo el concepto del gasto.')
    })
  })

  describe('Cálculo del Balance y Saldo Esperado en Efectivo', () => {
    const initialCash = 50.0 // Fondo inicial de caja

    const payments: CashPayment[] = [
      { amount: 35.0, payment_method_name: 'Efectivo USD', is_cash: true },
      { amount: 45.0, payment_method_name: 'Efectivo USD', is_cash: true },
      { amount: 60.0, payment_method_name: 'Tarjeta Débito POS', is_cash: false },
      { amount: 20.0, payment_method_name: 'Zelle Transfer', is_cash: false },
    ]

    const expenses: CashExpenseItem[] = [
      {
        amount: 15.0,
        category: 'Insumos Urgentes',
        notes: 'Compra de hielo de emergencia para bebidas',
        recipient: 'Distribuidora Polar',
      },
      {
        amount: 10.0,
        category: 'Transporte',
        notes: 'Taxi para delivery urgente',
        recipient: 'Chofer Juan',
      },
    ]

    it('debe calcular: Saldo Esperado = Fondo Inicial ($50) + Ventas Efectivo ($80) - Egresos con Nota ($25) = $105.00', () => {
      const summary = calculateCashRegisterBalance({
        initialCash,
        payments,
        expenses,
        filterCashOnly: true,
      })

      expect(summary.initialCash).toBe(50.0)
      expect(summary.totalIncomeCash).toBe(80.0) // 35 + 45
      expect(summary.totalIncomeNonCash).toBe(80.0) // 60 + 20
      expect(summary.totalIncomeAll).toBe(160.0)
      expect(summary.totalExpenses).toBe(25.0) // 15 + 10

      // Efectivo esperado en cajón = 50 + 80 - 25 = $105.00
      expect(summary.expectedCashInDrawer).toBe(105.0)
      expect(summary.totalNetFlow).toBe(135.0) // 160 - 25
    })
  })

  describe('Arqueo de Turno y Conciliación de Diferencias Físicas', () => {
    const expected = 105.0

    it('debe registrar estado cuadrado (balanced) cuando el conteo físico coincide exactamente', () => {
      const arqueo = calculateCashArqueo(expected, 105.0)
      expect(arqueo.status).toBe('balanced')
      expect(arqueo.difference).toBe(0)
      expect(arqueo.message).toContain('Caja cuadrada sin diferencias')
    })

    it('debe detectar un faltante de caja (deficit)', () => {
      const arqueo = calculateCashArqueo(expected, 95.0)
      expect(arqueo.status).toBe('deficit')
      expect(arqueo.difference).toBe(-10.0)
      expect(arqueo.message).toContain('Faltante de caja por $10.00')
    })

    it('debe detectar un sobrante de caja (surplus)', () => {
      const arqueo = calculateCashArqueo(expected, 112.5)
      expect(arqueo.status).toBe('surplus')
      expect(arqueo.difference).toBe(7.5)
      expect(arqueo.message).toContain('Sobrante de caja por $7.50')
    })
  })
})
