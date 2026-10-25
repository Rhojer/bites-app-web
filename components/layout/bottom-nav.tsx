'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MonitorCheck,
  ChefHat,
  Wallet,
  Users,
  LayoutGrid,
  UtensilsCrossed,
  Boxes,
  TrendingDown,
  Settings,
  LayoutDashboard,
  Receipt,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const PRIMARY_TABS = [
  { name: 'POS', href: '/pos', icon: MonitorCheck },
  { name: 'Cocina', href: '/kitchen', icon: ChefHat },
  { name: 'Caja', href: '/cash-register', icon: Wallet },
  { name: 'Clientes', href: '/crm', icon: Users },
]

const MORE_MODULES = [
  { name: 'Historial de Ventas', href: '/sales', icon: Receipt, desc: 'Ventas por día y desglose' },
  { name: 'Resumen', href: '/', icon: LayoutDashboard, desc: 'Métricas de ventas y metas' },
  { name: 'Menú y Costos', href: '/recipes', icon: UtensilsCrossed, desc: 'Platos, recetas y escandallos' },
  { name: 'Inventario', href: '/inventory', icon: Boxes, desc: 'Existencias y registro de mermas' },
  { name: 'Finanzas', href: '/finances', icon: TrendingDown, desc: 'P&L, proveedores y utilidades' },
  { name: 'Ajustes', href: '/settings', icon: Settings, desc: 'Configuración general (Próximamente)' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [touchOptimisticIndex, setTouchOptimisticIndex] = useState<number | null>(null)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setTouchOptimisticIndex(null)
  }

  // Find active primary tab
  const primaryIndex = PRIMARY_TABS.findIndex((tab) => {
    if (!pathname) return false
    return pathname === tab.href || pathname.startsWith(tab.href + '/')
  })

  // Check if any of MORE_MODULES is active
  const isMoreRouteActive = MORE_MODULES.some((m) => {
    if (!pathname) return false
    if (m.href === '/') {
      return pathname === '/'
    }
    return pathname === m.href || pathname.startsWith(m.href + '/')
  })

  const isMoreActive = isMoreRouteActive || moreOpen

  // Actual index based on current route
  const currentRouteIndex = primaryIndex !== -1 ? primaryIndex : (isMoreActive ? 4 : -1)

  // Optimistic index on immediate tap for instantaneous iOS response
  const activeIndex = touchOptimisticIndex !== null ? touchOptimisticIndex : currentRouteIndex

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/85 dark:bg-card/85 backdrop-blur-xl border-t border-border/50 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5 px-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto">
        <nav
          className="relative grid grid-cols-5 items-center h-14 bg-muted/60 dark:bg-muted/30 rounded-full p-1 border border-border/50 shadow-inner"
          aria-label="Navegación inferior"
        >
          {/* Sliding Pill Indicator (iOS capsule) */}
          {activeIndex >= 0 && activeIndex <= 4 && (
            <div
              data-testid="bottom-nav-pill-indicator"
              className="absolute top-1 bottom-1 rounded-full bg-primary shadow-md shadow-primary/25 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-none"
              style={{
                width: 'calc((100% - 8px) / 5)',
                left: '4px',
                transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
              }}
            />
          )}

          {/* Primary Tabs */}
          {PRIMARY_TABS.map((tab, idx) => {
            const isActive = activeIndex === idx
            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={() => setTouchOptimisticIndex(idx)}
                className={`relative z-10 flex flex-col items-center justify-center h-full rounded-full select-none touch-manipulation transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <div
                  className={`flex items-center justify-center transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <tab.icon className="size-5" />
                </div>
                <span
                  className={`text-[10px] leading-tight tracking-tight mt-0.5 transition-all duration-200 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {tab.name}
                </span>
              </Link>
            )
          })}

          {/* Tab Más (Drawer) */}
          <Sheet
            open={moreOpen}
            onOpenChange={(open) => {
              setMoreOpen(open)
              if (!open) {
                setTouchOptimisticIndex(null)
              }
            }}
          >
            <SheetTrigger
              render={
                <button
                  type="button"
                  onClick={() => setTouchOptimisticIndex(4)}
                  className={`relative z-10 flex flex-col items-center justify-center h-full rounded-full select-none touch-manipulation transition-all duration-200 active:scale-95 ${
                    activeIndex === 4
                      ? 'text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground font-medium'
                  }`}
                  aria-label="Más módulos"
                />
              }
            >
              <div
                className={`flex items-center justify-center transition-transform duration-200 ${
                  activeIndex === 4 ? 'scale-110' : 'scale-100'
                }`}
              >
                <LayoutGrid className="size-5" />
              </div>
              <span
                className={`text-[10px] leading-tight tracking-tight mt-0.5 transition-all duration-200 ${
                  activeIndex === 4 ? 'font-bold' : 'font-medium'
                }`}
              >
                Más
              </span>
            </SheetTrigger>

            <SheetContent side="bottom" className="p-4 rounded-t-3xl max-h-[80vh] overflow-y-auto">
              {/* iOS Pull Handle Indicator */}
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Todos los Módulos</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-1 gap-2.5 pt-3 pb-6">
                {MORE_MODULES.map((mod) => {
                  const isModActive = pathname === mod.href || (mod.href !== '/' && pathname?.startsWith(mod.href + '/'))
                  return (
                    <Link
                      key={mod.name}
                      href={mod.href}
                      onClick={() => {
                        setTouchOptimisticIndex(4)
                        setMoreOpen(false)
                      }}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all active:scale-[0.98] ${
                        isModActive
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                          : 'bg-card border-border hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl ${
                          isModActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <mod.icon className="size-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold">{mod.name}</p>
                        <p
                          className={`text-xs ${
                            isModActive
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {mod.desc}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  )
}
