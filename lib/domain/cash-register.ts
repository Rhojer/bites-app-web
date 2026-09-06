export interface CashPayment {
  amount: number
  payment_method_id?: string
  payment_method_name?: string
  is_cash?: boolean
  created_at?: string
}

export interface CashExpenseItem {
  id?: string
  amount: number
  category: string
  notes: string
  recipient?: string | null
  currency?: string | null
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
 * Calcula el balance y saldo esperado en caja:
 * Saldo Esperado en Efectivo = Fondo Inicial + Ventas en Efectivo - Egresos Justificados con Nota
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

  // En el cajón físico de efectivo: Fondo + Ventas Efectivo - Retiros/Egresos
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
