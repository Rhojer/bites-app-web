'use client'

import { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Edit2,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UpdateCreditDialog } from './update-credit-dialog'
import { RecordCreditPaymentDialog } from './record-credit-payment-dialog'
import { updateCustomerAction } from '@/app/crm/actions'

export interface CustomerProfile {
  id: string
  created_at: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  phone: string | null
  address: string | null
  role: string | null
  credit_limit: number | null
  current_debt: number | null
  birth_date: string | null
  total_orders_count: number | null
  total_spent: number | null
}

interface CustomerDetailDialogProps {
  customer: CustomerProfile
  paymentMethods: { id: string; name: string; currency: string | null }[]
  allCustomersForPayment: { id: string; full_name: string | null; current_debt: number | null; credit_limit: number | null }[]
  triggerButton?: React.ReactElement
  onCustomerUpdated?: () => void
}

export function CustomerDetailDialog({
  customer,
  paymentMethods,
  allCustomersForPayment,
  triggerButton,
  onCustomerUpdated,
}: CustomerDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const creditLimit = customer.credit_limit || 0
  const currentDebt = customer.current_debt || 0
  const totalSpent = customer.total_spent || 0
  const totalOrders = customer.total_orders_count || 0
  const avgTicket = totalOrders > 0 ? totalSpent / totalOrders : 0
  const isVip = totalSpent >= 100 || totalOrders >= 5

  const creditUsagePct = creditLimit > 0 ? Math.min(100, Math.round((currentDebt / creditLimit) * 100)) : 0
  const availableCredit = Math.max(0, creditLimit - currentDebt)

  // WhatsApp formatted link
  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : null
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('customer_id', customer.id)

    try {
      await updateCustomerAction(formData)
      setIsEditing(false)
      if (onCustomerUpdated) onCustomerUpdated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar información.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (triggerButton ? (
            triggerButton
          ) : (
            <Button size="xs" variant="ghost" className="text-xs">
              Ver Ficha
            </Button>
          )) as React.ReactElement
        }
      />
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center">
                {customer.full_name
                  ? customer.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'CL'}
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>{customer.full_name || 'Cliente Sin Nombre'}</span>
                  {isVip && (
                    <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-[10px] gap-1 px-1.5 py-0">
                      VIP
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Cliente desde {new Date(customer.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-1 text-xs"
            >
              <Edit2 className="size-3" />
              <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-2 border border-destructive/20 font-medium">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-3 py-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input id="full_name" name="full_name" defaultValue={customer.full_name || ''} required className="text-xs h-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <Input id="phone" name="phone" defaultValue={customer.phone || ''} className="text-xs h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birth_date">Fecha de Cumpleaños</Label>
                <Input id="birth_date" name="birth_date" type="date" defaultValue={customer.birth_date || ''} className="text-xs h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" defaultValue={customer.email || ''} className="text-xs h-9" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={customer.address || ''} className="text-xs h-9" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                Guardar Cambios
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-3 text-xs">
            {/* KPI Cards del Cliente */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                  <DollarSign className="size-3.5 text-emerald-600" />
                  <span>Total Gastado</span>
                </div>
                <p className="text-lg font-bold text-foreground font-mono">${totalSpent.toFixed(2)}</p>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                  <ShoppingBag className="size-3.5 text-primary" />
                  <span>Frecuencia / Visitas</span>
                </div>
                <p className="text-lg font-bold text-foreground font-mono">{totalOrders} ordenes</p>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                  <TrendingUp className="size-3.5 text-blue-600" />
                  <span>Ticket Promedio</span>
                </div>
                <p className="text-lg font-bold text-foreground font-mono">${avgTicket.toFixed(2)}</p>
              </div>
            </div>

            {/* Datos de Contacto */}
            <div className="p-3 bg-card rounded-xl border space-y-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Información de Contacto & Ficha
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5" />
                    <span className="text-foreground font-medium">{customer.phone || 'No registrado'}</span>
                  </div>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                    >
                      <MessageCircle className="size-3" /> WhatsApp
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span className="text-foreground font-medium truncate">{customer.email || 'No registrado'}</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span className="text-foreground font-medium">
                    {customer.birth_date
                      ? new Date(customer.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })
                      : 'Cumpleaños no registrado'}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span className="text-foreground font-medium truncate">{customer.address || 'Sin dirección registrada'}</span>
                </div>
              </div>
            </div>

            {/* Panel de Cuenta Corriente / Crédito */}
            <div className="p-3 bg-card rounded-xl border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-primary" />
                  Estado de Cuenta Corriente
                </span>
                <div className="flex items-center gap-2">
                  <UpdateCreditDialog
                    customerId={customer.id}
                    customerName={customer.full_name || 'Cliente'}
                    currentCreditLimit={creditLimit}
                    currentDebt={currentDebt}
                    onUpdated={onCustomerUpdated}
                  />
                  {currentDebt > 0 && (
                    <RecordCreditPaymentDialog
                      customers={allCustomersForPayment}
                      paymentMethods={paymentMethods}
                      initialCustomerId={customer.id}
                      onPaymentRecorded={onCustomerUpdated}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-muted/30">
                <div>
                  <span className="text-[10px] text-muted-foreground">Límite Autorizado</span>
                  <p className="text-sm font-bold text-foreground font-mono">${creditLimit.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Deuda Actual</span>
                  <p className={`text-sm font-bold font-mono ${currentDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                    ${currentDebt.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Crédito Disponible</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${availableCredit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Barra de progreso de crédito */}
              {creditLimit > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Uso de la línea de crédito:</span>
                    <span className="font-semibold text-foreground">{creditUsagePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        creditUsagePct > 90
                          ? 'bg-rose-500'
                          : creditUsagePct > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${creditUsagePct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic text-center py-1">
                  El cliente no tiene línea de crédito autorizada actualmente.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cerrar Ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
