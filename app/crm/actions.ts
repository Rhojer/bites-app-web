'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Crea un nuevo cliente en el directorio (tabla profiles con role='customer')
 */
export async function createCustomerAction(formData: FormData) {
  const supabase = await createClient()

  const fullName = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const birthDate = (formData.get('birth_date') as string)?.trim() || null
  const creditLimit = parseFloat(formData.get('credit_limit') as string) || 0

  if (!fullName) {
    throw new Error('El nombre completo del cliente es obligatorio.')
  }

  const generatedEmail = email || `cliente_${Date.now()}@bitescustomer.com`

  let customerId = crypto.randomUUID()

  // Intentar crear auth user para satisfacer foreign key
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: generatedEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: fullName, phone }
  })

  if (authUser?.user?.id) {
    customerId = authUser.user.id
  }

  const { error } = await supabase.from('profiles').upsert({
    id: customerId,
    full_name: fullName,
    email: generatedEmail,
    phone,
    address,
    role: 'customer',
    credit_limit: creditLimit,
    current_debt: 0,
  })

  if (error) {
    throw new Error(`Error al crear cliente: ${error.message}`)
  }

  revalidatePath('/crm')
  return { success: true, customerId }
}

/**
 * Actualiza los datos generales de un cliente
 */
export async function updateCustomerAction(formData: FormData) {
  const supabase = await createClient()

  const customerId = formData.get('customer_id') as string
  const fullName = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const birthDate = (formData.get('birth_date') as string)?.trim() || null

  if (!customerId || !fullName) {
    throw new Error('ID y Nombre del cliente son obligatorios.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      email,
      phone,
      address,
      birth_date: birthDate,
    })
    .eq('id', customerId)

  if (error) {
    throw new Error(`Error al actualizar cliente: ${error.message}`)
  }

  revalidatePath('/crm')
  return { success: true }
}

/**
 * Asigna o modifica el límite de crédito de un cliente
 */
export async function updateCustomerCreditLimitAction(customerId: string, creditLimit: number) {
  const supabase = await createClient()

  if (!customerId) {
    throw new Error('ID de cliente inválido.')
  }

  if (creditLimit < 0) {
    throw new Error('El límite de crédito no puede ser negativo.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      credit_limit: creditLimit,
    })
    .eq('id', customerId)

  if (error) {
    throw new Error(`Error al actualizar límite de crédito: ${error.message}`)
  }

  revalidatePath('/crm')
  return { success: true }
}

/**
 * Registra un abono a la deuda de crédito de un cliente
 * - Inserta el registro en credit_payments
 * - Actualiza la deuda en profiles descontando el monto
 */
export async function recordCreditPaymentAction(formData: FormData) {
  const supabase = await createClient()

  const customerId = formData.get('customer_id') as string
  const amount = parseFloat(formData.get('amount') as string) || 0
  const paymentMethodId = (formData.get('payment_method_id') as string) || ''
  const referenceNumber = (formData.get('reference_number') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!customerId) {
    throw new Error('Debe seleccionar un cliente.')
  }

  if (amount <= 0) {
    throw new Error('El monto del abono debe ser mayor a 0.')
  }

  // 1. Obtener cliente actual para verificar deuda
  const { data: customer, error: custErr } = await supabase
    .from('profiles')
    .select('id, full_name, current_debt')
    .eq('id', customerId)
    .single()

  if (custErr || !customer) {
    throw new Error('Cliente no encontrado.')
  }

  const currentDebt = customer.current_debt || 0
  if (currentDebt <= 0) {
    throw new Error('El cliente no posee deuda pendiente.')
  }

  // 2. Obtener o resolver método de pago si no viene
  let methodId = paymentMethodId
  if (!methodId) {
    const { data: defaultMethod } = await supabase
      .from('payment_methods')
      .select('id')
      .limit(1)
      .single()
    methodId = defaultMethod?.id || '00000000-0000-0000-0000-000000000000'
  }

  // 3. Insertar abono en credit_payments
  const paymentId = crypto.randomUUID()
  const { error: payErr } = await supabase.from('credit_payments').insert({
    id: paymentId,
    customer_id: customerId,
    amount,
    payment_method_id: methodId,
    reference_number: referenceNumber || `ABONO-${Date.now().toString().slice(-6)}`,
    notes: notes || `Abono a cuenta corriente por $${amount.toFixed(2)}`,
  })

  if (payErr) {
    throw new Error(`Error al registrar abono: ${payErr.message}`)
  }

  // 4. Actualizar deuda en perfil del cliente
  const newDebt = Math.max(0, currentDebt - amount)
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      current_debt: newDebt,
    })
    .eq('id', customerId)

  if (updateErr) {
    console.error('Error al actualizar deuda del cliente:', updateErr.message)
  }

  revalidatePath('/crm')
  revalidatePath('/cash-register')
  revalidatePath('/')
  return { success: true, newDebt }
}

/**
 * Crea una nueva campaña de marketing segmentada
 */
export async function createMarketingCampaignAction(formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const type = (formData.get('type') as string) || 'whatsapp' // 'whatsapp' | 'sms' | 'email'
  const targetAudience = (formData.get('target_audience') as string) || 'all'
  const message = (formData.get('message') as string)?.trim()
  const sendNow = formData.get('send_now') === 'true'

  if (!name || !message) {
    throw new Error('El nombre de la campaña y el mensaje son requeridos.')
  }

  // Calcular número de destinatarios potenciales según la audiencia
  const { data: customers } = await supabase
    .from('profiles')
    .select('id, birth_date, total_spent, total_orders_count, created_at')

  let recipientsCount = 0
  const allProfiles = customers || []

  if (targetAudience === 'all') {
    recipientsCount = allProfiles.length
  } else if (targetAudience === 'birthday') {
    const currentMonth = new Date().getMonth() + 1
    recipientsCount = allProfiles.filter((p) => {
      if (!p.birth_date) return false
      try {
        const d = new Date(p.birth_date)
        return d.getMonth() + 1 === currentMonth
      } catch {
        return false
      }
    }).length
  } else if (targetAudience === 'vip') {
    recipientsCount = allProfiles.filter(
      (p) => (p.total_spent || 0) >= 100 || (p.total_orders_count || 0) >= 5
    ).length
  } else if (targetAudience === 'inactive_30') {
    recipientsCount = allProfiles.filter(
      (p) => (p.total_orders_count || 0) === 0 || (p.total_spent || 0) === 0
    ).length
  } else {
    recipientsCount = allProfiles.length
  }

  const campaignId = crypto.randomUUID()
  const nowIso = new Date().toISOString()

  const { error } = await supabase.from('marketing_campaigns').insert({
    id: campaignId,
    name,
    type,
    target_audience: targetAudience,
    message,
    status: sendNow ? 'sent' : 'draft',
    sent_at: sendNow ? nowIso : null,
    recipients_count: recipientsCount,
  })

  if (error) {
    throw new Error(`Error al crear campaña: ${error.message}`)
  }

  revalidatePath('/crm')
  return { success: true, recipientsCount }
}
