import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { PosDashboardView } from '@/components/pos/pos-dashboard-view'
import { ActiveOrder, ActiveOrderItem } from '@/components/pos/active-orders-list'

export const dynamic = 'force-dynamic'

export default async function PosPage() {
  const supabase = await createClient()

  // 1. Obtener recetas, mesas, órdenes, ítems y clientes
  const [
    { data: recipesData },
    { data: tablesData },
    { data: ordersData },
    { data: orderItemsData },
    { data: profilesData }
  ] = await Promise.all([
    supabase.from('recipes').select('*').order('name', { ascending: true }),
    supabase.from('restaurant_tables').select('*').order('number', { ascending: true }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('order_items').select('*'),
    supabase.from('profiles').select('*').order('full_name', { ascending: true })
  ])

  const customers = (profilesData || []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    phone: p.phone,
    current_debt: p.current_debt,
    credit_limit: p.credit_limit,
  }))

  const recipes = (recipesData || []).map((r) => ({
    id: r.id,
    name: r.name || 'Sin nombre',
    price: r.price || 0,
    category: r.category || 'General',
    type: r.type || 'final_product',
  }))

  const tables = (tablesData || []).map((t) => ({
    id: t.id,
    number: t.number,
    name: t.name,
    status: t.status || 'available',
  }))

  const recipesMap = new Map<string, string>()
  for (const r of recipesData || []) {
    recipesMap.set(r.id, r.name || 'Plato')
  }

  const tablesMap = new Map<string, { number: string; name: string | null }>()
  for (const t of tablesData || []) {
    tablesMap.set(t.id, { number: t.number, name: t.name })
  }

  // Agrupar items por order_id
  const itemsByOrder = new Map<string, ActiveOrderItem[]>()
  for (const it of orderItemsData || []) {
    const list = itemsByOrder.get(it.order_id) || []
    list.push({
      id: it.id,
      recipe_name: recipesMap.get(it.recipe_id) || 'Plato',
      quantity: it.quantity,
      unit_price: it.unit_price,
      notes: it.notes || null,
    })
    itemsByOrder.set(it.order_id, list)
  }

  // Mapear todas las órdenes
  const allOrders: ActiveOrder[] = (ordersData || []).map((ord) => {
    const tbl = ord.table_id ? tablesMap.get(ord.table_id) : null
    return {
      id: ord.id,
      created_at: ord.created_at,
      type: ord.type || 'dine_in',
      status: ord.status,
      payment_status: ord.payment_status,
      kitchen_status: ord.kitchen_status,
      customer_name: ord.customer_name,
      table_number: tbl?.number || null,
      table_name: tbl?.name || null,
      notes: ord.notes || null,
      total: ord.total || 0,
      items: itemsByOrder.get(ord.id) || [],
    }
  })

  // Activas: no canceladas y no despachadas completamente con pago
  const activeOrders = allOrders.filter(
    (o) => o.status !== 'cancelled' && (o.payment_status === 'pending' || o.kitchen_status !== 'delivered')
  )

  const todayOrders = allOrders

  return (
    <AdminShell>
      <Navbar
        title="Tomar Pedidos y Ventas"
        description="Cobra órdenes, comanda a cocina y atiende mesas o pedidos para llevar"
      />

      <main className="p-6 max-w-7xl">
        <PosDashboardView
          recipes={recipes}
          tables={tables}
          customers={customers}
          activeOrders={activeOrders}
          todayOrders={todayOrders}
        />
      </main>
    </AdminShell>
  )
}
