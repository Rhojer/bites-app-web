'use client'

import { useState } from 'react'
import {
  Search,
  Calendar,
  Receipt,
  ChevronRight,
  Filter,
  User
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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
    <div className="space-y-4 sm:space-y-5">
      {/* ========================================================= */}
      {/* BARRA DE FILTROS Y BÚSQUEDA                               */}
      {/* ========================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-card border shadow-2xs space-y-3">
        {/* Búsqueda + Rango de Fechas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por comanda (#A1), cliente, plato o mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/20 text-xs sm:text-sm"
            />
          </div>

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
        </div>

        {/* Filtros de Tipo de Servicio y Estado de Pago */}
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
        <div className="p-12 text-center rounded-2xl border bg-card/60 space-y-3 shadow-2xs">
          <Receipt className="size-10 text-muted-foreground/30 mx-auto" />
          <h3 className="font-bold text-base text-foreground">No se encontraron ventas</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || dateRange !== 'all' || orderType !== 'all' || paymentStatus !== 'all'
              ? 'Prueba modificando los filtros o el término de búsqueda.'
              : 'Aún no se han registrado ventas finalizadas en el sistema.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {dayGroups.map((group) => {
            const dayTotalBs = convertUsdToBs(group.totalAmount, bcvRate)
            return (
              <div key={group.dateKey} className="space-y-2">
                {/* Encabezado del Día */}
                <div className="flex items-center justify-between px-2 sm:px-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Calendar className="size-3.5" />
                    </span>
                    <h3 className="font-bold text-foreground text-xs sm:text-sm truncate">
                      {group.dateLabel}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground shrink-0 py-0 h-5">
                      {group.totalOrders} {group.totalOrders === 1 ? 'venta' : 'ventas'}
                    </Badge>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                      Total: ${group.totalAmount.toFixed(2)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground ml-1.5 hidden sm:inline">
                      ({formatBs(dayTotalBs)})
                    </span>
                  </div>
                </div>

                {/* Contenedor Unificado del Día (Menos cargado visualmente) */}
                <div className="rounded-2xl border bg-card divide-y overflow-hidden shadow-2xs">
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
                        className="w-full text-left p-3 sm:p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 group active:bg-muted/50"
                      >
                        {/* Lado Izquierdo: Hora, Tipo, ID, Cliente y Platos */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          {/* Hora */}
                          <div className="flex flex-col items-center justify-center size-10 sm:size-11 rounded-xl bg-muted/40 border shrink-0">
                            <span className="font-mono font-bold text-[11px] sm:text-xs text-foreground leading-tight">
                              {time.split(' ')[0]}
                            </span>
                            <span className="font-mono text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold leading-none mt-0.5">
                              {time.split(' ')[1] || ''}
                            </span>
                          </div>

                          {/* Detalles del Pedido */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[11px] sm:text-xs text-muted-foreground shrink-0">
                                #{sale.id.slice(0, 6).toUpperCase()}
                              </span>

                              <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 shrink-0">
                                {sale.type === 'dine_in'
                                  ? `🍽️ Salón ${sale.table_number ? `(Mesa ${sale.table_number})` : ''}`
                                  : sale.type === 'takeaway'
                                  ? '🛍️ Llevar'
                                  : '🛵 Delivery'}
                              </Badge>

                              {sale.payment_status === 'credit' ? (
                                <Badge className="bg-indigo-600 text-white text-[10px] font-bold py-0 h-5 shrink-0">
                                  Crédito
                                </Badge>
                              ) : sale.payment_status === 'pending' ? (
                                <Badge className="bg-amber-500 text-black text-[10px] font-bold py-0 h-5 shrink-0">
                                  Por Cobrar
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold py-0 h-5 shrink-0">
                                  Pagado
                                </Badge>
                              )}
                            </div>

                            {/* Cliente y Resumen de Platos en una línea limpia */}
                            <div className="flex items-center gap-1.5 text-xs truncate">
                              <span
                                className={`flex items-center gap-1 shrink-0 ${
                                  customerInfo.isGuest
                                    ? 'text-muted-foreground font-medium'
                                    : 'text-foreground font-bold'
                                }`}
                              >
                                <User className="size-3 shrink-0" />
                                <span>{customerInfo.displayName}</span>
                              </span>

                              <span className="text-muted-foreground/40 shrink-0">•</span>

                              <span className="text-muted-foreground truncate text-[11px]">
                                {totalDishes} {totalDishes === 1 ? 'plato' : 'platos'}
                                {dishesSummary ? ` (${dishesSummary})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lado Derecho: Monto Dual y Flecha */}
                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-black text-sm sm:text-base text-foreground block leading-tight">
                              ${sale.total.toFixed(2)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground block">
                              {formatBs(saleBs)}
                            </span>
                          </div>

                          <div className="size-7 sm:size-8 rounded-full bg-muted/30 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors shrink-0">
                            <ChevronRight className="size-3.5 sm:size-4" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
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
