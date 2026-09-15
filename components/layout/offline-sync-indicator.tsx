'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { offlineSyncManager, SyncState } from '@/lib/offline-sync'

export function OfflineSyncIndicator() {
  const [networkStatus, setNetworkStatus] = useState<SyncState>('online')
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const unsubscribe = offlineSyncManager.subscribe((state) => {
      setNetworkStatus(state.networkStatus)
      setPendingCount(state.pendingCount)
      setIsSyncing(state.isSyncing)
    })
    return unsubscribe
  }, [])

  if (isSyncing) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 py-1 px-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-semibold animate-pulse"
      >
        <RefreshCw className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">Sincronizando órdenes...</span>
        <span className="sm:hidden">Sincronizando</span>
      </Badge>
    )
  }

  if (networkStatus === 'offline' || pendingCount > 0) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 py-1 px-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold"
      >
        <WifiOff className="size-3.5" />
        <span>
          {pendingCount > 0 ? (
            <>
              Modo Offline · <strong className="font-mono">{pendingCount}</strong> {pendingCount === 1 ? 'comanda' : 'comandas'}
            </>
          ) : (
            'Sin Conexión'
          )}
        </span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="hidden md:inline-flex items-center gap-1.5 py-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium"
    >
      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>En línea</span>
    </Badge>
  )
}
