'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, Loader2, DollarSign, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { recordCurrencyExchangeAction } from '@/app/cash-register/actions'
import { VaultType } from '@/lib/domain/cash-register'

const VAULT_OPTIONS: { value: VaultType; label: string; currency: 'USD' | 'VES' }[] = [
  { value: 'cash_usd', label: '💵 Gaveta Efectivo USD ($)', currency: 'USD' },
  { value: 'cash_ves', label: '🇻🇪 Gaveta Efectivo Bs (Bs.)', currency: 'VES' },
  { value: 'bank_ves', label: '🏦 Banco Bolívares (Pago Móvil / POS)', currency: 'VES' },
  { value: 'bank_usd', label: '🌐 Banco Dólares (Zelle / Divisas)', currency: 'USD' },
]

export function CurrencyExchangeDialog({ initialBcvRate = 842.20 }: { initialBcvRate?: number }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form State
  const [fromVault, setFromVault] = useState<VaultType>('cash_usd')
  const [toVault, setToVault] = useState<VaultType>('bank_ves')
  const [fromAmount, setFromAmount] = useState<string>('')
  const [exchangeRate, setExchangeRate] = useState<number>(initialBcvRate)
  const [notes, setNotes] = useState<string>('')

  // Cargar tasa BCV en vivo si está disponible
  useEffect(() => {
    if (open) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
      fetch(`${basePath}/api/bcv`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.rate) setExchangeRate(data.rate)
        })
        .catch(() => {})
    }
  }, [open])

  const fromDef = VAULT_OPTIONS.find((v) => v.value === fromVault) || VAULT_OPTIONS[0]
  const toDef = VAULT_OPTIONS.find((v) => v.value === toVault) || VAULT_OPTIONS[2]

  const numFrom = parseFloat(fromAmount) || 0
  let calculatedTo = 0

  if (fromDef.currency === 'USD' && toDef.currency === 'VES') {
    calculatedTo = numFrom * exchangeRate
  } else if (fromDef.currency === 'VES' && toDef.currency === 'USD') {
    calculatedTo = exchangeRate > 0 ? numFrom / exchangeRate : 0
  } else {
    // Misma moneda (ej. de efectivo USD a banco USD, o de efectivo Bs a banco Bs)
    calculatedTo = numFrom
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fromVault === toVault) {
      setError('La bóveda de origen y destino no pueden ser la misma.')
      return
    }
    if (numFrom <= 0) {
      setError('El monto a transferir debe ser mayor a 0.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await recordCurrencyExchangeAction({
        from_vault: fromVault,
        to_vault: toVault,
        from_amount: numFrom,
        from_currency: fromDef.currency,
        to_amount: calculatedTo,
        to_currency: toDef.currency,
        exchange_rate: exchangeRate,
        notes: notes.trim() || 'Canje / Transferencia de fondos entre bóvedas',
      })

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setFromAmount('')
        setNotes('')
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el canje de divisas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 shadow-2xs">
            <ArrowLeftRight className="size-3.5 text-primary" />
            <span>Canje / Transferir Bóveda</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <ArrowLeftRight className="size-5 text-primary" />
              Canje de Divisas y Transferencia entre Bóvedas
            </DialogTitle>
            <DialogDescription>
              Transfiere fondos entre efectivo y bancos, registrando la tasa de cambio negociada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Canje registrado exitosamente en el libro de bóvedas.</span>
              </div>
            )}

            {/* Bóveda Origen */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bóveda de Origen (Retirar de)</Label>
              <select
                value={fromVault}
                onChange={(e) => setFromVault(e.target.value as VaultType)}
                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                {VAULT_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bóveda Destino */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bóveda de Destino (Depositar en)</Label>
              <select
                value={toVault}
                onChange={(e) => setToVault(e.target.value as VaultType)}
                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                {VAULT_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value} disabled={v.value === fromVault}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Monto de Origen */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Monto a Retirar ({fromDef.currency === 'USD' ? '$' : 'Bs.'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder={fromDef.currency === 'USD' ? '100.00' : '8422.00'}
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              {/* Tasa de Cambio Negociada */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Tasa de Cambio</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Bs/USD</span>
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  required
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Vista previa de conversión en vivo */}
            <div className="p-3 rounded-xl border bg-muted/30 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Resultado de la Operación
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-medium">Monto que ingresa a destino:</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {toDef.currency === 'USD' ? `$${calculatedTo.toFixed(2)} USD` : `Bs. ${calculatedTo.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>

            {/* Nota de Justificación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nota o Motivo del Canje</Label>
              <Input
                placeholder="Ej. Depósito en cuenta para pago a proveedores o cambio de efectivo"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || success} className="gap-1.5">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
              <span>Confirmar Canje</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
