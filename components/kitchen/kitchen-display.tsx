'use client'

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ChefHat,
  Bike,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckSquare,
  Square,
  SlidersHorizontal,
  TrendingUp,
  Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  KitchenOrder,
  KitchenOrderItem,
  KitchenStatus,
  getKitchenOrdersAction,
  updateOrderKitchenStatusAction,
  updateOrderItemKitchenStatusAction,
} from '@/app/kitchen/actions'

interface KitchenDisplayProps {
  initialOrders: KitchenOrder[]
}

// Generador de tono sintetizado para notificaciones de cocina (Web Audio API)
function playKitchenNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25) // D6

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start()
    osc2.start()
    osc1.stop(ctx.currentTime + 0.5)
    osc2.stop(ctx.currentTime + 0.5)
  } catch {
    // Si el usuario no ha interactuado aún con el navegador, el audio se silencia silenciosamente
  }
}

export function KitchenDisplay({ initialOrders }: KitchenDisplayProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [now, setNow] = useState<number>(() => Date.now())
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban')
  const [activeTab, setActiveTab] = useState<'all_active' | 'pending' | 'in_preparation' | 'ready' | 'delivered'>('all_active')
  const [serviceFilter, setServiceFilter] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date())
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  // Actualizar el temporizador en vivo cada segundo para cálculo de tiempo transcurrido
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timerInterval)
  }, [])

  // Sincronización manual / refresco
  const refreshOrders = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true)
    try {
      const freshOrders = await getKitchenOrdersAction()
      setOrders(freshOrders)
      setLastSyncTime(new Date())
    } catch (err) {
      console.error('Error al sincronizar órdenes:', err)
    } finally {
      if (showIndicator) setIsRefreshing(false)
    }
  }, [])

  // Conexión Supabase Realtime + Polling activo de respaldo
  useEffect(() => {
    const supabase = createClient()

    // 1. Suscripción a canal de cambios en tiempo real
    const channel = supabase
      .channel('kds-realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playKitchenNotificationChime()
          }
          refreshOrders(false)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          refreshOrders(false)
        }
      )
      .subscribe()

    // 2. Polling activo de respaldo cada 6 segundos
    const pollInterval = setInterval(() => {
      refreshOrders(false)
    }, 6000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [refreshOrders, soundEnabled])

  // Manejo de pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
        setIsFullscreen(false)
      }
    }
  }

  // Cambio de estado de comanda
  const handleStatusChange = async (orderId: string, nextStatus: KitchenStatus) => {
    // Actualización optimista
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              kitchen_status: nextStatus,
              items: ord.items.map((i) => ({ ...i, kitchen_status: nextStatus })),
            }
          : ord
      )
    )

    startTransition(async () => {
      try {
        await updateOrderKitchenStatusAction(orderId, nextStatus)
        if (soundEnabled && nextStatus === 'ready') {
          playKitchenNotificationChime()
        }
      } catch (err) {
        console.error('Error actualizando estado:', err)
        refreshOrders(false)
      }
    })
  }

  // Toggle de preparación de plato individual (checklist visual para cocineros)
  const toggleItemCompleted = (itemId: string) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Cálculo de tiempo transcurrido
  const getElapsedInfo = (createdAtString: string) => {
    const createdTime = new Date(createdAtString).getTime()
    const diffMs = Math.max(0, now - createdTime)
    const totalMinutes = Math.floor(diffMs / 60000)
    const totalSeconds = Math.floor((diffMs % 60000) / 1000)

    // Código de color según requerimiento:
    // Verde: < 10min | Amarillo: 10-20min | Rojo: > 20min
    let colorClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
    let badgeVariant: 'green' | 'yellow' | 'red' = 'green'
    let label = 'A tiempo'

    if (totalMinutes >= 20) {
      colorClass = 'bg-rose-500/15 text-rose-600 border-rose-500/40 dark:text-rose-400 animate-pulse font-extrabold'
      badgeVariant = 'red'
      label = 'Urgente / Demorada'
    } else if (totalMinutes >= 10) {
      colorClass = 'bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400 font-bold'
      badgeVariant = 'yellow'
      label = 'Atención'
    }

    return {
      minutes: totalMinutes,
      seconds: totalSeconds,
      formatted: `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`,
      colorClass,
      badgeVariant,
      label,
    }
  }

  // Filtrado de órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro por tab de estado
      if (activeTab === 'all_active') {
        if (order.kitchen_status === 'delivered' || order.kitchen_status === 'cancelled') {
          return false
        }
      } else if ((order.kitchen_status as string) !== activeTab) {
        return false
      }

      // Filtro por canal / tipo de servicio
      if (serviceFilter !== 'all' && order.type !== serviceFilter) {
        return false
      }

      // Búsqueda por texto (número de orden, cliente, mesa o nombre de plato)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const orderNumStr = `#${order.order_number}`
        const custName = order.customer_name?.toLowerCase() || ''
        const tabNum = order.table_number?.toLowerCase() || ''
        const notes = order.notes?.toLowerCase() || ''
        const hasDish = order.items.some(
          (i) => i.recipe_name.toLowerCase().includes(query) || (i.notes && i.notes.toLowerCase().includes(query))
        )

        const match =
          orderNumStr.includes(query) ||
          custName.includes(query) ||
          tabNum.includes(query) ||
          notes.includes(query) ||
          hasDish

        if (!match) return false
      }

      return true
    })
  }, [orders, activeTab, serviceFilter, searchQuery])

  // Métricas del KDS
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.kitchen_status !== 'delivered' && o.kitchen_status !== 'cancelled')
    const pending = active.filter((o) => o.kitchen_status === 'pending')
    const inPrep = active.filter((o) => o.kitchen_status === 'in_preparation')
    const ready = active.filter((o) => o.kitchen_status === 'ready')
    const delayed = active.filter((o) => {
      const mins = Math.floor((now - new Date(o.created_at).getTime()) / 60000)
      return mins >= 20
    })

    const avgMinutes =
      active.length > 0
        ? Math.round(
            active.reduce((acc, o) => acc + (now - new Date(o.created_at).getTime()) / 60000, 0) / active.length
          )
        : 0

    return {
      totalActive: active.length,
      pendingCount: pending.length,
      inPrepCount: inPrep.length,
      readyCount: ready.length,
      delayedCount: delayed.length,
      avgMinutes,
    }
  }, [orders, now])

  // Separación por columnas en vista Kanban
  const kanbanColumns = useMemo(() => {
    const pendingList = filteredOrders.filter((o) => o.kitchen_status === 'pending')
    const inPrepList = filteredOrders.filter((o) => o.kitchen_status === 'in_preparation')
    const readyList = filteredOrders.filter((o) => o.kitchen_status === 'ready')
    const deliveredList = filteredOrders.filter((o) => o.kitchen_status === 'delivered')

    return [
      {
        id: 'pending',
        title: 'En Espera / Nuevas',
        count: pendingList.length,
        color: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-500 text-amber-950 font-bold',
        orders: pendingList,
        icon: Clock,
      },
      {
        id: 'in_preparation',
        title: 'En Preparación',
        count: inPrepList.length,
        color: 'border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-500 text-white font-bold',
        orders: inPrepList,
        icon: Flame,
      },
      {
        id: 'ready',
        title: 'Listas para Servir',
        count: readyList.length,
        color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500 text-white font-bold',
        orders: readyList,
        icon: CheckCircle2,
      },
      ...(activeTab === 'delivered'
        ? [
            {
              id: 'delivered',
              title: 'Despachadas',
              count: deliveredList.length,
              color: 'border-slate-500/40 bg-slate-500/5 text-slate-600 dark:text-slate-400',
              badgeBg: 'bg-slate-500 text-white font-bold',
              orders: deliveredList,
              icon: Bike,
            },
          ]
        : []),
    ]
  }, [filteredOrders, activeTab])

  // Renderizador de Tarjeta de Comanda
  const renderOrderCard = (order: KitchenOrder) => {
    const elapsed = getElapsedInfo(order.created_at)

    // Tipo de servicio con icono
    const getServiceBadge = () => {
      if (order.type === 'dine_in') {
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1 text-xs py-0.5">
            <UtensilsCrossed className="size-3" />
            <span>Mesa {order.table_number || order.customer_name || 'Salón'}</span>
          </Badge>
        )
      } else if (order.type === 'takeaway') {
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 text-xs py-0.5">
            <ShoppingBag className="size-3" />
            <span>Para Llevar</span>
          </Badge>
        )
      } else {
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1 text-xs py-0.5">
            <Bike className="size-3" />
            <span>Delivery</span>
          </Badge>
        )
      }
    }

    return (
      <Card
        key={order.id}
        className={`border-2 shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden relative ${
          elapsed.badgeVariant === 'red'
            ? 'border-rose-500/60 bg-rose-500/[0.02] ring-2 ring-rose-500/20'
            : elapsed.badgeVariant === 'yellow'
            ? 'border-amber-500/40 bg-card'
            : 'border-border bg-card'
        }`}
      >
        {/* Encabezado de la Comanda */}
        <CardHeader className="p-3.5 pb-2.5 border-b bg-muted/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg text-foreground tracking-tight">
                #{order.order_number}
              </span>
              {getServiceBadge()}
            </div>

            {/* Temporizador con código de color dinámico */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold ${elapsed.colorClass}`}
              title={`Tiempo en cocina: ${elapsed.minutes} min`}
            >
              <Clock className="size-3.5" />
              <span>{elapsed.formatted}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium truncate max-w-[170px]">
              {order.customer_name || 'Cliente'}
            </span>
            <span className="text-[11px] font-mono">
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Nota general de la comanda si existe */}
          {order.notes && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5 font-medium">
              <AlertTriangle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{order.notes}</span>
            </div>
          )}
        </CardHeader>

        {/* Lista de Platos y Notas de Cocina */}
        <CardContent className="p-3.5 space-y-2.5 flex-1">
          <div className="space-y-2">
            {order.items.map((item) => {
              const isChecked = completedItems[item.id] || false
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItemCompleted(item.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-muted/40 border-muted opacity-60 line-through'
                      : 'bg-card border-border hover:border-primary/40 hover:bg-muted/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="size-4 text-emerald-600" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-extrabold text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-xs text-foreground leading-snug">
                            {item.recipe_name}
                          </span>
                        </div>

                        {/* Notas especiales de cocina destacadas */}
                        {item.notes && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 w-fit">
                            <span>⚠️</span>
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>

        {/* Botones de Cambio Rápido de Estado - Touch Optimized (min 44px height) */}
        <CardFooter className="p-3 pt-2 border-t bg-muted/20 flex flex-col gap-2">
          {order.kitchen_status === 'pending' && (
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                size="sm"
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs h-11 rounded-xl active:scale-95 transition-transform"
                onClick={() => handleStatusChange(order.id, 'in_preparation')}
              >
                <Flame className="size-4" />
                Preparar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-1.5 h-11 rounded-xl active:scale-95 transition-transform"
                onClick={() => handleStatusChange(order.id, 'ready')}
              >
                <CheckCircle2 className="size-4" />
                Listo
              </Button>
            </div>
          )}

          {order.kitchen_status === 'in_preparation' && (
            <div className="grid grid-cols-4 gap-1.5 w-full">
              <Button
                size="sm"
                variant="ghost"
                className="col-span-1 text-muted-foreground hover:text-foreground text-xs p-1 h-11 rounded-xl active:scale-95 transition-transform"
                onClick={() => handleStatusChange(order.id, 'pending')}
                title="Volver a estado En Espera"
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="default"
                className="col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-xs h-11 rounded-xl active:scale-95 transition-transform"
                onClick={() => handleStatusChange(order.id, 'ready')}
              >
                <CheckCircle2 className="size-4" />
                Listo para Servir
              </Button>
            </div>
          )}

          {order.kitchen_status === 'ready' && (
            <div className="grid grid-cols-4 gap-1.5 w-full">
              <Button
                size="sm"
                variant="ghost"
                className="col-span-1 text-muted-foreground hover:text-foreground text-xs p-1 h-11 rounded-xl active:scale-95 transition-transform"
                onClick={() => handleStatusChange(order.id, 'in_preparation')}
                title="Volver a Preparación"
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="default"
                className="col-span-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-bold text-xs gap-2 shadow-xs h-11 rounded-xl active:scale-95 transition-transform"
                onClick={() => handleStatusChange(order.id, 'delivered')}
              >
                <Bike className="size-4" />
                Despachar / Entregado
              </Button>
            </div>
          )}

          {order.kitchen_status === 'delivered' && (
            <div className="flex items-center justify-between w-full">
              <Badge variant="outline" className="text-[11px] bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold px-2 py-1 rounded-lg">
                ✓ Despachado
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9 rounded-xl"
                onClick={() => handleStatusChange(order.id, 'ready')}
              >
                <RotateCcw className="size-3.5" /> Reabrir
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Barra Superior KDS & Controles de Operación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
        
        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Button
            size="sm"
            variant={activeTab === 'all_active' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all_active')}
            className="text-xs font-semibold gap-1.5"
          >
            <span>Todas Activas</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-primary-foreground/20">
              {stats.totalActive}
            </span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
            className="text-xs font-semibold gap-1.5"
          >
            <Clock className="size-3.5 text-amber-500" />
            <span>En Espera</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted">
              {stats.pendingCount}
            </span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'in_preparation' ? 'default' : 'outline'}
            onClick={() => setActiveTab('in_preparation')}
            className="text-xs font-semibold gap-1.5"
          >
            <Flame className="size-3.5 text-blue-500" />
            <span>En Preparación</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted">
              {stats.inPrepCount}
            </span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'ready' ? 'default' : 'outline'}
            onClick={() => setActiveTab('ready')}
            className="text-xs font-semibold gap-1.5"
          >
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>Listas</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted">
              {stats.readyCount}
            </span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'delivered' ? 'default' : 'outline'}
            onClick={() => setActiveTab('delivered')}
            className="text-xs font-semibold gap-1.5"
          >
            <Bike className="size-3.5 text-slate-500" />
            <span>Historial</span>
          </Button>
        </div>

        {/* Acciones de Vista, Búsqueda y Sonido */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Canal / Servicio */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border text-xs">
            <button
              onClick={() => setServiceFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                serviceFilter === 'all' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setServiceFilter('dine_in')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                serviceFilter === 'dine_in' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
              }`}
            >
              🍽️ Salón
            </button>
            <button
              onClick={() => setServiceFilter('takeaway')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                serviceFilter === 'takeaway' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
              }`}
            >
              🛍️ Llevar
            </button>
            <button
              onClick={() => setServiceFilter('delivery')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                serviceFilter === 'delivery' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
              }`}
            >
              🛵 Delivery
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar #, mesa, plato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs w-[160px] lg:w-[190px]"
            />
          </div>

          {/* Toggle Vista Kanban / Grid */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'kanban' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vista Columnas Kanban"
            >
              <Layers className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vista Cuadrícula Grid"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Toggle Sonido de Cocina */}
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`h-8 w-8 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}
            title={soundEnabled ? 'Alerta sonora de cocina activada' : 'Alerta sonora silenciada'}
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>

          {/* Refresco Manual */}
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => refreshOrders(true)}
            disabled={isRefreshing}
            className="h-8 w-8"
            title="Refrescar comandas"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </Button>

          {/* Pantalla Completa */}
          <Button
            size="icon-sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="h-8 w-8"
            title="Modo Pantalla Completa para Cocina"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </div>

      {/* KPI Banner de Métricas en Tiempo Real */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border bg-card shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Comandas Activas</p>
            <p className="text-xl font-black text-foreground font-mono">{stats.totalActive}</p>
          </div>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ChefHat className="size-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">En Preparación</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{stats.inPrepCount}</p>
          </div>
          <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Flame className="size-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Listas para Servir</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.readyCount}</p>
          </div>
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Demoradas (&gt;20m)</p>
            <p className={`text-xl font-black font-mono ${stats.delayedCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-foreground'}`}>
              {stats.delayedCount}
            </p>
          </div>
          <div className={`size-8 rounded-lg flex items-center justify-center ${stats.delayedCount > 0 ? 'bg-rose-500/20 text-rose-600' : 'bg-muted text-muted-foreground'}`}>
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 rounded-xl border bg-card shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Tiempo Promedio</p>
            <p className="text-xl font-black text-foreground font-mono">{stats.avgMinutes} min</p>
          </div>
          <div className="size-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
            <Timer className="size-4" />
          </div>
        </div>
      </div>

      {/* Indicador de Estado de Conexión Realtime */}
      <div className="flex items-center justify-between text-xs px-2 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            KDS En Vivo &bull; Sincronización Automática
          </span>
        </div>
        <span className="text-[11px]">
          Última actualización: {lastSyncTime.toLocaleTimeString()}
        </span>
      </div>

      {/* Vista Principal: Columnas Kanban o Grid */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-2xl bg-card text-muted-foreground space-y-3">
          <ChefHat className="size-12 mx-auto text-primary/40" />
          <div className="space-y-1">
            <p className="font-bold text-base text-foreground">No hay comandas activas</p>
            <p className="text-xs max-w-sm mx-auto">
              Las nuevas órdenes registradas desde el Punto de Venta (POS) aparecerán aquí en tiempo real.
            </p>
          </div>
        </div>
      ) : viewMode === 'kanban' && activeTab === 'all_active' ? (
        /* Vista Kanban de Columnas (Responsive Snap Touch Scroll on Tablet/Mobile) */
        <div className="flex overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 gap-4 lg:gap-5 items-start">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="space-y-3 min-w-[290px] sm:min-w-[320px] md:min-w-0 flex-1 snap-start">
              {/* Header de la Columna */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${col.color} shadow-xs`}>
                <div className="flex items-center gap-2">
                  <col.icon className="size-4" />
                  <span className="font-bold text-sm">{col.title}</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${col.badgeBg}`}>
                  {col.count}
                </span>
              </div>

              {/* Lista de Tarjetas en la Columna */}
              <div className="space-y-3 min-h-[400px]">
                {col.orders.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/10 text-muted-foreground text-xs">
                    Sin comandas en este estado
                  </div>
                ) : (
                  col.orders.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista de Cuadrícula / Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {filteredOrders.map((order) => renderOrderCard(order))}
        </div>
      )}
    </div>
  )
}
