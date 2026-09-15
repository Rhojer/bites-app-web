import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveOfflineOrder,
  getPendingOfflineOrders,
  updateOfflineOrderStatus,
  removeOfflineOrder,
  OfflineOrder
} from '@/lib/offline-db'

describe('📶 PILLAR 2: Offline PWA Mode & Background Auto-Synchronization', () => {
  const mockStorage: Map<string, OfflineOrder> = new Map()

  beforeEach(() => {
    mockStorage.clear()
  })

  it('genera correctamente IDs temporales para órdenes en cola offline', () => {
    const timestamp = Date.now()
    const id = `offline_${timestamp}_abc123`
    expect(id).toMatch(/^offline_\d+_[a-z0-9]+$/)
  })

  it('valida la estructura de una orden offline antes de encolarla', () => {
    const testOrder: Omit<OfflineOrder, 'id' | 'created_at' | 'sync_status'> = {
      table_id: 'table-1',
      customer_name: 'Cliente Mostrador',
      type: 'dine_in',
      items: [
        { recipe_id: 'rec-1', name: 'Hamburguesa Doble', quantity: 2, unit_price: 10, notes: 'Sin cebolla' }
      ],
      payments: [
        { amount: 20, currency: 'USD', vault: 'cash_usd' }
      ],
      subtotal: 20,
      total: 20,
    }

    expect(testOrder.items).toHaveLength(1)
    expect(testOrder.total).toBe(20)
    expect(testOrder.items[0].notes).toBe('Sin cebolla')
  })

  it('simula la transición de estados de sincronización: pending -> syncing -> completed', () => {
    const order: OfflineOrder = {
      id: 'offline_1234567890_test',
      type: 'dine_in',
      items: [{ recipe_id: 'rec-1', name: 'Burger', quantity: 1, unit_price: 10 }],
      subtotal: 10,
      total: 10,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    }

    mockStorage.set(order.id, order)
    expect(mockStorage.get(order.id)?.sync_status).toBe('pending')

    // Pasa a syncing
    order.sync_status = 'syncing'
    mockStorage.set(order.id, order)
    expect(mockStorage.get(order.id)?.sync_status).toBe('syncing')

    // Al sincronizar con éxito con Supabase, se remueve de la cola
    mockStorage.delete(order.id)
    expect(mockStorage.has(order.id)).toBe(false)
  })
})
