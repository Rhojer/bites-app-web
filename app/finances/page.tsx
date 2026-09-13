import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PLStatement, PLData } from '@/components/finances/pl-statement'
import { BillsPayableTable, BillItem } from '@/components/finances/bills-payable-table'
import { CreateBillDialog } from '@/components/finances/create-bill-dialog'
import { CreateExpenseDialog } from '@/components/finances/create-expense-dialog'
import { PaymentReconciliation, PaymentMethodItem, PaymentTransaction } from '@/components/finances/payment-reconciliation'
import { ExpensesTable, ExpenseItem } from '@/components/finances/expenses-table'
import { SavingsTargetsCard } from '@/components/finances/savings-targets-card'
import { TrendingDown, FileText, CreditCard, FileSpreadsheet, Plus } from 'lucide-react'

export default async function FinancesPage() {
  const supabase = await createClient()

  // 1. Consultar todos los datos financieros en paralelo
  const [
    { data: ordersData },
    { data: orderItemsData },
    { data: recipesData },
    { data: ingredientsData },
    { data: recipeIngredientsData },
    { data: inventoryMovementsData },
    { data: expensesData },
    { data: billsData },
    { data: suppliersData },
    { data: paymentsData },
    { data: paymentMethodsData },
  ] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('order_items').select('*'),
    supabase.from('recipes').select('id, name, cost_per_unit, price'),
    supabase.from('ingredients').select('id, name, cost_per_unit, current_stock'),
    supabase.from('recipe_ingredients').select('*'),
    supabase.from('inventory_movements').select('*'),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
    supabase.from('bills_payable').select('*, supplier:suppliers(*)').order('due_date', { ascending: true }),
    supabase.from('suppliers').select('*').order('name', { ascending: true }),
    supabase.from('order_payments').select('*').order('created_at', { ascending: false }),
    supabase.from('payment_methods').select('*').order('name', { ascending: true }),
  ])

  const orders = ordersData || []
  const orderItems = orderItemsData || []
  const recipes = recipesData || []
  const ingredients = ingredientsData || []
  const recipeIngredients = recipeIngredientsData || []
  const movements = inventoryMovementsData || []
  const expenses = (expensesData || []) as ExpenseItem[]
  const bills = (billsData || []) as unknown as BillItem[]
  const suppliers = suppliersData || []
  const rawPayments = paymentsData || []
  const paymentMethods = (paymentMethodsData || []) as PaymentMethodItem[]

  // ==========================================
  // CÁLCULOS PARA ESTADO DE P&L
  // ==========================================

  // 1. Ingresos por ventas
  // Calculamos la suma total de órdenes
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0)

  // 2. Costo de insumos (Food Cost de recetas vendidas)
  let salesFoodCost = 0
  if (orderItems.length > 0) {
    for (const item of orderItems) {
      const recipe = recipes.find((r) => r.id === item.recipe_id)
      let unitCost = recipe?.cost_per_unit || 0

      // Si la receta no tiene cost_per_unit directo, calcularlo a partir de sus ingredientes
      if (!unitCost && item.recipe_id) {
        const itemRecipeIngs = recipeIngredients.filter((ri) => ri.recipe_id === item.recipe_id)
        unitCost = itemRecipeIngs.reduce((acc, curr) => {
          const ing = ingredients.find((i) => i.id === curr.ingredient_id)
          return acc + (ing ? ing.cost_per_unit * curr.quantity : 0)
        }, 0)
      }

      salesFoodCost += (unitCost || 0) * (item.quantity || 1)
    }
  } else {
    // Si no hay order items, verificar deducciones de venta en movimientos de inventario
    const saleDeductions = movements.filter((m) => m.type === 'sale_deduction')
    salesFoodCost = saleDeductions.reduce((acc, curr) => acc + Math.abs(curr.quantity) * (curr.unit_cost || 0), 0)
  }

  // 3. Costo de Mermas / Desperdicios
  const wasteMovements = movements.filter((m) => m.type === 'waste')
  const wasteCost = wasteMovements.reduce((acc, curr) => acc + Math.abs(curr.quantity) * (curr.unit_cost || 0), 0)

  // Costo total de alimentos
  const totalFoodCost = salesFoodCost + wasteCost

  // 4. Utilidad Bruta
  const grossProfit = totalRevenue - totalFoodCost
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // 5. Gastos Operativos (Fijos vs Variables)
  const fixedExpenses = expenses.filter((e) => e.type === 'fixed').reduce((acc, curr) => acc + curr.amount, 0)
  const variableExpenses = expenses.filter((e) => e.type !== 'fixed').reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpenses = fixedExpenses + variableExpenses

  // 6. Conciliación y Comisiones Bancarias
  const methodMap = new Map<string, PaymentMethodItem>()
  paymentMethods.forEach((pm) => methodMap.set(pm.id, pm))

  let bankCommissions = 0
  const enrichedPayments: PaymentTransaction[] = rawPayments.map((p) => {
    const method = methodMap.get(p.payment_method_id)
    const commPct = method?.commission_percentage || 0
    const commFixed = method?.commission_fixed || 0
    const commission = (p.amount * commPct) / 100 + commFixed
    bankCommissions += commission

    return {
      ...p,
      methodName: method?.name || 'Método POS',
      commission_percentage: commPct,
      commission_fixed: commFixed,
    }
  })

  // 7. Utilidad Neta Real
  const netProfit = grossProfit - totalExpenses - bankCommissions
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const plData: PLData = {
    totalRevenue,
    foodCost: salesFoodCost,
    wasteCost,
    totalFoodCost,
    grossProfit,
    grossMarginPct,
    fixedExpenses,
    variableExpenses,
    totalExpenses,
    bankCommissions,
    netProfit,
    netMarginPct,
    ordersCount: orders.length,
  }

  return (
    <AdminShell>
      <Navbar
        title="Ganancias y Finanzas"
        description="Ingresos por ventas, cuentas por pagar a proveedores y ganancias netas del negocio"
        actions={
          <div className="flex items-center gap-2">
            <CreateExpenseDialog />
            <CreateBillDialog suppliers={suppliers} />
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* Metas Financieras & Objetivos de Ahorro (Savings Targets) */}
        <SavingsTargetsCard
          currentSales={totalRevenue}
          pendingBillsAmount={bills.filter((b) => b.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0)}
          currentFoodCostPct={totalRevenue > 0 ? (totalFoodCost / totalRevenue) * 100 : 28.5}
        />

        <Tabs defaultValue="pl" className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="pl" className="gap-1.5 text-xs">
              <TrendingDown className="size-3.5" />
              <span>Estado P&L</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="gap-1.5 text-xs">
              <FileText className="size-3.5" />
              <span>Cuentas por Pagar</span>
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="gap-1.5 text-xs">
              <CreditCard className="size-3.5" />
              <span>Conciliación POS</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 text-xs">
              <FileSpreadsheet className="size-3.5" />
              <span>Gastos Opex</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ESTADO DE PÉRDIDAS Y GANANCIAS */}
          <TabsContent value="pl" className="space-y-6">
            <PLStatement data={plData} />
          </TabsContent>

          {/* TAB 2: GESTIÓN DE CUENTAS POR PAGAR (BILLS PAYABLE) */}
          <TabsContent value="bills" className="space-y-6">
            <BillsPayableTable bills={bills} />
          </TabsContent>

          {/* TAB 3: CONCILIACIÓN DE MÉTODOS DE PAGO */}
          <TabsContent value="reconciliation" className="space-y-6">
            <PaymentReconciliation
              paymentMethods={paymentMethods}
              payments={enrichedPayments}
            />
          </TabsContent>

          {/* TAB 4: HISTORIAL DE GASTOS OPERATIVOS */}
          <TabsContent value="expenses" className="space-y-6">
            <ExpensesTable expenses={expenses} />
          </TabsContent>
        </Tabs>
      </main>
    </AdminShell>
  )
}
