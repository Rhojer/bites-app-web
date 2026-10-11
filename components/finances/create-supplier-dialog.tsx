'use client'

import { useState } from 'react'
import { Plus, Loader2, Building2, Phone, Mail, FileText, Calendar, UserCheck } from 'lucide-react'
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
import { createSupplierAction } from '@/app/finances/actions'

interface CreateSupplierDialogProps {
  trigger?: React.ReactElement
  onSuccess?: (supplier: { id: string; name: string; credit_days?: number | null }) => void
}

export function CreateSupplierDialog({ trigger, onSuccess }: CreateSupplierDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await createSupplierAction(formData)
      setOpen(false)
      form.reset()
      if (res?.supplier && onSuccess) {
        onSuccess(res.supplier)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el proveedor')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button size="sm" variant="outline" className="gap-1.5 shadow-xs">
      <Building2 className="size-4 text-primary" />
      <span>Nuevo Proveedor</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Registrar Nuevo Proveedor
            </DialogTitle>
            <DialogDescription>
              Añade una empresa o distribuidor comercial para gestionar facturas por pagar y abastecimiento de insumos.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre / Razón Social *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: Carnes Premium La Hacienda"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tax_id">RIF / Identificación Fiscal</Label>
                <Input
                  id="tax_id"
                  name="tax_id"
                  placeholder="Ej: J-30495821-4"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="credit_days">Días de Crédito Habitual</Label>
                <Input
                  id="credit_days"
                  name="credit_days"
                  type="number"
                  min="0"
                  max="180"
                  defaultValue="15"
                  placeholder="15"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Persona de Contacto</Label>
              <div className="relative">
                <UserCheck className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact_name"
                  name="contact_name"
                  placeholder="Ej: Carlos Mendoza (Gerente Comercial)"
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <div className="relative">
                  <Phone className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+58 414-555-1234"
                    className="pl-8 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ventas@proveedor.com"
                    className="pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas / Condiciones Comerciales</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Ej: Descuento 5% pronto pago, entrega días martes y jueves"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Guardar Proveedor</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
