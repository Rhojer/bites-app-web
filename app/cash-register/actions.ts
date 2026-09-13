'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCashExpenseAction(formData: FormData) {
  const supabase = await createClient()

  const amount = parseFloat(formData.get('amount') as string) || 0
  const category = (formData.get('category') as string) || 'Otros'
  const recipient = (formData.get('recipient') as string) || ''
  const notes = (formData.get('notes') as string) || ''
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
