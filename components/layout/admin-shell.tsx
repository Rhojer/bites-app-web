import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-zinc-50/50 dark:bg-zinc-950 font-sans pb-16 md:pb-0">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
