'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Boxes,
  UtensilsCrossed,
  MonitorCheck,
  Wallet,
  TrendingDown,
  Users,
  Settings,
  Sparkles,
  ChevronRight,
  AlertCircle,
  ChefHat
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

      {/* Footer Status */}
      <div className="p-3.5 border-t bg-muted/20 m-3 rounded-2xl space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Sistema en línea
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-snug">Datos actualizados al momento.</p>
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

