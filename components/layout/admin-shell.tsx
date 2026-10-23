import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-background text-foreground font-sans pb-16 md:pb-0">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
