'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeText } from '@/lib/security'

export async function createBillAction(formData: FormData) {
  const supabase = await createClient()

  const supplier_id = formData.get('supplier_id') as string
  const invoice_number = sanitizeText(formData.get('invoice_number') as string) || null
  const amount = parseFloat(formData.get('amount') as string) || 0
  const due_date = formData.get('due_date') as string
  const notes = sanitizeText(formData.get('notes') as string) || null

  if (!supplier_id) {
    throw new Error('Debe seleccionar un proveedor.')
  }

  if (amount <= 0) {
    throw new Error('El monto de la factura debe ser mayor a 0.')
  }

  if (!due_date) {
    throw new Error('Debe especificar una fecha de vencimiento.')
  }

  const { error } = await supabase.from('bills_payable').insert({
    supplier_id,
    invoice_number,
    amount,
    due_date,
    status: 'pending',
    notes,
  })

  if (error) {
    console.error('Error al crear factura por pagar:', error.message)
    throw new Error(`Error al registrar factura: ${error.message}`)
  }

  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true }
}

export async function payBillAction(formData: FormData) {
  const supabase = await createClient()

  const bill_id = formData.get('bill_id') as string
  const payment_notes = sanitizeText(formData.get('payment_notes') as string) || ''
  const register_as_expense = formData.get('register_as_expense') === 'true'

  if (!bill_id) {
    throw new Error('ID de factura requerido.')
  }

  // 1. Obtener la factura actual
  const { data: bill, error: fetchErr } = await supabase
    .from('bills_payable')
    .select('*')
    .eq('id', bill_id)
    .single()

  if (fetchErr || !bill) {
    throw new Error('Factura no encontrada.')
  }

  const now = new Date().toISOString()
  let supplierName = 'Proveedor'
  if (bill.supplier_id) {
    const { data: sup } = await supabase
      .from('suppliers')
      .select('name')
      .eq('id', bill.supplier_id)
      .single()
    if (sup?.name) supplierName = sup.name
  }

  // 2. Marcar como pagada
  const updatedNotes = [
    bill.notes,
    payment_notes ? `Pago: ${payment_notes}` : null,
    `Pagado el ${new Date().toLocaleDateString('es-ES')}`,
  ]
    .filter(Boolean)
    .join(' | ')

  const { error: updateErr } = await supabase
    .from('bills_payable')
    .update({
      status: 'paid',
      paid_at: now,
      notes: updatedNotes,
    })
    .eq('id', bill_id)

  if (updateErr) {
    throw new Error(`Error al actualizar estado de la factura: ${updateErr.message}`)
  }

  // 3. Registrar opcionalmente en expenses si se solicitó
  if (register_as_expense) {
    await supabase.from('expenses').insert({
      category: 'Pago a Proveedores',
      type: 'variable',
      amount: bill.amount,
      date: new Date().toISOString().split('T')[0],
      description: `Pago Factura #${bill.invoice_number || bill.id.slice(0, 8)} - ${supplierName}. ${payment_notes}`.trim(),
    })
  }

  revalidatePath('/finances')
  revalidatePath('/')
  revalidatePath('/cash-register')
  return { success: true }
}

export async function createExpenseAction(formData: FormData) {
  const supabase = await createClient()

  const category = sanitizeText(formData.get('category') as string) || 'Otros'
  const type = (formData.get('type') as string) || 'variable'
  const amount = parseFloat(formData.get('amount') as string) || 0
  const date = (formData.get('date') as string) || new Date().toISOString().split('T')[0]
  const description = sanitizeText(formData.get('description') as string) || ''

  if (amount <= 0) {
    throw new Error('El monto del gasto debe ser mayor a 0.')
  }

  if (!description) {
    throw new Error('La descripción del gasto es obligatoria.')
  }

  const { error } = await supabase.from('expenses').insert({
    category,
    type,
    amount,
    date,
    description,
  })

  if (error) {
    console.error('Error al insertar gasto:', error.message)
    throw new Error(`Error al registrar gasto: ${error.message}`)
  }

  revalidatePath('/finances')
  revalidatePath('/cash-register')
  revalidatePath('/')
  return { success: true }
}

export async function deleteExpenseAction(expenseId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

  if (error) {
    throw new Error(`Error al eliminar gasto: ${error.message}`)
  }

  revalidatePath('/finances')
  revalidatePath('/cash-register')
  revalidatePath('/')
  return { success: true }
}

export async function deleteBillAction(billId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('bills_payable').delete().eq('id', billId)

  if (error) {
    throw new Error(`Error al eliminar factura: ${error.message}`)
  }

  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true }
}
