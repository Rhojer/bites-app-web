/**
 * Motor de Sincronización Automática en Segundo Plano (Offline Sync Engine)
 */

import {
  getPendingOfflineOrders,
  updateOfflineOrderStatus,
  removeOfflineOrder,
  OfflineOrder
} from './offline-db'
import { processOrderAction } from '@/app/pos/actions'

export type SyncState = 'online' | 'offline' | 'syncing'

export type SyncListener = (state: {
  networkStatus: SyncState
  pendingCount: number
  isSyncing: boolean
}) => void

class OfflineSyncEngine {
  private listeners: Set<SyncListener> = new Set()
  private isSyncing = false
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      // Intentar sincronizar al inicio si estamos online
      setTimeout(() => this.syncPendingOrders(), 2000)
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    this.notify()
    return () => {
      this.listeners.delete(listener)
    }
  }

  private async notify() {
    const pendingOrders = await getPendingOfflineOrders()
    const status: SyncState = this.isSyncing ? 'syncing' : this.isOnline ? 'online' : 'offline'
    for (const listener of this.listeners) {
      listener({
        networkStatus: status,
        pendingCount: pendingOrders.length,
        isSyncing: this.isSyncing,
      })
    }
  }

  private handleOnline() {
    this.isOnline = true
    this.notify()
    this.syncPendingOrders()
  }

  private handleOffline() {
    this.isOnline = false
    this.notify()
  }

  /**
   * Procesa y despacha secuencialmente las órdenes acumuladas durante el modo sin conexión.
   */
  public async syncPendingOrders(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0 }
    }

    const pending = await getPendingOfflineOrders()
    if (pending.length === 0) {
      this.notify()
      return { synced: 0, failed: 0 }
    }

    this.isSyncing = true
    this.notify()

    let synced = 0
    let failed = 0

    for (const order of pending) {
      try {
        await updateOfflineOrderStatus(order.id, 'syncing')

        // Despachar al Server Action de Supabase
        await processOrderAction({
          table_id: order.table_id || null,
          customer_id: order.customer_id || null,
          customer_name: order.customer_name || null,
          type: order.type || 'dine_in',
          items: order.items,
          payments: (order.payments || []).map((p) => ({
            payment_method_id: p.payment_method_id || '',
            amount: p.amount,
            reference_number: p.reference_number || null,
            amount_currency: p.amount,
            currency: p.currency || 'USD',
            exchange_rate: p.exchange_rate,
            vault: p.vault || 'cash_usd',
          })),
          discount: 0,
          taxRate: 0,
        })

        // Sincronizada con éxito, remover de la cola local
        await removeOfflineOrder(order.id)
        synced++
      } catch (err: unknown) {
        console.error(`[OfflineSync] Error al sincronizar comanda ${order.id}:`, err)
        await updateOfflineOrderStatus(order.id, 'failed', err instanceof Error ? err.message : 'Error desconocido')
        failed++
      }
    }

    this.isSyncing = false
    this.notify()
    return { synced, failed }
  }
}

export const offlineSyncManager = new OfflineSyncEngine()
