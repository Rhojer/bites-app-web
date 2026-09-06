'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, DollarSign, Building2, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { payBillAction } from '@/app/finances/actions'

interface BillForPayment {
  id: string
  invoice_number?: string | null
  amount: number
  due_date: string
  supplierName: string
}

interface PayBillDialogProps {
  bill: BillForPayment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayBillDialog({ bill, open, onOpenChange }: PayBillDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registerAsExpense, setRegisterAsExpense] = useState(true)

  if (!bill) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('bill_id', bill!.id)
    formData.append('register_as_expense', registerAsExpense ? 'true' : 'false')

    try {
      await payBillAction(formData)
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al liquidar la factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
              Liquidar Factura de Proveedor
            </DialogTitle>
            <DialogDescription>
              Confirma el pago de la factura para cambiar su estado en el semáforo y registrar el egreso contable.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="my-4 p-4 rounded-xl border bg-muted/40 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Proveedor:</span>
              <span className="font-semibold text-foreground">{bill.supplierName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">N° Factura:</span>
              <span className="font-mono font-medium text-foreground">
                {bill.invoice_number || 'Sin número'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fecha Vencimiento:</span>
              <span className="font-mono text-muted-foreground">{bill.due_date}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-foreground">Total a Liquidar:</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ${bill.amount.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="payment_notes">Referencia / Comprobante de Pago</Label>
              <Input
                id="payment_notes"
                name="payment_notes"
                placeholder="Ej: Transferencia Banco Mercantil Ref #984214 / Zelle"
                className="text-xs"
                required
              />
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-card">
              <input
                type="checkbox"
                id="register_as_expense"
                checked={registerAsExpense}
                onChange={(e) => setRegisterAsExpense(e.target.checked)}
                className="mt-0.5 rounded border-input size-4 text-primary focus:ring-primary"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="register_as_expense"
                  className="font-medium text-foreground cursor-pointer text-xs"
                >
                  Asentar automáticamente en Gastos Operativos (P&L)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Registrará un gasto variable en la categoría &quot;Pago a Proveedores&quot; para impactar el flujo de caja y P&L.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Confirmar Pago (${bill.amount.toFixed(2)})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
