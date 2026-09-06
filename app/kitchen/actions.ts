'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type KitchenStatus = 'pending' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled'

export interface KitchenOrderItem {
  id: string
  order_id: string
  recipe_id: string
  recipe_name: string
  recipe_category: string
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
  kitchen_status: KitchenStatus
}

export interface KitchenOrder {
  id: string
  order_number: number
  created_at: string
  updated_at: string | null
  customer_name: string | null
  customer_phone: string | null
  table_id: string | null
  table_number: string | null
  table_name: string | null
  type: string
  status: string | null
  payment_status: string | null
  kitchen_status: KitchenStatus
  notes: string | null
  subtotal: number | null
  total: number | null
  items: KitchenOrderItem[]
}

/**
 * Obtiene todas las órdenes relevantes para cocina (activas y recientes)
 */
export async function getKitchenOrdersAction(): Promise<KitchenOrder[]> {
  const supabase = await createClient()

  // 1. Consultar órdenes, items, recetas y mesas
  const [
    { data: ordersData, error: ordersErr },
    { data: itemsData, error: itemsErr },
    { data: recipesData, error: recipesErr },
    { data: tablesData, error: tablesErr }
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .in('kitchen_status', ['pending', 'in_preparation', 'ready', 'delivered'])
      .order('created_at', { ascending: true }),
    supabase.from('order_items').select('*'),
    supabase.from('recipes').select('id, name, category'),
    supabase.from('restaurant_tables').select('id, number, name')
  ])

  if (ordersErr) {
    console.error('Error al obtener órdenes de cocina:', ordersErr)
    return []
  }

  const recipesMap = new Map<string, { name: string; category: string }>()
  for (const r of recipesData || []) {
    recipesMap.set(r.id, {
      name: r.name || 'Plato sin nombre',
      category: r.category || 'General',
    })
  }

  const tablesMap = new Map<string, { number: string; name: string | null }>()
  for (const t of tablesData || []) {
    tablesMap.set(t.id, {
      number: t.number,
      name: t.name,
    })
  }

  const itemsByOrderId = new Map<string, KitchenOrderItem[]>()
  for (const item of itemsData || []) {
    const rec = recipesMap.get(item.recipe_id)
    const orderItem: KitchenOrderItem = {
      id: item.id,
      order_id: item.order_id,
      recipe_id: item.recipe_id,
      recipe_name: rec?.name || 'Plato',
      recipe_category: rec?.category || 'General',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      notes: item.notes,
      kitchen_status: (item.kitchen_status as KitchenStatus) || 'pending',
    }

    const currentList = itemsByOrderId.get(item.order_id) || []
    currentList.push(orderItem)
    itemsByOrderId.set(item.order_id, currentList)
  }

  const result: KitchenOrder[] = (ordersData || []).map((ord) => {
    const tableInfo = ord.table_id ? tablesMap.get(ord.table_id) : null
    return {
      id: ord.id,
      order_number: ord.order_number,
      created_at: ord.created_at,
      updated_at: ord.updated_at,
      customer_name: ord.customer_name,
      customer_phone: ord.customer_phone,
      table_id: ord.table_id,
      table_number: tableInfo?.number || null,
      table_name: tableInfo?.name || null,
      type: ord.type || 'dine_in',
      status: ord.status,
      payment_status: ord.payment_status,
      kitchen_status: (ord.kitchen_status as KitchenStatus) || 'pending',
      notes: ord.notes,
      subtotal: ord.subtotal,
      total: ord.total,
      items: itemsByOrderId.get(ord.id) || [],
    }
  })

  return result
}

/**
 * Actualiza el estado de cocina de una comanda completa y sus ítems
 */
export async function updateOrderKitchenStatusAction(
  orderId: string,
  kitchenStatus: KitchenStatus
) {
  const supabase = await createClient()

  const { error: orderErr } = await supabase
    .from('orders')
    .update({
      kitchen_status: kitchenStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (orderErr) {
    throw new Error(`Error al actualizar estado de la orden: ${orderErr.message}`)
  }

  // Actualizar también los items de la orden al nuevo estado correspondiente
  const { error: itemsErr } = await supabase
    .from('order_items')
    .update({
      kitchen_status: kitchenStatus,
    })
    .eq('order_id', orderId)

  if (itemsErr) {
    console.warn('Advertencia al actualizar items:', itemsErr.message)
  }

  revalidatePath('/kitchen')
  revalidatePath('/pos')
  revalidatePath('/')
  return { success: true }
}

/**
 * Actualiza el estado de cocina de un plato específico dentro de una comanda
 */
export async function updateOrderItemKitchenStatusAction(
  orderItemId: string,
  kitchenStatus: KitchenStatus
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('order_items')
    .update({
      kitchen_status: kitchenStatus,
    })
    .eq('id', orderItemId)

  if (error) {
    throw new Error(`Error al actualizar estado del ítem: ${error.message}`)
  }

  revalidatePath('/kitchen')
  return { success: true }
}

/**
 * Actualización masiva de órdenes
 */
export async function bulkUpdateKitchenStatusAction(
  orderIds: string[],
  kitchenStatus: KitchenStatus
) {
  if (orderIds.length === 0) return { success: true }

  const supabase = await createClient()

  const { error: orderErr } = await supabase
    .from('orders')
    .update({
      kitchen_status: kitchenStatus,
      updated_at: new Date().toISOString(),
    })
    .in('id', orderIds)

  if (orderErr) {
    throw new Error(`Error en actualización masiva: ${orderErr.message}`)
  }

  await supabase
    .from('order_items')
    .update({
      kitchen_status: kitchenStatus,
    })
    .in('order_id', orderIds)

  revalidatePath('/kitchen')
  revalidatePath('/pos')
  return { success: true }
}
