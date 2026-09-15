'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeText } from '@/lib/security'

export async function createIngredientAction(formData: FormData) {
  const supabase = await createClient()

  const name = sanitizeText(formData.get('name') as string)
  const code = sanitizeText(formData.get('code') as string) || null
  const category = sanitizeText(formData.get('category') as string) || 'General'
  const unit = sanitizeText(formData.get('unit') as string) || 'kg'
  const current_stock = parseFloat(formData.get('current_stock') as string) || 0
  const min_stock = parseFloat(formData.get('min_stock') as string) || 0
  const max_stock = parseFloat(formData.get('max_stock') as string) || 0
  const cost_per_unit = parseFloat(formData.get('cost_per_unit') as string) || 0
  const location = sanitizeText(formData.get('location') as string) || null

  if (!name) {
    throw new Error('El nombre del insumo es obligatorio.')
  }

  const { error } = await supabase.from('ingredients').insert({
    name,
    code,
    category,
    unit,
    current_stock,
    min_stock,
    max_stock,
    cost_per_unit,
    location,
  })

  if (error) {
    throw new Error(`Error al crear insumo: ${error.message}`)
  }

  // Registrar movimiento inicial si se especificó stock > 0
  if (current_stock > 0) {
    const { data: created } = await supabase.from('ingredients').select('id').eq('name', name).order('created_at', { ascending: false }).limit(1).single()
    if (created?.id) {
      await supabase.from('inventory_movements').insert({
        ingredient_id: created.id,
        type: 'adjustment',
        quantity: current_stock,
        unit_cost: cost_per_unit,
        reason: 'Inventario inicial'
      })
    }
  }

  revalidatePath('/inventory')
  return { success: true }
}

export async function registerMovementAction(formData: FormData) {
  const supabase = await createClient()

  const ingredient_id = formData.get('ingredient_id') as string
  const type = formData.get('type') as string // 'purchase' | 'waste' | 'adjustment'
  const quantity = parseFloat(formData.get('quantity') as string) || 0
  const reason = sanitizeText(formData.get('reason') as string) || ''

  if (!ingredient_id || quantity <= 0) {
    throw new Error('Insumo y cantidad válida son requeridos.')
  }

  // Obtener insumo actual
  const { data: ingredient, error: fetchErr } = await supabase
    .from('ingredients')
    .select('current_stock, cost_per_unit')
    .eq('id', ingredient_id)
    .single()

  if (fetchErr || !ingredient) {
    throw new Error('Insumo no encontrado.')
  }

  // Calcular nuevo stock
  let stockDelta = quantity
  if (type === 'waste') {
    stockDelta = -quantity // Las mermas restan
  } else if (type === 'adjustment') {
    // Si es ajuste, podemos indicar la diferencia directamente
    stockDelta = -quantity
  }

  const newStock = Math.max(0, ingredient.current_stock + stockDelta)

  // Actualizar tabla ingredients
  await supabase
    .from('ingredients')
    .update({ current_stock: newStock })
    .eq('id', ingredient_id)

  // Registrar trazabilidad en inventory_movements
  await supabase.from('inventory_movements').insert({
    ingredient_id,
    type,
    quantity: stockDelta,
    unit_cost: ingredient.cost_per_unit,
    reason: reason || (type === 'waste' ? 'Merma registrada' : 'Entrada de mercancía')
  })

  revalidatePath('/inventory')
  return { success: true }
}
