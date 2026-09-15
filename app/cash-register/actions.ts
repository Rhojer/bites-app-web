'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeText } from '@/lib/security'

export async function createCashExpenseAction(formData: FormData) {
  const supabase = await createClient()

  const amount = parseFloat(formData.get('amount') as string) || 0
  const category = sanitizeText((formData.get('category') as string) || 'Otros')
  const recipient = sanitizeText((formData.get('recipient') as string) || '')
  const notes = sanitizeText((formData.get('notes') as string) || '')
  const vault = (formData.get('vault') as string) || 'cash_usd'
  const currency = vault === 'cash_usd' ? 'USD' : 'VES'

  if (amount <= 0 || !notes) {
    throw new Error('El monto debe ser mayor a cero y la nota de justificación es obligatoria.')
  }

  // 1. Guardar en cash_expenses (si la tabla existe)
  const { error: expErr } = await supabase.from('cash_expenses').insert({
    amount,
    category,
    recipient,
    notes,
    currency,
  })

  // 2. También registrar en la tabla general de gastos (expenses) para el balance P&L
  await supabase.from('expenses').insert({
    category,
    type: 'variable',
    amount,
    description: `Egreso de Caja: ${notes} (Entregado a: ${recipient || 'N/A'})`,
  })

  if (expErr) {
    console.error('Error al insertar en cash_expenses:', expErr.message)
  }

  revalidatePath('/cash-register')
  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true }
}

export async function recordCurrencyExchangeAction(params: {
  from_vault: string
  to_vault: string
  from_amount: number
  from_currency: string
  to_amount: number
  to_currency: string
  exchange_rate: number
  notes?: string
}) {
  const supabase = await createClient()

  if (params.from_amount <= 0 || params.to_amount <= 0) {
    throw new Error('Los montos de canje deben ser mayores a 0.')
  }
  if (params.from_vault === params.to_vault) {
    throw new Error('La bóveda de origen y destino deben ser distintas.')
  }

  const { error } = await (supabase as any).from('currency_exchanges').insert({
    from_vault: params.from_vault,
    to_vault: params.to_vault,
    from_amount: params.from_amount,
    from_currency: params.from_currency,
    to_amount: params.to_amount,
    to_currency: params.to_currency,
    exchange_rate: params.exchange_rate,
    notes: sanitizeText(params.notes || 'Canje manual de divisas'),
  })

  if (error) {
    console.error('Error al insertar currency_exchange:', error.message)
  }

  revalidatePath('/cash-register')
  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true }
}
