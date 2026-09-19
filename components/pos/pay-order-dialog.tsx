'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banknote, CreditCard, Smartphone, CheckCircle2, Loader2, AlertCircle, Coins } from 'lucide-react'
import { payActiveOrderAction } from '@/app/pos/actions'
import { formatBs, convertUsdToBs } from '@/lib/bcv'
import { CustomerSelector, CustomerOption } from '@/components/pos/customer-selector'

interface PayOrderDialogProps {
  order: {
    id: string
    customer_id?: string | null
    customer_name: string | null
    table_name?: string | null
    total: number
    type: string
  } | null
  customers?: CustomerOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const CASH_DENOMINATIONS = [5, 10, 20, 50, 100]

export function PayOrderDialog({
  order,
  customers = [],
  open,
  onOpenChange,
  onSuccess,
}: PayOrderDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('Efectivo USD')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [cashTendered, setCashTendered] = useState('')
  const [bcvRate, setBcvRate] = useState(813.74)
  const [loading, setLoading] = useState(false)
  const [refError, setRefError] = useState('')

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    fetch(`${basePath}/api/bcv`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.rate) setBcvRate(data.rate)
      })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (order) {
      setSelectedCustomerId(order.customer_id || null)
      setCustomerName(order.customer_name || '')
    }
  }, [order])

  if (!order) return null

  const total = order.total || 0
  const totalBs = convertUsdToBs(total, bcvRate)
  const isCashUSD = paymentMethod === 'Efectivo USD'
  const isCashBs = paymentMethod === 'Efectivo Bs'
  const isCash = isCashUSD || isCashBs
  const isCredit = paymentMethod === 'Crédito'
  const numericTendered = parseFloat(cashTendered) || 0
  const changeDueUSD = Math.max(0, numericTendered - total)
  const changeDueBs = Math.max(0, numericTendered - totalBs)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null

  async function handleConfirmPayment() {
    if (!order) return

    // Validar cliente para crédito
    if (isCredit && !selectedCustomerId) {
      setRefError('Para cobrar a crédito debes seleccionar un cliente registrado.')
      return
    }

    // Validar referencia bancaria obligatoria para métodos no efectivo y no crédito
    if (!isCash && !isCredit && !referenceNumber.trim()) {
      setRefError('Por favor ingresa el número de referencia bancaria.')
      return
    }

    setRefError('')
    setLoading(true)

    try {
      const defaultRef = isCredit
        ? 'VENTA-A-CREDITO'
        : isCashUSD
        ? 'POS-EFECTIVO-USD'
        : isCashBs
        ? 'POS-EFECTIVO-BS'
        : referenceNumber.trim()

      await payActiveOrderAction({
        orderId: order.id,
        paymentMethodName: paymentMethod,
        total,
        referenceNumber: defaultRef,
        customerId: selectedCustomerId || order.customer_id || null,
      })

      onOpenChange(false)
      setCashTendered('')
      setReferenceNumber('')
      if (onSuccess) onSuccess()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setReferenceNumber(''); setRefError(''); } }}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Cobrar Pedido #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription className="text-xs">
            Cliente: <span className="font-semibold text-foreground">{order.customer_name || 'Salón'}</span>
            {order.table_name && ` • ${order.table_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Monto Total: $ Principal y Bolívares Secundario */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs">Total a Cobrar:</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-primary">${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-primary/20 text-xs">
              <span className="text-muted-foreground">Equivalente BCV ({bcvRate.toFixed(2)} Bs/$):</span>
              <span className="font-mono font-extrabold text-foreground">{formatBs(totalBs)}</span>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground">Seleccionar Método de Pago:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: 'Efectivo USD', icon: Banknote, label: '💵 Efectivo $' },
                { name: 'Efectivo Bs', icon: Banknote, label: '🇻🇪 Efectivo Bs' },
                { name: 'Pago Móvil', icon: Smartphone, label: '🏦 Pago Móvil' },
                { name: 'Punto de Venta / Tarjeta', icon: CreditCard, label: '💳 Punto / Tarjeta' },
                { name: 'Zelle', icon: Smartphone, label: '📱 Zelle ($)' },
                { name: 'Crédito', icon: Coins, label: '👥 Venta Crédito', highlight: true },
              ].map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m.name)
                    setRefError('')
                    setCashTendered('')
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                    paymentMethod === m.name
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : m.highlight
                      ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10'
                      : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {m.icon && <m.icon className="size-4 shrink-0" />}
                  <span className="truncate">{m.label || m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Si es Crédito: Selección de Cliente Registrado y Simulación de Saldo */}
          {isCredit && (
            <div className="p-3.5 rounded-xl border bg-indigo-500/10 border-indigo-500/20 space-y-3">
              <CustomerSelector
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={(cust) => {
                  setSelectedCustomerId(cust?.id || null)
                  setCustomerName(cust?.full_name || '')
                }}
                customName={customerName}
                onChangeCustomName={setCustomerName}
                isCreditSale={true}
                totalAmount={total}
              />
            </div>
          )}

          {/* Campo de Referencia Obligatorio para Pagos Electrónicos */}
          {!isCash && !isCredit && (
            <div className="p-3.5 rounded-xl border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <span>Nº Referencia / Comprobante:</span>
                  <span className="text-destructive font-black">*</span>
                </label>
                {paymentMethod === 'Pago Móvil' && (
                  <span className="text-[11px] font-mono font-bold text-primary">
                    Monto: {formatBs(totalBs)}
                  </span>
                )}
              </div>
              <Input
                placeholder="Ej. 123456 (Últimos 4-6 dígitos del comprobante)..."
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value)
                  if (e.target.value.trim()) setRefError('')
                }}
                className={`h-9 text-xs font-mono ${refError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                autoFocus
              />
              {refError ? (
                <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                  <AlertCircle className="size-3" /> {refError}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Se registrará en el recibo de caja y en la conciliación financiera.
                </p>
              )}
            </div>
          )}

          {/* Calculadora de Vuelto para Efectivo USD */}
          {isCashUSD && (
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Dólares Recibidos ($):</span>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="h-8 pl-6 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCashTendered(total.toFixed(2))}
                  className="text-[11px] px-2 py-1 rounded-lg bg-card border font-mono font-semibold hover:border-primary transition-colors"
                >
                  Exacto (${total.toFixed(2)})
                </button>
                {CASH_DENOMINATIONS.map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => setCashTendered(denom.toString())}
                    className="text-[11px] px-2 py-1 rounded-lg bg-card border font-mono font-medium hover:border-primary transition-colors"
                  >
                    ${denom}
                  </button>
                ))}
              </div>

              {numericTendered >= total && (
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Vuelto a entregar ($):</span>
                  <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                    ${changeDueUSD.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Calculadora de Vuelto para Efectivo Bs */}
          {isCashBs && (
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Bolívares Recibidos (Bs):</span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-[10px]">Bs.</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="h-8 pl-8 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashTendered(totalBs.toFixed(2))}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-card border font-mono font-semibold hover:border-primary transition-colors"
                >
                  Exacto (Bs. {totalBs.toFixed(2)})
                </button>
              </div>

              {numericTendered >= totalBs && (
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Vuelto a entregar (Bs):</span>
                  <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                    Bs. {changeDueBs.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-10 rounded-xl text-xs">
            Guardar / Mantener por Cobrar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={loading}
            className={`gap-2 font-bold h-10 rounded-xl shadow-xs ${
              isCredit ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-primary text-primary-foreground'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                {isCredit ? `Cargar a Crédito ($${total.toFixed(2)})` : `Confirmar Pago ($${total.toFixed(2)})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
