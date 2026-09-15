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
  X
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const PRIMARY_TABS = [
  { name: 'POS', href: '/pos', icon: MonitorCheck },
  { name: 'Cocina', href: '/kitchen', icon: ChefHat },
  { name: 'Caja', href: '/cash-register', icon: Wallet },
  { name: 'Clientes', href: '/crm', icon: Users },
]

const MORE_MODULES = [
  { name: 'Resumen', href: '/', icon: LayoutDashboard, desc: 'Métricas de ventas y metas' },
  { name: 'Menú y Costos', href: '/recipes', icon: UtensilsCrossed, desc: 'Platos, recetas y escandallos' },
  { name: 'Inventario', href: '/inventory', icon: Boxes, desc: 'Existencias y registro de mermas' },
  { name: 'Finanzas', href: '/finances', icon: TrendingDown, desc: 'P&L, proveedores y utilidades' },
  { name: 'Ajustes', href: '/settings', icon: Settings, desc: 'Configuración general' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_MODULES.some(
    (m) => pathname === m.href || (m.href !== '/' && pathname?.startsWith(m.href))
  )

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t shadow-lg pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-1">
        {PRIMARY_TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-all duration-150 active:scale-95 touch-manipulation min-h-[48px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-primary/15 text-primary' : ''
                }`}
              >
                <tab.icon className="size-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.name}</span>
            </Link>
          )
        })}

        {/* Botón "Más" con Drawer */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-all duration-150 active:scale-95 touch-manipulation min-h-[48px] ${
                  isMoreActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Más módulos"
              />
            }
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                isMoreActive ? 'bg-primary/15 text-primary' : ''
              }`}
            >
              <LayoutGrid className="size-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Más</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-4 rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-3 border-b">
              <SheetTitle className="text-base font-bold text-left">Todos los Módulos</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 gap-2.5 pt-3 pb-6">
              {MORE_MODULES.map((mod) => {
                const isActive = pathname === mod.href || (mod.href !== '/' && pathname?.startsWith(mod.href))
                return (
                  <Link
                    key={mod.name}
                    href={mod.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-card border-border hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <mod.icon className="size-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">{mod.name}</p>
                      <p className="text-xs text-muted-foreground font-normal">{mod.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
