/**
 * Capa de Base de Datos Local IndexedDB para Modo Sin Conexión (Offline POS)
 */

export interface OfflineOrderItem {
  recipe_id: string
  name: string
  quantity: number
  unit_price: number
  notes?: string
}

export interface OfflinePaymentItem {
  payment_method_id?: string
  payment_method_name?: string
  amount: number
  reference_number?: string | null
  currency?: 'USD' | 'VES'
  exchange_rate?: number
  vault?: 'cash_usd' | 'cash_ves' | 'bank_ves' | 'bank_usd'
}

export interface OfflineOrder {
  id: string // Generado como offline_${timestamp}_${rand}
  table_id?: string | null
  customer_id?: string | null
  customer_name?: string | null
  type?: 'dine_in' | 'takeaway' | 'delivery'
  items: OfflineOrderItem[]
  payments?: OfflinePaymentItem[]
  notes?: string | null
  subtotal: number
  total: number
  created_at: string
  sync_status: 'pending' | 'syncing' | 'failed'
  sync_error?: string | null
}

const DB_NAME = 'bites_offline_db'
const DB_VERSION = 1
const STORE_ORDERS = 'offline_orders'
const STORE_CACHE = 'metadata_cache'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        const orderStore = db.createObjectStore(STORE_ORDERS, { keyPath: 'id' })
        orderStore.createIndex('sync_status', 'sync_status', { unique: false })
        orderStore.createIndex('created_at', 'created_at', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Guarda una orden creada en modo offline en la cola de IndexedDB.
 */
export async function saveOfflineOrder(orderData: Omit<OfflineOrder, 'id' | 'created_at' | 'sync_status'>): Promise<OfflineOrder> {
  const db = await openDB()
  const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const offlineOrder: OfflineOrder = {
    ...orderData,
    id,
    created_at: new Date().toISOString(),
    sync_status: 'pending',
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ORDERS, 'readwrite')
    const store = tx.objectStore(STORE_ORDERS)
    const req = store.add(offlineOrder)

    req.onsuccess = () => resolve(offlineOrder)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Obtiene todas las órdenes pendientes de sincronización.
 */
export async function getPendingOfflineOrders(): Promise<OfflineOrder[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, 'readonly')
      const store = tx.objectStore(STORE_ORDERS)
      const req = store.getAll()

      req.onsuccess = () => {
        const results: OfflineOrder[] = req.result || []
        resolve(results.filter((o) => o.sync_status === 'pending' || o.sync_status === 'failed'))
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

/**
 * Actualiza el estado de sincronización de una orden offline.
 */
export async function updateOfflineOrderStatus(
  id: string,
  status: 'pending' | 'syncing' | 'failed',
  error?: string | null
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ORDERS, 'readwrite')
    const store = tx.objectStore(STORE_ORDERS)
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const item: OfflineOrder = getReq.result
      if (!item) {
        resolve()
        return
      }
      item.sync_status = status
      if (error !== undefined) item.sync_error = error
      const putReq = store.put(item)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

/**
 * Elimina una orden de la cola una vez sincronizada con éxito con Supabase.
 */
export async function removeOfflineOrder(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ORDERS, 'readwrite')
    const store = tx.objectStore(STORE_ORDERS)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/**
 * Guarda metadata en caché local (platos, mesas, clientes) para arranque instantáneo.
 */
export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite')
      const store = tx.objectStore(STORE_CACHE)
      const req = store.put({ key, data, updated_at: new Date().toISOString() })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[OfflineDB] Error al guardar caché:', err)
  }
}

/**
 * Recupera datos cacheados localmente.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly')
      const store = tx.objectStore(STORE_CACHE)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result ? req.result.data : null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}
