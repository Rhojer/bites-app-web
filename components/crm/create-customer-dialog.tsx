'use client'

import { useState } from 'react'
import { PlusCircle, Loader2, UserPlus, DollarSign, Phone, Mail, MapPin, Calendar } from 'lucide-react'
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
import { createCustomerAction } from '@/app/crm/actions'

export function CreateCustomerDialog({ onCustomerCreated }: { onCustomerCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      await createCustomerAction(formData)
      setOpen(false)
      if (onCustomerCreated) onCustomerCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cliente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5 shadow-xs font-semibold">
            <UserPlus className="size-4" />
            <span>Nuevo Cliente</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              <span>Registrar Nuevo Cliente</span>
            </DialogTitle>
            <DialogDescription>
              Añade un nuevo cliente al directorio para registrar sus consumos, historial y asignarle línea de crédito.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-2 border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre y Apellido *</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Ej: Carlos Mendoza"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="size-3 text-muted-foreground" />
                  <span>Teléfono / WhatsApp</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+58 412 1234567"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birth_date" className="flex items-center gap-1">
                  <Calendar className="size-3 text-muted-foreground" />
                  <span>Fecha de Cumpleaños</span>
                </Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="size-3 text-muted-foreground" />
                <span>Correo Electrónico</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" />
                <span>Dirección de Entrega / Facturación</span>
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="Av. Principal, Edif. Torre Centro, Apto 4B"
                className="text-xs h-9"
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="credit_limit" className="font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Límite de Crédito Inicial ($)</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">Cuenta Corriente</span>
              </div>
              <Input
                id="credit_limit"
                name="credit_limit"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="text-xs h-9 bg-background"
                placeholder="0.00"
              />
              <p className="text-[11px] text-muted-foreground">
                Permite al cliente acumular consumo y pagar al corte de mes o semana.
              </p>
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
                  Guardando...
                </>
              ) : (
                'Registrar Cliente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
