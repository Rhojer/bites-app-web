import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { SalesHistoryView } from '@/components/sales/sales-history-view'
import { SaleRecord, SaleItem, SalePayment } from '@/lib/domain/sales'

export const dynamic = 'force-dynamic'

export default async function SalesHistoryPage() {
  const supabase = await createClient()

  // 1. Consultar órdenes, items, recetas, mesas y pagos en paralelo
  const [
    { data: ordersData },
    { data: orderItemsData },
    { data: recipesData },
    { data: tablesData },
    { data: paymentsData },
    { data: paymentMethodsData },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('order_items').select('*'),
    supabase.from('recipes').select('id, name'),
    supabase.from('restaurant_tables').select('id, number, name'),
    supabase.from('order_payments').select('*').order('created_at', { ascending: false }),
    supabase.from('payment_methods').select('id, name'),
  ])

  // 2. Mapeos auxiliares para resolución rápida
  const recipesMap = new Map<string, string>()
  for (const r of recipesData || []) {
    recipesMap.set(r.id, r.name || 'Plato')
  }

  const tablesMap = new Map<string, { number: string; name: string | null }>()
  for (const t of tablesData || []) {
    tablesMap.set(t.id, { number: t.number, name: t.name })
  }

  const methodsMap = new Map<string, string>()
  for (const m of paymentMethodsData || []) {
    methodsMap.set(m.id, m.name || 'Método de Pago')
  }

  // 3. Agrupar items por orden
  const itemsByOrder = new Map<string, SaleItem[]>()
  for (const it of orderItemsData || []) {
    const list = itemsByOrder.get(it.order_id) || []
    list.push({
      id: it.id,
      recipe_id: it.recipe_id,
      recipe_name: recipesMap.get(it.recipe_id) || 'Plato',
      quantity: it.quantity,
      unit_price: it.unit_price,
      subtotal: it.subtotal || it.quantity * it.unit_price,
      notes: it.notes || null,
    })
    itemsByOrder.set(it.order_id, list)
  }

  // 4. Agrupar pagos por orden
  const paymentsByOrder = new Map<string, SalePayment[]>()
  for (const p of paymentsData || []) {
    const list = paymentsByOrder.get(p.order_id) || []
    list.push({
      id: p.id,
      method_name: methodsMap.get(p.payment_method_id) || 'Pago',
      amount: p.amount,
      reference_number: p.reference_number || null,
    })
    paymentsByOrder.set(p.order_id, list)
  }

  // 5. Ensamblar lista de registros de venta
  const sales: SaleRecord[] = (ordersData || []).map((ord) => {
    const tbl = ord.table_id ? tablesMap.get(ord.table_id) : null
    return {
      id: ord.id,
      created_at: ord.created_at,
      type: (ord.type as 'dine_in' | 'takeaway' | 'delivery') || 'dine_in',
      status: ord.status || 'completed',
      payment_status: (ord.payment_status as 'paid' | 'credit' | 'pending') || 'paid',
      kitchen_status: ord.kitchen_status || 'delivered',
      customer_name: ord.customer_name || null,
      table_number: tbl?.number || null,
      table_name: tbl?.name || null,
      notes: ord.notes || null,
      subtotal: ord.subtotal || ord.total || 0,
      total: ord.total || 0,
      items: itemsByOrder.get(ord.id) || [],
      payments: paymentsByOrder.get(ord.id) || [],
    }
  })

  // 6. Obtener tasa BCV
  let bcvRate = 813.74
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    // En el servidor podemos consultar una tasa fallback o la API si está disponible
  } catch {}

  return (
    <AdminShell>
      <Navbar
        title="Historial de Ventas"
        description="Consulta todas las comandas cerradas agrupadas por día, montos y desglose de platos"
      />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <SalesHistoryView initialSales={sales} bcvRate={bcvRate} />
      </main>
    </AdminShell>
  )
}
