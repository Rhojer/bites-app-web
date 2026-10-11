'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Boxes,
  UtensilsCrossed,
  MonitorCheck,
  Wallet,
  TrendingDown,
  Users,
  Settings,
  ChefHat,
  Receipt,
  LogOut,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export const navigationItems = [
  {
    name: 'Resumen',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Tomar Pedidos',
    href: '/pos',
    icon: MonitorCheck,
  },
  {
    name: 'Historial de Ventas',
    href: '/sales',
    icon: Receipt,
  },
  {
    name: 'Menú y Costos',
    href: '/recipes',
    icon: UtensilsCrossed,
  },
  {
    name: 'Inventario',
    href: '/inventory',
    icon: Boxes,
  },
  {
    name: 'Caja del Día',
    href: '/cash-register',
    icon: Wallet,
  },
  {
    name: 'Clientes',
    href: '/crm',
    icon: Users,
  },
  {
    name: 'Finanzas',
    href: '/finances',
    icon: TrendingDown,
  },
  {
    name: 'Cocina en Vivo',
    href: '/kitchen',
    icon: ChefHat,
  },
  {
    name: 'Ajustes',
    href: '/settings',
    icon: Settings,
  },
]

export function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      if (typeof document !== 'undefined') {
        document.cookie = 'bites_pos_session=; path=/; max-age=0'
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      if (onItemClick) {
        onItemClick()
      }
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Error cerrando sesión:', err)
      if (onItemClick) {
        onItemClick()
      }
      router.push('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b gap-3 shrink-0">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs font-bold text-xl">
          B
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-foreground">Bites App</span>
            <Badge variant="outline" className="text-xs px-2 py-0 bg-primary/5 text-primary border-primary/20 font-semibold">
              Admin
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Control del Restaurante</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">
          Menú Principal
        </p>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`size-5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-sm tracking-tight">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer: Administrador + Cerrar Sesión + Estado del Sistema */}
      <div className="p-3 border-t bg-card space-y-2.5 shrink-0 mt-auto">
        {/* Usuario info */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-muted/40 border border-border/50">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            AD
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-foreground truncate">Administrador</p>
            <p className="text-[11px] text-muted-foreground truncate">Admin General</p>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full justify-start gap-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors cursor-pointer"
        >
          {loggingOut ? (
            <Loader2 className="size-4 animate-spin text-destructive shrink-0" />
          ) : (
            <LogOut className="size-4 shrink-0 text-muted-foreground group-hover:text-destructive" />
          )}
          <span>{loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
        </Button>

        {/* Estado del Sistema */}
        <div className="px-2 pt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistema en línea
          </span>
          <span className="text-[10px] text-muted-foreground/60">v1.0</span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 border-r bg-card flex-col shrink-0 h-screen sticky top-0 z-20">
      <SidebarContent />
    </aside>
  )
}

