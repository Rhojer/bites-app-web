'use client'

import { useState } from 'react'
import { Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from '@/components/layout/sidebar'
import { BcvBadge } from '@/components/layout/bcv-badge'

interface NavbarProps {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function Navbar({ title, description, actions }: NavbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header className="h-16 border-b bg-card/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Navigation Drawer Trigger (< md) */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden text-foreground hover:bg-muted shrink-0 size-9"
                aria-label="Abrir menú de navegación"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 max-w-[85vw] border-r">
            <SidebarContent onItemClick={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{title || 'Dashboard'}</h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs px-2 py-0.5 bg-primary/5 text-primary border-primary/20">
              Activo
            </Badge>
          </div>
          {description && <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <BcvBadge />
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <div className="h-4 w-px bg-border mx-0.5 sm:mx-1" />

        {/* Notificaciones */}
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground size-8 sm:size-9">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-orange-500 ring-2 ring-card" />
        </Button>

        {/* Usuario / Rol */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold leading-none text-foreground">Administrador</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Admin General</p>
          </div>
        </div>
      </div>
    </header>
  )
}

