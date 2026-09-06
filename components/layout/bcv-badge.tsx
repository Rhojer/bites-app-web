'use client'

import { useState, useEffect } from 'react'
import { DollarSign, RefreshCw, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BcvData {
  rate: number
  formattedRate: string
  currency: string
  date: string
  source: string
}

export function BcvBadge() {
  const [bcvData, setBcvData] = useState<BcvData | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadRate() {
    setLoading(true)
    try {
      const res = await fetch('/api/bcv')
      if (res.ok) {
        const data = await res.json()
        setBcvData(data)
      }
    } catch {
      // Ignorar
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRate()
    // Auto-actualizar cada 15 minutos
    const interval = setInterval(loadRate, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!bcvData) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/40 border text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Cargando BCV...</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={loadRate}
      disabled={loading}
      title={`Tasa Oficial BCV: ${bcvData.rate} Bs/USD (${bcvData.source === 'bcv_direct' ? 'Directo de bcv.org.ve' : 'Sincronizado'}). Clic para refrescar.`}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-foreground hover:bg-primary/20 transition-all active:scale-95 group shadow-2xs"
    >
      <span className="text-primary font-black flex items-center">
        💵 <span className="ml-1 text-[11px] text-muted-foreground uppercase font-semibold">BCV:</span>
      </span>
      <span className="font-mono text-primary font-extrabold text-xs">
        Bs. {bcvData.formattedRate}
      </span>
      <RefreshCw
        className={`size-3 text-muted-foreground group-hover:text-primary transition-colors ${
          loading ? 'animate-spin text-primary' : ''
        }`}
      />
    </button>
  )
}
