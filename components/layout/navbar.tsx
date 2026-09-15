'use client'

import { useState } from 'react'
import { Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from '@/components/layout/sidebar'
import { BcvBadge } from '@/components/layout/bcv-badge'
import { OfflineSyncIndicator } from '@/components/layout/offline-sync-indicator'

interface NavbarProps {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function Navbar({ title, description, actions }: NavbarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="sticky top-0 z-30 shrink-0">
      <header className="h-14 sm:h-16 border-b bg-card/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Navigation Drawer Trigger (< md) */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden text-foreground hover:bg-muted shrink-0 size-8 sm:size-9"
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

          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-foreground tracking-tight truncate">
              {title || 'Dashboard'}
            </h1>
            {description && (
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate hidden sm:block font-medium">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Offline Indicator + BCV Badge + Actions (Desktop) + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <OfflineSyncIndicator />
          <BcvBadge />

          {/* Actions in Navbar for Desktop/Tablet */}
          {actions && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}

          <div className="hidden sm:block h-4 w-px bg-border mx-0.5 sm:mx-1" />

          {/* Notificaciones */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:flex relative text-muted-foreground hover:text-foreground size-8 sm:size-9"
            aria-label="Notificaciones"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-orange-500 ring-2 ring-card" />
          </Button>

          {/* Usuario / Rol */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l">
            <div className="size-7 sm:size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              AD
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold leading-none text-foreground">Administrador</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Admin General</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Actions Bar (rendered below navbar when actions exist on phone resolution) */}
      {actions && (
        <div className="md:hidden border-b bg-card/90 backdrop-blur-xs px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shadow-2xs">
          <div className="flex items-center gap-2 shrink-0 w-full justify-end">
            {actions}
          </div>
        </div>
      )}
    </div>
  )
}

