'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeText, validateUUID } from '@/lib/security'

export interface CartItemInput {
  recipe_id: string
  name: string
  quantity: number
  unit_price: number
  notes?: string
}

export interface CreateOrderParams {
  table_id?: string | null
  type: string
  items: CartItemInput[]
  subtotal: number
  total: number
  payment_method_id?: string
  payment_method_name?: string
  customer_id?: string | null
  customer_name?: string
  customer_phone?: string
  notes?: string
  is_paid?: boolean
  is_credit?: boolean
  reference_number?: string
}

export type ProcessOrderResult =
  | { success: true; orderId: string; error?: never }
  | { success: false; error: string; orderId?: never }

/**
 * Acción unificada para procesar o crear una orden desde el POS (con soporte para crédito y selección de cliente)
 */
export async function processOrderAction(data: {
  table_id?: string | null
  type: string
  items: CartItemInput[]
  subtotal?: number
  total?: number
  payment_method_id?: string
  payment_method_name?: string
  customer_id?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  notes?: string | null
  is_paid?: boolean
  is_credit?: boolean
  reference_number?: string | null
  payments?: Array<{
    payment_method_id: string
    amount: number
    reference_number?: string | null
    amount_currency?: number | null
    currency?: string | null
    exchange_rate?: number | null
    vault?: string | null
  }>
  discount?: number
  taxRate?: number
}): Promise<ProcessOrderResult> {
  const supabase = await createClient()

  if (data.items.length === 0) {
    throw new Error('La orden no tiene productos.')
  }

  const sanitizedCustomerName = sanitizeText(data.customer_name)
  const isCredit = data.is_credit === true || data.payment_method_name === 'Crédito'
  const isPaid = !isCredit && data.is_paid !== false
  const orderStatus = isPaid || isCredit ? 'completed' : 'active'
  const paymentStatus = isCredit ? 'credit' : isPaid ? 'paid' : 'pending'
  const kitchenStatus = 'pending'

  const calculatedSubtotal = data.subtotal ?? data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const calculatedTotal = data.total ?? calculatedSubtotal

  // Formatear notas y teléfono de contacto
  let orderNotes = sanitizeText(data.notes)
  if (data.customer_phone && data.customer_phone.trim()) {
    const phoneTag = `Tel: ${data.customer_phone.trim()}`
    if (!orderNotes.includes(phoneTag)) {
      orderNotes = orderNotes ? `${orderNotes} | ${phoneTag}` : phoneTag
    }
  }

  const validTableId = data.table_id && validateUUID(data.table_id) ? data.table_id : null
  const validCustomerId = data.customer_id && validateUUID(data.customer_id) ? data.customer_id : null

  // 1. Crear orden (utilizando exclusivamente columnas existentes en orders)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      type: data.type || 'dine_in',
      table_id: validTableId,
      user_id: validCustomerId,
      customer_name: sanitizedCustomerName || (validTableId ? 'Mesa Salón' : 'Cliente Mostrador'),
      status: orderStatus,
      payment_status: paymentStatus,
      kitchen_status: kitchenStatus,
      subtotal: calculatedSubtotal,
      total: calculatedTotal,
      notes: orderNotes || (isCredit ? 'Venta a Crédito / Cuenta Corriente' : null),
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    console.error('Error al insertar orden:', orderErr)
    throw new Error(`Error al crear la orden: ${orderErr?.message || 'Error de base de datos'}`)
  }

  const orderId = order.id

  // 2. Si es para salón y tiene mesa asignada, marcar mesa como ocupada
  if (validTableId && data.type === 'dine_in') {
    await supabase
      .from('restaurant_tables')
      .update({ status: 'occupied' })
      .eq('id', validTableId)
  }

  // 3. Insertar items de la orden
  const itemRows = data.items.map((item) => ({
    order_id: orderId,
    recipe_id: item.recipe_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
    notes: sanitizeText(item.notes) || null,
    kitchen_status: 'pending',
  }))

  const { error: itemsErr } = await supabase.from('order_items').insert(itemRows)
  if (itemsErr) {
    console.error('Error al insertar items de la orden:', itemsErr.message)
    throw new Error(`Error al registrar productos: ${itemsErr.message}`)
  }

  // 4. Registrar pago o registro de crédito si está cobrada
  let methodId = data.payment_method_id
  if (!methodId && (isPaid || isCredit)) {
    const { data: m } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('name', data.payment_method_name || '')
      .limit(1)
      .single()
    methodId = m?.id || '00000000-0000-0000-0000-000000000000'
  }

  if (isPaid || isCredit) {
    const refNumber = isCredit
      ? 'VENTA-A-CREDITO'
      : data.reference_number
      ? data.reference_number.trim()
      : data.payment_method_name === 'Efectivo USD'
      ? 'POS-EFECTIVO'
      : `REF-${Date.now().toString().slice(-6)}`

    await supabase.from('order_payments').insert({
      order_id: orderId,
      payment_method_id: methodId || '00000000-0000-0000-0000-000000000000',
      amount: calculatedTotal,
      reference_number: refNumber,
    })
  }

  // 5. Si es venta a crédito y hay cliente registrado, incrementar su deuda en profiles
  if (isCredit && validCustomerId) {
    const { data: cust } = await supabase
      .from('profiles')
      .select('id, current_debt, total_spent, total_orders_count')
      .eq('id', validCustomerId)
      .single()

    if (cust) {
      const currentDebt = cust.current_debt || 0
      const totalSpent = cust.total_spent || 0
      const ordersCount = cust.total_orders_count || 0

      await supabase
        .from('profiles')
        .update({
          current_debt: currentDebt + calculatedTotal,
          total_spent: totalSpent + calculatedTotal,
          total_orders_count: ordersCount + 1,
        })
        .eq('id', validCustomerId)
    }
  }

  // 6. Descontar stock de inventario automáticamente según los escandallos
  for (const item of data.items) {
    const { data: recIngs } = await supabase
      .from('recipe_ingredients')
      .select('ingredient_id, quantity')
      .eq('recipe_id', item.recipe_id)

    if (recIngs && recIngs.length > 0) {
      for (const ing of recIngs) {
        const qtyToDeduct = ing.quantity * item.quantity

        const { data: currentIng } = await supabase
          .from('ingredients')
          .select('current_stock, cost_per_unit')
          .eq('id', ing.ingredient_id)
          .single()

        if (currentIng) {
          const newStock = Math.max(0, currentIng.current_stock - qtyToDeduct)
          await supabase
            .from('ingredients')
            .update({ current_stock: newStock })
            .eq('id', ing.ingredient_id)

          // Registrar movimiento de salida para trazabilidad de forma segura
          try {
            await supabase.from('inventory_movements').insert({
              ingredient_id: ing.ingredient_id,
              type: 'sale_deduction',
              quantity: -qtyToDeduct,
              unit_cost: currentIng.cost_per_unit,
              reason: `Venta POS Comanda #${orderId.slice(0, 8)}`,
            })
          } catch {
            // No interrumpir si la tabla inventory_movements tiene restricciones previas
          }
        }
      }
    }
  }

  revalidatePath('/pos')
  revalidatePath('/crm')
  revalidatePath('/kitchen')
  revalidatePath('/inventory')
  revalidatePath('/cash-register')
  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true, orderId }
}

/**
 * Actualiza el estado de una orden (kitchen_status o status general)
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: {
    status?: string
    kitchen_status?: 'pending' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled'
    payment_status?: string
  }
) {
  const supabase = await createClient()

  const updateData: {
    updated_at: string
    status?: string
    kitchen_status?: 'pending' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled'
    payment_status?: string
  } = {
    updated_at: new Date().toISOString(),
  }

  if (newStatus.status) updateData.status = newStatus.status
  if (newStatus.kitchen_status) updateData.kitchen_status = newStatus.kitchen_status
  if (newStatus.payment_status) updateData.payment_status = newStatus.payment_status

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    throw new Error(`Error al actualizar estado: ${error.message}`)
  }

  // Si se actualizó el kitchen_status, actualizar también los items
  if (newStatus.kitchen_status) {
    await supabase
      .from('order_items')
      .update({ kitchen_status: newStatus.kitchen_status })
      .eq('order_id', orderId)
  }

  revalidatePath('/pos')
  revalidatePath('/kitchen')
  revalidatePath('/')
  return { success: true }
}

/**
 * Cobrar un pedido activo previamente guardado (incluye opción a crédito)
 */
export async function payActiveOrderAction(params: {
  orderId: string
  paymentMethodName: string
  paymentMethodId?: string
  total: number
  referenceNumber?: string
  customerId?: string | null
}) {
  const supabase = await createClient()

  const isCredit = params.paymentMethodName === 'Crédito'

  let methodId = params.paymentMethodId
  if (!methodId) {
    const { data: m } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('name', params.paymentMethodName)
      .limit(1)
      .single()
    methodId = m?.id || '00000000-0000-0000-0000-000000000000'
  }

  const refNumber = isCredit
    ? 'VENTA-A-CREDITO'
    : params.referenceNumber
    ? params.referenceNumber.trim()
    : params.paymentMethodName === 'Efectivo USD'
    ? 'POS-EFECTIVO'
    : `REF-${Date.now().toString().slice(-6)}`

  // Registrar pago
  const { error: payErr } = await supabase.from('order_payments').insert({
    order_id: params.orderId,
    payment_method_id: methodId,
    amount: params.total,
    reference_number: refNumber,
  })

  if (payErr) {
    console.warn('Advertencia al registrar pago:', payErr.message)
  }

  const validCustomerId = params.customerId && validateUUID(params.customerId) ? params.customerId : null
  const updatePayload = {
    payment_status: isCredit ? 'credit' : 'paid',
    status: 'completed',
    updated_at: new Date().toISOString(),
    ...(validCustomerId ? { user_id: validCustomerId } : {}),
  }

  const { error: ordErr } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', params.orderId)

  if (ordErr) {
    throw new Error(`Error al marcar orden como cobrada/crédito: ${ordErr.message}`)
  }

  // Liberar mesa si la orden pertenecía a una mesa
  const { data: ordInfo } = await supabase
    .from('orders')
    .select('table_id')
    .eq('id', params.orderId)
    .single()

  if (ordInfo?.table_id) {
    await supabase
      .from('restaurant_tables')
      .update({ status: 'available' })
      .eq('id', ordInfo.table_id)
  }

  // Si se cobra a crédito, incrementar deuda del cliente en profiles
  if (isCredit && validCustomerId) {
    const { data: cust } = await supabase
      .from('profiles')
      .select('id, current_debt, total_spent, total_orders_count')
      .eq('id', validCustomerId)
      .single()

    if (cust) {
      const currentDebt = cust.current_debt || 0
      const totalSpent = cust.total_spent || 0
      const ordersCount = cust.total_orders_count || 0

      await supabase
        .from('profiles')
        .update({
          current_debt: currentDebt + params.total,
          total_spent: totalSpent + params.total,
          total_orders_count: ordersCount + 1,
        })
        .eq('id', validCustomerId)
    }
  }

  revalidatePath('/pos')
  revalidatePath('/crm')
  revalidatePath('/kitchen')
  revalidatePath('/cash-register')
  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true }
}

/**
 * Cancelar una orden activa
 */
export async function cancelOrderAction(orderId: string) {
  const supabase = await createClient()

  const { data: ord } = await supabase
    .from('orders')
    .select('table_id')
    .eq('id', orderId)
    .single()

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      kitchen_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Error al cancelar orden: ${error.message}`)
  }

  // Si tenía mesa asignada, liberarla
  if (ord?.table_id) {
    await supabase
      .from('restaurant_tables')
      .update({ status: 'available' })
      .eq('id', ord.table_id)
  }

  revalidatePath('/pos')
  revalidatePath('/kitchen')
  revalidatePath('/')
  return { success: true }
}
