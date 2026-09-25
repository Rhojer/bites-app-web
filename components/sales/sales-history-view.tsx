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
      <div className="p-3 sm:p-4 rounded-2xl bg-card border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, cliente, plato, mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/20 text-xs sm:text-sm"
            />
          </div>

          {/* Rango de Fechas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            <Button
              type="button"
              variant={dateRange === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('today')}
              className="rounded-xl text-xs font-semibold h-9 px-3 shrink-0"
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant={dateRange === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7days')}
              className="rounded-xl text-xs font-semibold h-9 px-3 shrink-0"
            >
              7 Días
            </Button>
            <Button
              type="button"
              variant={dateRange === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30days')}
              className="rounded-xl text-xs font-semibold h-9 px-3 shrink-0"
            >
              30 Días
            </Button>
            <Button
              type="button"
              variant={dateRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('all')}
              className="rounded-xl text-xs font-semibold h-9 px-3 shrink-0"
            >
              Todo
            </Button>
          </div>
        </div>

        {/* Filtros Secundarios: Tipo de Servicio y Estado de Pago */}
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
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'dine_in'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              🍽️ Salón
            </button>
            <button
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'takeaway'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              🛍️ Llevar
            </button>
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                orderType === 'delivery'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
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
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('paid')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Pagados
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('credit')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                paymentStatus === 'credit'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
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
              <div key={group.dateKey} className="space-y-2">
                {/* Encabezado del Día */}
                <div className="flex items-center justify-between px-1 sm:px-2 gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="size-6 sm:size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Calendar className="size-3.5" />
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                      {group.dateLabel}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      {group.totalOrders} {group.totalOrders === 1 ? 'venta' : 'ventas'}
                    </Badge>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm sm:text-base text-primary block leading-tight">
                      ${group.totalAmount.toFixed(2)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {formatBs(dayTotalBs)}
                    </span>
                  </div>
                </div>

                {/* Tarjetas de Ventas de ese Día */}
                <div className="grid grid-cols-1 gap-2">
                  {group.sales.map((sale) => {
                    const customerInfo = formatCustomerDisplay(sale.customer_name, sale.type, sale.table_number)
                    const time = formatSaleTime(sale.created_at)
                    const saleBs = convertUsdToBs(sale.total, bcvRate)
                    const totalDishes = sale.items.reduce((acc, i) => acc + i.quantity, 0)

                    return (
                      <button
                        key={sale.id}
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="w-full text-left p-3 sm:p-4 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-2.5 sm:gap-4 group active:scale-[0.99]"
                      >
                        {/* Lado Izquierdo: Hora, Tipo, ID y Cliente */}
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                          {/* Hora y Conteo */}
                          <div className="flex flex-col items-center justify-center size-10 sm:size-12 rounded-xl bg-muted/30 border shrink-0">
                            <span className="font-mono font-extrabold text-[11px] sm:text-xs text-foreground leading-tight">
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

                            {/* Cliente o Invitado */}
                            <div className="flex items-center gap-1.5 text-xs truncate">
                              <span
                                className={`flex items-center gap-1 font-semibold truncate ${
                                  customerInfo.isGuest
                                    ? 'text-muted-foreground'
                                    : 'text-foreground font-bold'
                                }`}
                              >
                                <User className="size-3 shrink-0" />
                                <span className="truncate">{customerInfo.displayName}</span>
                              </span>

                              <span className="text-muted-foreground/60 shrink-0">•</span>

                              <span className="text-muted-foreground truncate text-[11px] shrink-0">
                                {totalDishes} {totalDishes === 1 ? 'plato' : 'platos'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lado Derecho: Monto Consumido y Flecha */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-black text-sm sm:text-lg text-primary block leading-tight">
                              ${sale.total.toFixed(2)}
                            </span>
                            <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground block">
                              {formatBs(saleBs)}
                            </span>
                          </div>

                          <div className="size-7 sm:size-8 rounded-full bg-muted/40 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors shrink-0">
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
