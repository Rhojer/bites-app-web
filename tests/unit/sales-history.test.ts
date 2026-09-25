import { describe, it, expect } from 'vitest'
import {
  formatCustomerDisplay,
  formatSaleTime,
  formatSaleDateHeader,
  groupSalesByDay,
  calculateSalesMetrics,
  filterSales,
  SaleRecord,
} from '@/lib/domain/sales'

describe('Sales History Domain Logic', () => {
  describe('formatCustomerDisplay', () => {
    it('debe identificar clientes con nombre propio', () => {
      const res = formatCustomerDisplay('María González', 'dine_in', '4')
      expect(res.isGuest).toBe(false)
      expect(res.displayName).toBe('María González')
    })

    it('debe asignar "Invitado" a ventas sin cliente o con texto vacío', () => {
      expect(formatCustomerDisplay('', 'takeaway').isGuest).toBe(true)
      expect(formatCustomerDisplay('', 'takeaway').displayName).toBe('Invitado')
      expect(formatCustomerDisplay(null, 'dine_in').displayName).toBe('Invitado')
    })

    it('debe tratar marcadores genéricos como "Invitado"', () => {
      expect(formatCustomerDisplay('Cliente Mostrador').isGuest).toBe(true)
      expect(formatCustomerDisplay('Cliente Salón').isGuest).toBe(true)
      expect(formatCustomerDisplay('Mesa Salón').isGuest).toBe(true)
      expect(formatCustomerDisplay('Mesa 3').isGuest).toBe(true)
      expect(formatCustomerDisplay('Para Llevar').isGuest).toBe(true)
    })
  })

  describe('formatSaleTime', () => {
    it('debe formatear la hora en formato 12 horas con AM o PM', () => {
      const time = formatSaleTime('2026-09-25T14:35:00.000Z')
      expect(time).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
    })
  })

  describe('groupSalesByDay', () => {
    const fixedNow = new Date('2026-09-25T12:00:00.000Z')

    const mockSales: SaleRecord[] = [
      {
        id: 'ord-1',
        created_at: '2026-09-25T10:00:00.000Z',
        type: 'dine_in',
        status: 'completed',
        payment_status: 'paid',
        kitchen_status: 'delivered',
        customer_name: 'Carlos Pérez',
        total: 50,
        subtotal: 50,
        items: [],
      },
      {
        id: 'ord-2',
        created_at: '2026-09-25T15:30:00.000Z',
        type: 'takeaway',
        status: 'completed',
        payment_status: 'paid',
        kitchen_status: 'delivered',
        customer_name: 'Cliente Mostrador',
        total: 25,
        subtotal: 25,
        items: [],
      },
      {
        id: 'ord-3',
        created_at: '2026-09-24T18:00:00.000Z',
        type: 'delivery',
        status: 'completed',
        payment_status: 'paid',
        kitchen_status: 'delivered',
        customer_name: 'Ana Rivas',
        total: 40,
        subtotal: 40,
        items: [],
      },
    ]

    it('debe agrupar las ventas correctamente por fecha y calcular totales por día', () => {
      const groups = groupSalesByDay(mockSales, fixedNow)
      expect(groups.length).toBe(2)

      // Primer grupo (día 25)
      expect(groups[0].totalOrders).toBe(2)
      expect(groups[0].totalAmount).toBe(75)

      // Segundo grupo (día 24)
      expect(groups[1].totalOrders).toBe(1)
      expect(groups[1].totalAmount).toBe(40)
    })
  })

  describe('calculateSalesMetrics', () => {
    const mockSales: SaleRecord[] = [
      {
        id: '1',
        created_at: '2026-09-25T10:00:00.000Z',
        type: 'dine_in',
        status: 'completed',
        payment_status: 'paid',
        kitchen_status: 'delivered',
        customer_name: 'Carlos Pérez',
        total: 60,
        subtotal: 60,
        items: [],
      },
      {
        id: '2',
        created_at: '2026-09-25T11:00:00.000Z',
        type: 'takeaway',
        status: 'completed',
        payment_status: 'paid',
        kitchen_status: 'delivered',
        customer_name: null,
        total: 40,
        subtotal: 40,
        items: [],
      },
    ]

    it('debe calcular ingresos totales, ticket promedio y conteo de clientes vs invitados', () => {
      const metrics = calculateSalesMetrics(mockSales)
      expect(metrics.totalRevenue).toBe(100)
      expect(metrics.totalOrders).toBe(2)
      expect(metrics.averageTicket).toBe(50)
      expect(metrics.namedCustomersCount).toBe(1)
      expect(metrics.guestCustomersCount).toBe(1)
    })
  })

  describe('filterSales', () => {
    const mockSales: SaleRecord[] = [
      {
        id: 'ord-abc-1',
        created_at: '2026-09-25T10:00:00.000Z',
        type: 'dine_in',
        status: 'completed',
        payment_status: 'paid',
        kitchen_status: 'delivered',
        customer_name: 'Elena Rojas',
        total: 30,
        subtotal: 30,
        items: [{ id: 'i1', recipe_id: 'r1', recipe_name: 'Hamburguesa Doble', quantity: 1, unit_price: 30, subtotal: 30 }],
      },
      {
        id: 'ord-xyz-2',
        created_at: '2026-09-25T12:00:00.000Z',
        type: 'takeaway',
        status: 'completed',
        payment_status: 'credit',
        kitchen_status: 'delivered',
        customer_name: 'Cliente Mostrador',
        total: 15,
        subtotal: 15,
        items: [{ id: 'i2', recipe_id: 'r2', recipe_name: 'Papas Fritas', quantity: 1, unit_price: 15, subtotal: 15 }],
      },
    ]

    it('debe filtrar por texto de plato consumido', () => {
      const res = filterSales(mockSales, { searchTerm: 'hamburguesa' })
      expect(res.length).toBe(1)
      expect(res[0].id).toBe('ord-abc-1')
    })

    it('debe filtrar por estado de pago (crédito)', () => {
      const res = filterSales(mockSales, { paymentStatus: 'credit' })
      expect(res.length).toBe(1)
      expect(res[0].id).toBe('ord-xyz-2')
    })

    it('debe filtrar por tipo de pedido', () => {
      const res = filterSales(mockSales, { orderType: 'dine_in' })
      expect(res.length).toBe(1)
      expect(res[0].customer_name).toBe('Elena Rojas')
    })
  })
})
