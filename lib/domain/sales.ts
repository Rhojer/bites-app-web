/**
 * Dominio de Historial de Ventas (Pure Business Logic)
 */

export interface SaleItem {
  id: string
  recipe_id: string
  recipe_name: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string | null
}

export interface SalePayment {
  id: string
  method_name: string
  amount: number
  reference_number?: string | null
}

export interface SaleRecord {
  id: string
  created_at: string
  type: 'dine_in' | 'takeaway' | 'delivery'
  status: string
  payment_status: 'paid' | 'credit' | 'pending'
  kitchen_status: string
  customer_name?: string | null
  customer_phone?: string | null
  table_number?: string | null
  table_name?: string | null
  notes?: string | null
  subtotal: number
  total: number
  items: SaleItem[]
  payments?: SalePayment[]
}

export interface DaySalesGroup {
  dateKey: string // YYYY-MM-DD
  dateLabel: string // "Hoy - 25 de septiembre de 2026"
  totalAmount: number
  totalOrders: number
  sales: SaleRecord[]
}

export interface SalesMetrics {
  totalRevenue: number
  totalOrders: number
  averageTicket: number
  namedCustomersCount: number
  guestCustomersCount: number
}

/**
 * Normaliza y determina cómo mostrar el cliente según los requerimientos:
 * Si tiene nombre explícito no genérico, lo muestra; si no, retorna 'Invitado'.
 */
export function formatCustomerDisplay(
  customerName?: string | null,
  orderType?: string,
  tableNumber?: string | null
): { displayName: string; isGuest: boolean } {
  if (!customerName || !customerName.trim()) {
    return { displayName: 'Invitado', isGuest: true }
  }

  const trimmed = customerName.trim()
  const lower = trimmed.toLowerCase()

  // Nombres genéricos o asignados por defecto
  const genericPlaceholders = [
    'cliente mostrador',
    'cliente salón',
    'cliente salon',
    'mesa salón',
    'mesa salon',
    'cliente',
    'invitado',
    'para llevar',
    'delivery',
    'sin cliente',
  ]

  if (genericPlaceholders.includes(lower) || lower.startsWith('mesa ')) {
    return { displayName: 'Invitado', isGuest: true }
  }

  return { displayName: trimmed, isGuest: false }
}

/**
 * Formatea una fecha ISO a hora local en formato 12 horas (ej: "02:30 PM")
 */
export function formatSaleTime(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    const formatted = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return formatted
      .replace(/a\.\s*m\./i, 'AM')
      .replace(/p\.\s*m\./i, 'PM')
      .trim()
  } catch {
    return '--:--'
  }
}

/**
 * Obtiene la etiqueta del encabezado de día en español
 */
export function formatSaleDateHeader(dateKey: string, now: Date = new Date()): string {
  try {
    const [year, month, day] = dateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    const todayStr = getLocalDateKey(now)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateKey(yesterday)

    const fullFormatted = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Capitalizar primera letra
    const capitalized = fullFormatted.charAt(0).toUpperCase() + fullFormatted.slice(1)

    if (dateKey === todayStr) {
      return `Hoy • ${capitalized}`
    }
    if (dateKey === yesterdayStr) {
      return `Ayer • ${capitalized}`
    }

    return capitalized
  } catch {
    return dateKey
  }
}

/**
 * Retorna fecha en formato YYYY-MM-DD en la zona horaria local
 */
export function getLocalDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Agrupa una lista de ventas cronológicamente por día (descendente)
 */
export function groupSalesByDay(sales: SaleRecord[], now: Date = new Date()): DaySalesGroup[] {
  const groupsMap = new Map<string, SaleRecord[]>()

  // Ordenar primero desc por fecha
  const sorted = [...sales].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  for (const sale of sorted) {
    const d = new Date(sale.created_at)
    const dateKey = getLocalDateKey(d)
    const list = groupsMap.get(dateKey) || []
    list.push(sale)
    groupsMap.set(dateKey, list)
  }

  const result: DaySalesGroup[] = []

  for (const [dateKey, daySales] of groupsMap.entries()) {
    const totalAmount = daySales.reduce((acc, s) => acc + (s.total || 0), 0)
    result.push({
      dateKey,
      dateLabel: formatSaleDateHeader(dateKey, now),
      totalAmount,
      totalOrders: daySales.length,
      sales: daySales,
    })
  }

  return result
}

/**
 * Calcula métricas resumen del historial
 */
export function calculateSalesMetrics(sales: SaleRecord[]): SalesMetrics {
  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)
  const totalOrders = sales.length
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  let namedCustomersCount = 0
  let guestCustomersCount = 0

  for (const s of sales) {
    const info = formatCustomerDisplay(s.customer_name, s.type, s.table_number)
    if (info.isGuest) {
      guestCustomersCount++
    } else {
      namedCustomersCount++
    }
  }

  return {
    totalRevenue,
    totalOrders,
    averageTicket,
    namedCustomersCount,
    guestCustomersCount,
  }
}

/**
 * Filtra ventas por búsqueda, rango de fecha y tipo de pedido
 */
export function filterSales(
  sales: SaleRecord[],
  options: {
    searchTerm?: string
    dateRange?: 'all' | 'today' | '7days' | '30days'
    orderType?: 'all' | 'dine_in' | 'takeaway' | 'delivery'
    paymentStatus?: 'all' | 'paid' | 'credit'
  },
  now: Date = new Date()
): SaleRecord[] {
  const search = (options.searchTerm || '').trim().toLowerCase()
  const dateRange = options.dateRange || 'all'
  const orderType = options.orderType || 'all'
  const paymentStatus = options.paymentStatus || 'all'

  const todayKey = getLocalDateKey(now)
  const nowMs = now.getTime()
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000

  return sales.filter((sale) => {
    // 1. Filtro por tipo de pedido
    if (orderType !== 'all' && sale.type !== orderType) {
      return false
    }

    // 2. Filtro por estado de pago
    if (paymentStatus !== 'all' && sale.payment_status !== paymentStatus) {
      return false
    }

    // 3. Filtro por fecha
    if (dateRange !== 'all') {
      const saleDate = new Date(sale.created_at)
      const saleMs = saleDate.getTime()
      if (dateRange === 'today') {
        if (getLocalDateKey(saleDate) !== todayKey) return false
      } else if (dateRange === '7days') {
        if (saleMs < sevenDaysAgoMs) return false
      } else if (dateRange === '30days') {
        if (saleMs < thirtyDaysAgoMs) return false
      }
    }

    // 4. Búsqueda por texto (ID, cliente, mesa, platos, notas)
    if (search) {
      const matchId = sale.id.toLowerCase().includes(search)
      const customerInfo = formatCustomerDisplay(sale.customer_name, sale.type, sale.table_number)
      const matchCustomer = customerInfo.displayName.toLowerCase().includes(search)
      const matchTable = sale.table_number ? `mesa ${sale.table_number}`.includes(search) : false
      const matchNotes = sale.notes ? sale.notes.toLowerCase().includes(search) : false
      const matchItems = sale.items.some((i) => i.recipe_name.toLowerCase().includes(search))

      return matchId || matchCustomer || matchTable || matchNotes || matchItems
    }

    return true
  })
}
