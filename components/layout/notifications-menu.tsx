'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  ChefHat,
  Wallet,
  RefreshCw,
  X,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'warning' | 'alert' | 'info' | 'success'
  read: boolean
  link?: string
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-bcv',
    title: 'Tasa BCV Sincronizada',
    description: 'La tasa oficial del día está activa y aplicada a los precios en Bs.',
    timestamp: 'Hace 10 min',
    type: 'info',
    read: false,
    link: '/finances',
  },
  {
    id: 'notif-kitchen',
    title: 'Cocina en Vivo Conectada',
    description: 'Pantalla de comandas lista para recibir pedidos del POS.',
    timestamp: 'Hace 25 min',
    type: 'success',
    read: false,
    link: '/kitchen',
  },
  {
    id: 'notif-cash',
    title: 'Caja del Día Disponible',
    description: 'Turno operativo abierto para cobros multimoneda.',
    timestamp: 'Hace 1 hora',
    type: 'info',
    read: true,
    link: '/cash-register',
  },
]

export function NotificationsMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch real low stock ingredients from Supabase
  useEffect(() => {
    let isMounted = true

    async function checkStockAlerts() {
      try {
        const supabase = createClient()
        const { data: ingredients, error } = await supabase
          .from('ingredients')
          .select('id, name, current_stock, min_stock, unit')
          .limit(50)

        if (!error && ingredients && ingredients.length > 0 && isMounted) {
          const criticalItems = ingredients.filter(
            (item) => Number(item.current_stock) <= Number(item.min_stock)
          )

          if (criticalItems.length > 0) {
            const stockNotifs: AppNotification[] = criticalItems.slice(0, 3).map((item) => ({
              id: `stock-${item.id}`,
              title: `Stock Crítico: ${item.name}`,
              description: `Quedan ${item.current_stock} ${item.unit} (Mínimo: ${item.min_stock} ${item.unit})`,
              timestamp: 'Reciente',
              type: 'alert',
              read: false,
              link: '/inventory',
            }))

            setNotifications((prev) => {
              const prevNonStock = prev.filter((n) => !n.id.startsWith('stock-'))
              return [...stockNotifs, ...prevNonStock]
            })
          }
        }
      } catch (err) {
        console.error('Error fetching stock alerts for notifications:', err)
      }
    }

    checkStockAlerts()

    return () => {
      isMounted = false
    }
  }, [])

  // Close on outside click and Escape
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const handleItemClick = (notification: AppNotification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    setIsOpen(false)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
      case 'success':
        return <ChefHat className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      case 'info':
      default:
        return <RefreshCw className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
    }
  }

  const getIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return 'bg-amber-500/10 dark:bg-amber-500/20'
      case 'success':
        return 'bg-emerald-500/10 dark:bg-emerald-500/20'
      case 'info':
      default:
        return 'bg-blue-500/10 dark:bg-blue-500/20'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón Bell */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative text-muted-foreground hover:text-foreground size-8 sm:size-9 transition-colors cursor-pointer ${
          isOpen ? 'bg-muted text-foreground' : ''
        }`}
        aria-label="Abrir panel de notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="size-4.5 sm:size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-card animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover / Panel de Notificaciones */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-card border rounded-2xl shadow-xl ring-1 ring-foreground/10 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground tracking-tight">Notificaciones</h2>
              {unreadCount > 0 ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 font-semibold">
                  {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
                  Al día
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleMarkAllAsRead}
                  className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="size-3.5 mr-1" />
                  Leer todas
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleClearAll}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Vaciar notificaciones"
                  aria-label="Vaciar notificaciones"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="px-3.5 py-2 border-b bg-muted/5 flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="size-10 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'Sin notificaciones pendientes'}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Todas las alertas operativas del restaurante y sistema están al día.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-muted/40 relative group ${
                    !item.read ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  {/* Icono del tipo */}
                  <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(item.type)}`}>
                    {getIcon(item.type)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-semibold truncate ${!item.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/75 mt-1 font-medium">
                      {item.timestamp}
                    </p>
                  </div>

                  {/* Botón descartar individual */}
                  <button
                    onClick={(e) => handleDismiss(item.id, e)}
                    className="absolute top-2.5 right-2 size-6 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Descartar notificación"
                    aria-label="Descartar notificación"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t bg-muted/20 text-center">
            <Link
              href="/inventory"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Consultar existencias en Inventario
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
