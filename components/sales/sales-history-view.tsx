'use client'

import { useState } from 'react'
import {
  Search,
  Calendar,
  Receipt,
  ChevronRight,
  Filter,
  User,
  Clock,
  LayoutGrid,
  List,
  UtensilsCrossed
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  SaleRecord,
  groupSalesByDay,
  filterSales,
  formatCustomerDisplay,
  formatSaleTime
} from '@/lib/domain/sales'
import { formatBs, convertUsdToBs } from '@/lib/bcv'
import { SaleDetailDialog } from '@/components/sales/sale-detail-dialog'

interface SalesHistoryViewProps {
  initialSales: SaleRecord[]
  bcvRate?: number
}

export function SalesHistoryView({
  initialSales,
  bcvRate = 813.74,
}: SalesHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [orderType, setOrderType] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all')
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'paid' | 'credit'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)

  // 1. Filtrar ventas según criterios activos
  const filteredSales = filterSales(initialSales, {
    searchTerm,
    dateRange,
    orderType,
    paymentStatus,
  })

  // 2. Agrupar cronológicamente por día
  const dayGroups = groupSalesByDay(filteredSales)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================= */}
      {/* BARRA DE FILTROS Y BÚSQUEDA EN TIEMPO REAL                */}
      {/* ========================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-card border shadow-xs space-y-3">
        {/* Fila 1: Búsqueda + Filtro de Fechas + Conmutador de Vista */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID (#A1), cliente, plato, mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/20 text-xs sm:text-sm"
            />
          </div>

          {/* Rango de Fechas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                dateRange === 'today'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                dateRange === '7days'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              7 Días
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                dateRange === '30days'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              30 Días
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                dateRange === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Conmutador de Vista (Tarjetas vs Tabla) */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-muted/30 rounded-xl border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="size-4" />
              <span className="hidden md:inline">Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vista en Lista Compacta"
            >
              <List className="size-4" />
              <span className="hidden md:inline">Lista</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Filtros de Tipo y Pago */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2.5 border-t text-xs">
          {/* Tipo de Servicio */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0 mr-1 text-[11px] sm:text-xs">
              <Filter className="size-3" /> Tipo:
            </span>

            <button
              type="button"
              onClick={() => setOrderType('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'dine_in'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              🍽️ Salón
            </button>
            <button
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'takeaway'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              🛍️ Llevar
            </button>
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'delivery'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              🛵 Delivery
            </button>
          </div>

          {/* Estado de Pago */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0 mr-1 text-[11px] sm:text-xs">
              Pago:
            </span>
            <button
              type="button"
              onClick={() => setPaymentStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                paymentStatus === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('paid')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              Pagados
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('credit')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                paymentStatus === 'credit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              A Crédito
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LISTA DE VENTAS AGRUPADAS POR DÍA                         */}
      {/* ========================================================= */}
      {dayGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-card/60 space-y-3">
          <Receipt className="size-10 text-muted-foreground/30 mx-auto" />
          <h3 className="font-bold text-base text-foreground">No se encontraron ventas</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || dateRange !== 'all' || orderType !== 'all' || paymentStatus !== 'all'
              ? 'Prueba modificando los filtros o el término de búsqueda.'
              : 'Aún no se han registrado ventas finalizadas en el sistema.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dayGroups.map((group) => {
            const dayTotalBs = convertUsdToBs(group.totalAmount, bcvRate)
            return (
              <div key={group.dateKey} className="space-y-3">
                {/* Encabezado del Día */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Calendar className="size-4" />
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                      {group.dateLabel}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground shrink-0 bg-background/80">
                      {group.totalOrders} {group.totalOrders === 1 ? 'venta' : 'ventas'}
                    </Badge>
                  </div>

                  <div className="text-left sm:text-right shrink-0 flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Total del día:</span>
                    <span className="font-mono font-black text-sm sm:text-base text-foreground">
                      ${group.totalAmount.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      ({formatBs(dayTotalBs)})
                    </span>
                  </div>
                </div>

                {/* Vista en Tarjetas (Multi-columna adaptable: 1 en móvil, 2 en tablet, 3 en PC) */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.sales.map((sale) => {
                      const customerInfo = formatCustomerDisplay(sale.customer_name, sale.type, sale.table_number)
                      const time = formatSaleTime(sale.created_at)
                      const saleBs = convertUsdToBs(sale.total, bcvRate)
                      const totalDishes = sale.items.reduce((acc, i) => acc + i.quantity, 0)
                      const dishesSummary = sale.items.map((i) => `${i.quantity}x ${i.recipe_name}`).join(', ')

                      return (
                        <button
                          key={sale.id}
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className="w-full text-left p-3.5 sm:p-4 rounded-2xl border bg-card hover:border-primary/60 hover:shadow-xs transition-all duration-150 flex flex-col justify-between gap-3 group active:scale-[0.99]"
                        >
                          {/* Cabecera de la Tarjeta */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/50 border font-mono font-bold text-[11px] text-foreground shrink-0">
                                <Clock className="size-3 text-muted-foreground" />
                                {time}
                              </span>
                              <span className="font-mono font-bold text-xs text-muted-foreground truncate">
                                #{sale.id.slice(0, 6).toUpperCase()}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant="outline" className="text-[10px] font-bold py-0 h-5">
                                {sale.type === 'dine_in'
                                  ? `🍽️ Salón ${sale.table_number ? `(Mesa ${sale.table_number})` : ''}`
                                  : sale.type === 'takeaway'
                                  ? '🛍️ Llevar'
                                  : '🛵 Delivery'}
                              </Badge>

                              {sale.payment_status === 'credit' ? (
                                <Badge className="bg-indigo-600 text-white text-[10px] font-bold py-0 h-5">
                                  Crédito
                                </Badge>
                              ) : sale.payment_status === 'pending' ? (
                                <Badge className="bg-amber-500 text-black text-[10px] font-bold py-0 h-5">
                                  Por Cobrar
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold py-0 h-5">
                                  Pagado
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Cuerpo: Cliente y Platos */}
                          <div className="space-y-1.5 py-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                                  customerInfo.isGuest
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/10 text-primary font-bold'
                                }`}
                              >
                                <User className="size-3.5" />
                              </div>
                              <p
                                className={`text-xs truncate flex-1 ${
                                  customerInfo.isGuest
                                    ? 'text-muted-foreground font-medium'
                                    : 'text-foreground font-bold'
                                }`}
                              >
                                {customerInfo.displayName}
                              </p>
                              <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                {totalDishes} {totalDishes === 1 ? 'plato' : 'platos'}
                              </span>
                            </div>

                            {dishesSummary && (
                              <p className="text-[11px] text-muted-foreground/80 truncate pl-9" title={dishesSummary}>
                                {dishesSummary}
                              </p>
                            )}
                          </div>

                          {/* Pie: Monto y Acción */}
                          <div className="pt-2.5 border-t flex items-center justify-between gap-2 mt-auto">
                            <div>
                              <span className="font-mono font-black text-base sm:text-lg text-foreground block leading-tight">
                                ${sale.total.toFixed(2)}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground block">
                                {formatBs(saleBs)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                              <span>Ver detalle</span>
                              <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  /* Vista en Tabla Compacta */
                  <div className="border rounded-2xl bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Hora</th>
                            <th className="py-2.5 px-3">Comanda</th>
                            <th className="py-2.5 px-3">Servicio</th>
                            <th className="py-2.5 px-3">Cliente</th>
                            <th className="py-2.5 px-3">Platos</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3 text-right">Monto</th>
                            <th className="py-2.5 px-3 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {group.sales.map((sale) => {
                            const customerInfo = formatCustomerDisplay(sale.customer_name, sale.type, sale.table_number)
                            const time = formatSaleTime(sale.created_at)
                            const saleBs = convertUsdToBs(sale.total, bcvRate)
                            const totalDishes = sale.items.reduce((acc, i) => acc + i.quantity, 0)

                            return (
                              <tr
                                key={sale.id}
                                onClick={() => setSelectedSale(sale)}
                                className="hover:bg-muted/30 cursor-pointer transition-colors"
                              >
                                <td className="py-3 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                                  {time}
                                </td>
                                <td className="py-3 px-3 font-mono text-muted-foreground font-semibold whitespace-nowrap">
                                  #{sale.id.slice(0, 6).toUpperCase()}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <Badge variant="outline" className="text-[10px] font-bold">
                                    {sale.type === 'dine_in'
                                      ? `🍽️ Salón ${sale.table_number ? `(Mesa ${sale.table_number})` : ''}`
                                      : sale.type === 'takeaway'
                                      ? '🛍️ Llevar'
                                      : '🛵 Delivery'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span
                                    className={`flex items-center gap-1.5 ${
                                      customerInfo.isGuest ? 'text-muted-foreground' : 'text-foreground font-bold'
                                    }`}
                                  >
                                    <User className="size-3.5 text-muted-foreground" />
                                    <span>{customerInfo.displayName}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                                  {totalDishes} {totalDishes === 1 ? 'plato' : 'platos'}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {sale.payment_status === 'credit' ? (
                                    <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                                      Crédito
                                    </Badge>
                                  ) : sale.payment_status === 'pending' ? (
                                    <Badge className="bg-amber-500 text-black text-[10px] font-bold">
                                      Por Cobrar
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                      Pagado
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <span className="font-mono font-black text-foreground block">
                                    ${sale.total.toFixed(2)}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {formatBs(saleBs)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary/80"
                                  >
                                    Ver ➔
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CON DESGLOSE DETALLADO DE LA VENTA SELECCIONADA      */}
      {/* ========================================================= */}
      <SaleDetailDialog
        sale={selectedSale}
        open={!!selectedSale}
        onOpenChange={(op) => {
          if (!op) setSelectedSale(null)
        }}
        bcvRate={bcvRate}
      />
    </div>
  )
}
