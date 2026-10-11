'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeText } from '@/lib/security'
import { calculateWeightedAverageCost } from '@/lib/domain/units'

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

  const is_credit = formData.get('is_credit') === 'true'
  const supplier_id = (formData.get('supplier_id') as string) || null
  const invoice_number = sanitizeText(formData.get('invoice_number') as string) || null
  const due_date = (formData.get('due_date') as string) || null
  const credit_notes = sanitizeText(formData.get('credit_notes') as string) || null

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
    supplier_id: supplier_id || null,
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
        type: is_credit ? 'purchase' : 'adjustment',
        quantity: current_stock,
        unit_cost: cost_per_unit,
        reason: is_credit
          ? `Carga inicial a crédito (${invoice_number ? `Factura ${invoice_number}` : 'Proveedor'})`
          : 'Inventario inicial'
      })
    }

    // Si viene a crédito con un proveedor, crear la cuenta por pagar en Finanzas
    if (is_credit && supplier_id) {
      const totalCreditAmount = Number((current_stock * cost_per_unit).toFixed(2))
      if (totalCreditAmount > 0) {
        const computedDueDate = due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
        await supabase.from('bills_payable').insert({
          supplier_id,
          invoice_number,
          amount: totalCreditAmount,
          due_date: computedDueDate,
          status: 'pending',
          notes: credit_notes || `Carga inicial a crédito: ${name} (${current_stock} ${unit})`,
        })
        revalidatePath('/finances')
      }
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
  const purchaseUnitCostRaw = formData.get('purchase_unit_cost') as string | null
  const purchaseTotalCostRaw = formData.get('purchase_total_cost') as string | null

  if (!ingredient_id || quantity <= 0) {
    throw new Error('Insumo y cantidad válida son requeridos.')
  }

  // Obtener insumo actual
  const { data: ingredient, error: fetchErr } = await supabase
    .from('ingredients')
    .select('id, name, current_stock, cost_per_unit, unit, supplier_id')
    .eq('id', ingredient_id)
    .single()

  if (fetchErr || !ingredient) {
    throw new Error('Insumo no encontrado.')
  }

  // Calcular nuevo stock y costo
  let stockDelta = quantity
  let effectiveUnitCost = ingredient.cost_per_unit
  let newCostPerUnit = ingredient.cost_per_unit

  if (type === 'waste') {
    stockDelta = -quantity // Las mermas restan
  } else if (type === 'adjustment') {
    // Si es ajuste, podemos indicar la diferencia directamente
    stockDelta = -quantity
  } else if (type === 'purchase') {
    // Es una entrada/compra: calcular costo unitario efectivo de esta compra
    const parsedUnitCost = purchaseUnitCostRaw !== null && purchaseUnitCostRaw !== '' ? parseFloat(purchaseUnitCostRaw) : NaN
    const parsedTotalCost = purchaseTotalCostRaw !== null && purchaseTotalCostRaw !== '' ? parseFloat(purchaseTotalCostRaw) : NaN

    if (!isNaN(parsedUnitCost) && parsedUnitCost >= 0) {
      effectiveUnitCost = parsedUnitCost
    } else if (!isNaN(parsedTotalCost) && parsedTotalCost >= 0 && quantity > 0) {
      effectiveUnitCost = Number((parsedTotalCost / quantity).toFixed(6))
    }

    // Calcular costo promedio ponderado (PMP)
    newCostPerUnit = calculateWeightedAverageCost(
      ingredient.current_stock,
      ingredient.cost_per_unit,
      quantity,
      effectiveUnitCost
    )
  }

  const newStock = Math.max(0, ingredient.current_stock + stockDelta)

  // Extraer proveedor si es compra a crédito
  const is_credit = type === 'purchase' && formData.get('is_credit') === 'true'
  const supplier_id = (formData.get('supplier_id') as string) || null

  // Actualizar tabla ingredients
  await supabase
    .from('ingredients')
    .update({
      current_stock: newStock,
      cost_per_unit: newCostPerUnit,
      ...(is_credit && supplier_id && !ingredient.supplier_id ? { supplier_id } : {}),
    })
    .eq('id', ingredient_id)

  // Registrar trazabilidad en inventory_movements
  await supabase.from('inventory_movements').insert({
    ingredient_id,
    type,
    quantity: stockDelta,
    unit_cost: effectiveUnitCost,
    reason: reason || (type === 'waste' ? 'Merma registrada' : 'Entrada de mercancía'),
  })

  // Si es compra a crédito con un proveedor, registrar cuenta por pagar en Finanzas
  if (type === 'purchase') {
    const is_credit = formData.get('is_credit') === 'true'
    const supplier_id = (formData.get('supplier_id') as string) || null
    const invoice_number = sanitizeText(formData.get('invoice_number') as string) || null
    const due_date = (formData.get('due_date') as string) || null
    const credit_notes = sanitizeText(formData.get('credit_notes') as string) || null

    if (is_credit && supplier_id) {
      const parsedTotal = purchaseTotalCostRaw !== null && purchaseTotalCostRaw !== '' ? parseFloat(purchaseTotalCostRaw) : NaN
      const totalBillAmount = !isNaN(parsedTotal) && parsedTotal > 0
        ? parsedTotal
        : Number((quantity * effectiveUnitCost).toFixed(2))

      if (totalBillAmount > 0) {
        const computedDueDate = due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
        await supabase.from('bills_payable').insert({
          supplier_id,
          invoice_number,
          amount: totalBillAmount,
          due_date: computedDueDate,
          status: 'pending',
          notes: credit_notes || `Carga de insumo a crédito: ${ingredient.name} (${quantity} ${ingredient.unit || 'u'})`,
        })
        revalidatePath('/finances')
      }
    }
  }

  revalidatePath('/inventory')
  return { success: true }
}
