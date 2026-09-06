'use client'

import { useState } from 'react'
import { DollarSign, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'
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
import { updateCustomerCreditLimitAction } from '@/app/crm/actions'

interface UpdateCreditDialogProps {
  customerId: string
  customerName: string
  currentCreditLimit: number
  currentDebt: number
  triggerButton?: React.ReactElement
  onUpdated?: () => void
}

export function UpdateCreditDialog({
  customerId,
  customerName,
  currentCreditLimit,
  currentDebt,
  triggerButton,
  onUpdated,
}: UpdateCreditDialogProps) {
  const [open, setOpen] = useState(false)
  const [creditLimit, setCreditLimit] = useState(currentCreditLimit.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numLimit = parseFloat(creditLimit) || 0
  const availableCredit = Math.max(0, numLimit - currentDebt)
  const usagePercentage = numLimit > 0 ? Math.min(100, Math.round((currentDebt / numLimit) * 100)) : 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await updateCustomerCreditLimitAction(customerId, numLimit)
      setOpen(false)
      if (onUpdated) onUpdated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el crédito.')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickSet(amount: number) {
    setCreditLimit(amount.toString())
  }

  function handleQuickAdd(amount: number) {
    setCreditLimit((numLimit + amount).toString())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (triggerButton ? (
            triggerButton
          ) : (
            <Button size="xs" variant="outline" className="gap-1 text-xs">
              <DollarSign className="size-3 text-emerald-600" />
              <span>Modificar Límite</span>
            </Button>
          )) as React.ReactElement
        }
      />
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <span>Gestionar Límite de Crédito</span>
            </DialogTitle>
            <DialogDescription>
              Asigna o ajusta la línea de crédito autorizada para <strong>{customerName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-2 border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            {/* Status overview cards */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Deuda Actual</span>
                <p className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ${currentDebt.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Límite Actual</span>
                <p className="text-base font-bold text-foreground font-mono">
                  ${currentCreditLimit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Input for new limit */}
            <div className="space-y-2">
              <Label htmlFor="new_limit" className="font-semibold text-foreground">
                Nuevo Límite de Crédito ($)
              </Label>
              <div className="relative">
                <DollarSign className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new_limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="pl-8 text-sm font-semibold font-mono h-10"
                  required
                />
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-medium mr-1">Rápidos:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px] h-6 px-2"
                  onClick={() => handleQuickSet(0)}
                >
                  $0 (Sin crédito)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px] h-6 px-2"
                  onClick={() => handleQuickSet(100)}
                >
                  $100
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px] h-6 px-2"
                  onClick={() => handleQuickSet(250)}
                >
                  $250
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px] h-6 px-2"
                  onClick={() => handleQuickAdd(50)}
                >
                  +$50
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="text-[11px] h-6 px-2"
                  onClick={() => handleQuickAdd(100)}
                >
                  +$100
                </Button>
              </div>
            </div>

            {/* Credit Gauge & Available Preview */}
            <div className="p-3 bg-background rounded-lg border space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Utilización con nuevo límite:</span>
                <span className="font-semibold text-foreground">{usagePercentage}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    usagePercentage > 90
                      ? 'bg-rose-500'
                      : usagePercentage > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-muted-foreground">Crédito Disponible Proyectado:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${availableCredit.toFixed(2)}
                </span>
              </div>
              {numLimit < currentDebt && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>El nuevo límite es inferior a la deuda actual del cliente (${currentDebt.toFixed(2)}).</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="font-semibold">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Guardar Límite'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
