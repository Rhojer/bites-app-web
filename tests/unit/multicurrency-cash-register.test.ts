import { describe, it, expect } from 'vitest'
import {
  calculateMultiVaultBalances,
  mapPaymentToVault,
  CashPayment,
  CashExpenseItem,
  CurrencyExchangeRecord
} from '@/lib/domain/cash-register'

describe('💵 PILLAR 3: Static Multi-Currency Treasury & Manual Currency Exchange', () => {
  it('mapea métodos de pago a sus bóvedas correspondientes', () => {
    expect(mapPaymentToVault({ amount: 10, payment_method_name: 'Efectivo USD' })).toBe('cash_usd')
    expect(mapPaymentToVault({ amount: 500, payment_method_name: 'Efectivo Bs' })).toBe('cash_ves')
    expect(mapPaymentToVault({ amount: 1200, payment_method_name: 'Pago Móvil Banesco' })).toBe('bank_ves')
    expect(mapPaymentToVault({ amount: 45, payment_method_name: 'Zelle' })).toBe('bank_usd')
  })

  it('calcula balances inmutables en las 4 bóvedas sin fluctuación de saldos en Bs', () => {
    const mockPayments: CashPayment[] = [
      { amount: 50, amount_currency: 50, currency: 'USD', vault: 'cash_usd' },
      { amount: 10, amount_currency: 8422, currency: 'VES', exchange_rate: 842.2, vault: 'cash_ves' },
      { amount: 20, amount_currency: 16844, currency: 'VES', exchange_rate: 842.2, vault: 'bank_ves' },
      { amount: 30, amount_currency: 30, currency: 'USD', vault: 'bank_usd' },
    ]

    const mockExpenses: CashExpenseItem[] = [
      { amount: 15, category: 'Insumos', notes: 'Compra verduras', vault: 'cash_usd' },
      { amount: 1000, category: 'Transporte', notes: 'Taxi', vault: 'cash_ves' },
    ]

    const balances = calculateMultiVaultBalances({
      initialBalances: { cash_usd: 100, cash_ves: 0, bank_ves: 0, bank_usd: 0 },
      payments: mockPayments,
      expenses: mockExpenses,
      currentBcvRate: 842.20,
    })

    // Gaveta USD: 100 (inicio) + 50 (ventas) - 15 (egreso) = $135
    expect(balances.cash_usd.nominal).toBe(135)

    // Gaveta Bs: 8422 (ventas) - 1000 (egreso) = 7422 Bs. (inmutable en bolívares)
    expect(balances.cash_ves.nominal).toBe(7422)

    // Banco Bs: 16844 Bs.
    expect(balances.bank_ves.nominal).toBe(16844)

    // Banco USD: $30
    expect(balances.bank_usd.nominal).toBe(30)
  })

  it('procesa correctamente canjes manuales de divisas entre bóvedas', () => {
    // Escenario: El gerente retira $50 de la Gaveta Efectivo USD y los canjea depositando Bs. 42,500 en Banco Bolívares (Tasa negociada 850 Bs/$)
    const mockExchanges: CurrencyExchangeRecord[] = [
      {
        from_vault: 'cash_usd',
        to_vault: 'bank_ves',
        from_amount: 50,
        from_currency: 'USD',
        to_amount: 42500,
        to_currency: 'VES',
        exchange_rate: 850,
        notes: 'Canje de efectivo para pago nómina vía Pago Móvil',
      }
    ]

    const balances = calculateMultiVaultBalances({
      initialBalances: { cash_usd: 100, cash_ves: 0, bank_ves: 0, bank_usd: 0 },
      payments: [],
      expenses: [],
      exchanges: mockExchanges,
      currentBcvRate: 842.20,
    })

    // Gaveta USD: 100 - 50 = $50
    expect(balances.cash_usd.nominal).toBe(50)

    // Banco Bs: 0 + 42500 = Bs. 42,500
    expect(balances.bank_ves.nominal).toBe(42500)
  })
})
