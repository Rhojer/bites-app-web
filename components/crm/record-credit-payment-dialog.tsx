'use client'

import { useState } from 'react'
import { CreditCard, DollarSign, Loader2, Receipt, ArrowRight, CheckCircle } from 'lucide-react'
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
import { recordCreditPaymentAction } from '@/app/crm/actions'

interface CustomerOption {
  id: string
  full_name: string | null
  current_debt: number | null
  credit_limit: number | null
}

interface PaymentMethodOption {
  id: string
  name: string
  currency: string | null
}

interface RecordCreditPaymentDialogProps {
  customers: CustomerOption[]
  paymentMethods: PaymentMethodOption[]
  initialCustomerId?: string
  triggerButton?: React.ReactElement
  onPaymentRecorded?: () => void
}

export function RecordCreditPaymentDialog({
  customers,
  paymentMethods,
  initialCustomerId,
  triggerButton,
  onPaymentRecorded,
}: RecordCreditPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialCustomerId || (customers.find((c) => (c.current_debt || 0) > 0)?.id || customers[0]?.id || '')
  )
  const [amount, setAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id || '')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const currentDebt = selectedCustomer?.current_debt || 0
  const numAmount = parseFloat(amount) || 0
  const remainingDebt = Math.max(0, currentDebt - numAmount)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (numAmount <= 0) {
      setError('El monto del abono debe ser mayor a 0.')
      setLoading(false)
      return
    }

    if (currentDebt <= 0) {
      setError('Este cliente no posee deuda pendiente.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('customer_id', selectedCustomerId)
    formData.append('amount', numAmount.toString())
    formData.append('payment_method_id', paymentMethodId)
    formData.append('reference_number', referenceNumber)
    formData.append('notes', notes)

    try {
      await recordCreditPaymentAction(formData)
      setOpen(false)
      setAmount('')
      setReferenceNumber('')
      setNotes('')
      if (onPaymentRecorded) onPaymentRecorded()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el abono.')
    } finally {
      setLoading(false)
    }
  }

  function handlePayFullDebt() {
    setAmount(currentDebt.toFixed(2))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (triggerButton ? (
            triggerButton
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5 shadow-xs border-emerald-500/30 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-semibold">
              <CreditCard className="size-4 text-emerald-600" />
              <span>Registrar Abono</span>
            </Button>
          )) as React.ReactElement
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Receipt className="size-5" />
              <span>Registrar Abono a Crédito</span>
            </DialogTitle>
            <DialogDescription>
              Registra un pago parcial o total para amortizar la cuenta corriente del cliente.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-2 border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            {/* Customer selector */}
            <div className="space-y-1.5">
              <Label htmlFor="customer_select">Cliente Deudor *</Label>
              <select
                id="customer_select"
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value)
                  setAmount('')
                }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id} className="bg-popover text-popover-foreground">
                    {cust.full_name || 'Sin nombre'} (Deuda: ${(cust.current_debt || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Debt & Calculation Card */}
            <div className="p-3 bg-muted/40 rounded-xl border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Deuda Pendiente Actual:</span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ${currentDebt.toFixed(2)}
                </span>
              </div>

              {currentDebt > 0 && (
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handlePayFullDebt}
                    className="text-[11px] h-6 px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                  >
                    Pagar Deuda Total (${currentDebt.toFixed(2)})
                  </Button>
                </div>
              )}
            </div>

            {/* Amount and Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto del Abono ($) *</Label>
                <div className="relative">
                  <DollarSign className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="pl-7 text-xs font-semibold font-mono h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment_method">Método de Pago *</Label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id} className="bg-popover text-popover-foreground">
                      {pm.name} {pm.currency ? `(${pm.currency})` : ''}
                    </option>
                  ))}
                  {paymentMethods.length === 0 && (
                    <>
                      <option value="cash">Efectivo (USD)</option>
                      <option value="zelle">Zelle</option>
                      <option value="pos">Punto de Venta / Tarjeta</option>
                      <option value="pago_movil">Pago Móvil</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Reference Number */}
            <div className="space-y-1.5">
              <Label htmlFor="reference_number">Número de Referencia / Comprobante</Label>
              <Input
                id="reference_number"
                name="reference_number"
                placeholder="Ej: ZELLE-94827 o Lote 459"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas / Observaciones</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Ej: Abono parcial acuerdo fin de mes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Live calculation banner */}
            {numAmount > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span>Balance tras aplicar abono:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-xs">
                    <span className="line-through text-muted-foreground">${currentDebt.toFixed(2)}</span>
                    <ArrowRight className="size-3 text-emerald-600" />
                    <span className="text-emerald-600 dark:text-emerald-400">${remainingDebt.toFixed(2)}</span>
                  </div>
                </div>
                {remainingDebt === 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle className="size-3.5" /> ¡La cuenta quedará totalmente solvente!
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || currentDebt <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Procesando Abono...
                </>
              ) : (
                'Confirmar Abono'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
