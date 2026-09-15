export type VaultType = 'cash_usd' | 'cash_ves' | 'bank_ves' | 'bank_usd'

export interface CashPayment {
  amount: number
  amount_currency?: number | null
  currency?: string | null // 'USD' | 'VES'
  exchange_rate?: number | null
  vault?: VaultType | null
  payment_method_id?: string
  payment_method_name?: string
  is_cash?: boolean
  created_at?: string
}

export interface CashExpenseItem {
  id?: string
  amount: number
  category: string
  notes?: string | null
  recipient?: string | null
  currency?: string | null
  vault?: VaultType | null
  exchange_rate?: number | null
  created_at?: string
}

export interface CurrencyExchangeRecord {
  id?: string
  from_vault: VaultType
  to_vault: VaultType
  from_amount: number
  from_currency: 'USD' | 'VES'
  to_amount: number
  to_currency: 'USD' | 'VES'
  exchange_rate: number
  notes?: string | null
  created_at?: string
}

export interface CashRegisterSummary {
  initialCash: number
  totalIncomeCash: number
  totalIncomeNonCash: number
  totalIncomeAll: number
  totalExpenses: number
  expectedCashInDrawer: number
  totalNetFlow: number
}

export interface CashArqueoResult {
  expectedCash: number
  countedCash: number
  difference: number
  status: 'balanced' | 'surplus' | 'deficit'
  message: string
}

export interface MultiVaultBalances {
  cash_usd: { nominal: number; currency: 'USD'; label: string }
  cash_ves: { nominal: number; currency: 'VES'; label: string }
  bank_ves: { nominal: number; currency: 'VES'; label: string }
  bank_usd: { nominal: number; currency: 'USD'; label: string }
  totalEquivalentUSD: number
}

/**
 * Valida un egreso de caja según las reglas de negocio:
 * - Monto > 0
 * - Nota de justificación detallada obligatoria (explicando en qué se difirió el dinero)
 * - Categoría especificada
 */
export function validateCashExpense(data: {
  amount: number
  category?: string
  notes: string
  recipient?: string | null
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof data.amount !== 'number' || isNaN(data.amount) || data.amount <= 0) {
    errors.push('El monto del egreso debe ser un número positivo mayor a 0.')
  }

  if (!data.notes || data.notes.trim().length === 0) {
    errors.push('La nota de justificación es obligatoria para registrar cualquier egreso de caja.')
  } else if (data.notes.trim().length < 3) {
    errors.push('La nota de justificación debe contener al menos 3 caracteres describiendo el concepto del gasto.')
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push('La categoría del egreso es obligatoria.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Mapea un método de pago a su bóveda correspondiente si no viene explícita.
 */
export function mapPaymentToVault(payment: CashPayment): VaultType {
  if (payment.vault) return payment.vault

  const name = (payment.payment_method_name || '').toLowerCase()
  if (name.includes('zelle') || name.includes('dólares') || name.includes('usd') && !name.includes('efectivo')) {
    return 'bank_usd'
  }
  if (name.includes('pago móvil') || name.includes('punto') || name.includes('tarjeta') || name.includes('transferencia')) {
    return 'bank_ves'
  }
  if (name.includes('efectivo bs') || name.includes('bolívares') || name.includes('bolivares') || payment.currency === 'VES') {
    return 'cash_ves'
  }
  return 'cash_usd'
}

/**
 * Calcula los saldos estáticos e inmutables de las 4 bóvedas del negocio:
 * 1. cash_usd: Gaveta Efectivo USD ($)
 * 2. cash_ves: Gaveta Efectivo Bs (Bs.)
 * 3. bank_ves: Banco Bolívares (Pago Móvil / Punto de Venta)
 * 4. bank_usd: Banco Dólares (Zelle / Divisas)
 *
 * Incluye ingresos por ventas, egresos clasificados por bóveda y canjes/transferencias manuales de divisas.
 * Garantiza que los fondos en Bolívares no fluctúan retrospectivamente cuando la tasa BCV cambia.
 */
export function calculateMultiVaultBalances(params: {
  initialBalances?: Partial<Record<VaultType, number>>
  payments: CashPayment[]
  expenses: CashExpenseItem[]
  exchanges?: CurrencyExchangeRecord[]
  currentBcvRate?: number
}): MultiVaultBalances {
  const initial = {
    cash_usd: params.initialBalances?.cash_usd || 0,
    cash_ves: params.initialBalances?.cash_ves || 0,
    bank_ves: params.initialBalances?.bank_ves || 0,
    bank_usd: params.initialBalances?.bank_usd || 0,
  }

  let balCashUSD = initial.cash_usd
  let balCashVES = initial.cash_ves
  let balBankVES = initial.bank_ves
  let balBankUSD = initial.bank_usd

  // 1. Sumar ingresos por cobros de órdenes en sus monedas nominales
  for (const p of params.payments) {
    const vault = mapPaymentToVault(p)
    const nominalAmount = p.amount_currency ?? p.amount

    switch (vault) {
      case 'cash_usd':
        balCashUSD += p.currency === 'VES' && p.exchange_rate ? nominalAmount / p.exchange_rate : nominalAmount
        break
      case 'cash_ves':
        balCashVES += p.currency === 'USD' && p.exchange_rate ? nominalAmount * p.exchange_rate : nominalAmount
        break
      case 'bank_ves':
        balBankVES += p.currency === 'USD' && p.exchange_rate ? nominalAmount * p.exchange_rate : nominalAmount
        break
      case 'bank_usd':
        balBankUSD += p.currency === 'VES' && p.exchange_rate ? nominalAmount / p.exchange_rate : nominalAmount
        break
    }
  }

  // 2. Restar egresos justificados por bóveda
  for (const exp of params.expenses) {
    const vault = exp.vault || 'cash_usd'
    const amount = exp.amount || 0

    switch (vault) {
      case 'cash_usd':
        balCashUSD -= amount
        break
      case 'cash_ves':
        balCashVES -= amount
        break
      case 'bank_ves':
        balBankVES -= amount
        break
      case 'bank_usd':
        balBankUSD -= amount
        break
    }
  }

  // 3. Procesar canjes/transferencias manuales de divisas entre bóvedas
  if (params.exchanges) {
    for (const ex of params.exchanges) {
      // Débito en la bóveda de origen
      switch (ex.from_vault) {
        case 'cash_usd':
          balCashUSD -= ex.from_amount
          break
        case 'cash_ves':
          balCashVES -= ex.from_amount
          break
        case 'bank_ves':
          balBankVES -= ex.from_amount
          break
        case 'bank_usd':
          balBankUSD -= ex.from_amount
          break
      }

      // Crédito en la bóveda de destino
      switch (ex.to_vault) {
        case 'cash_usd':
          balCashUSD += ex.to_amount
          break
        case 'cash_ves':
          balCashVES += ex.to_amount
          break
        case 'bank_ves':
          balBankVES += ex.to_amount
          break
        case 'bank_usd':
          balBankUSD += ex.to_amount
          break
      }
    }
  }

  const rate = params.currentBcvRate && params.currentBcvRate > 0 ? params.currentBcvRate : 1
  const totalEquivalentUSD =
    balCashUSD +
    balBankUSD +
    (balCashVES + balBankVES) / rate

  return {
    cash_usd: { nominal: Number(balCashUSD.toFixed(2)), currency: 'USD', label: 'Gaveta Efectivo USD' },
    cash_ves: { nominal: Number(balCashVES.toFixed(2)), currency: 'VES', label: 'Gaveta Efectivo Bs' },
    bank_ves: { nominal: Number(balBankVES.toFixed(2)), currency: 'VES', label: 'Banco Bolívares (Pago Móvil / POS)' },
    bank_usd: { nominal: Number(balBankUSD.toFixed(2)), currency: 'USD', label: 'Banco Dólares (Zelle / Divisas)' },
    totalEquivalentUSD: Number(totalEquivalentUSD.toFixed(2)),
  }
}

/**
 * Calcula el balance y saldo esperado en caja (método tradicional/monocaja compatible).
 */
export function calculateCashRegisterBalance(params: {
  initialCash: number
  payments: CashPayment[]
  expenses: CashExpenseItem[]
  filterCashOnly?: boolean
}): CashRegisterSummary {
  const initialCash = Math.max(0, params.initialCash || 0)

  let totalIncomeCash = 0
  let totalIncomeNonCash = 0

  for (const payment of params.payments) {
    const isCash = payment.is_cash ?? (
      payment.payment_method_name ? payment.payment_method_name.toLowerCase().includes('efectivo') || payment.payment_method_name.toLowerCase().includes('cash') : true
    )

    if (isCash) {
      totalIncomeCash += payment.amount
    } else {
      totalIncomeNonCash += payment.amount
    }
  }

  const totalIncomeAll = totalIncomeCash + totalIncomeNonCash
  const totalExpenses = params.expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)

  const expectedCashInDrawer = initialCash + (params.filterCashOnly !== false ? totalIncomeCash : totalIncomeAll) - totalExpenses
  const totalNetFlow = totalIncomeAll - totalExpenses

  return {
    initialCash: Number(initialCash.toFixed(2)),
    totalIncomeCash: Number(totalIncomeCash.toFixed(2)),
    totalIncomeNonCash: Number(totalIncomeNonCash.toFixed(2)),
    totalIncomeAll: Number(totalIncomeAll.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
    totalNetFlow: Number(totalNetFlow.toFixed(2)),
  }
}

/**
 * Realiza el cálculo del arqueo de caja comparando el efectivo físico contado con el esperado.
 */
export function calculateCashArqueo(
  expectedCash: number,
  countedCash: number,
  tolerance = 0.01
): CashArqueoResult {
  const difference = Number((countedCash - expectedCash).toFixed(2))

  let status: 'balanced' | 'surplus' | 'deficit' = 'balanced'
  let message = 'Caja cuadrada sin diferencias.'

  if (difference > tolerance) {
    status = 'surplus'
    message = `Sobrante de caja por $${difference.toFixed(2)}.`
  } else if (difference < -tolerance) {
    status = 'deficit'
    message = `Faltante de caja por $${Math.abs(difference).toFixed(2)}.`
  }

  return {
    expectedCash: Number(expectedCash.toFixed(2)),
    countedCash: Number(countedCash.toFixed(2)),
    difference,
    status,
    message,
  }
}
