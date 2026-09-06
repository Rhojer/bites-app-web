'use client'

import { useState } from 'react'
import {
  Search,
  Users,
  DollarSign,
  CreditCard,
  Crown,
  Cake,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  SlidersHorizontal,
  UserPlus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CustomerDetailDialog, CustomerProfile } from './customer-detail-sheet'
import { UpdateCreditDialog } from './update-credit-dialog'
import { RecordCreditPaymentDialog } from './record-credit-payment-dialog'
import { CreateCustomerDialog } from './create-customer-dialog'

interface CustomersDirectoryProps {
  customers: CustomerProfile[]
  paymentMethods: { id: string; name: string; currency: string | null }[]
}

export function CustomersDirectory({ customers, paymentMethods }: CustomersDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'with_debt' | 'with_credit' | 'vip' | 'birthday'>('all')

  const currentMonth = new Date().getMonth() + 1

  const filteredCustomers = customers.filter((customer) => {
    // Text search
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (customer.full_name && customer.full_name.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.toLowerCase().includes(term)) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.address && customer.address.toLowerCase().includes(term))

    if (!matchesSearch) return false

    // Segment Filter
    if (filter === 'with_debt') {
      return (customer.current_debt || 0) > 0
    }
    if (filter === 'with_credit') {
      return (customer.credit_limit || 0) > 0
    }
    if (filter === 'vip') {
      return (customer.total_spent || 0) >= 100 || (customer.total_orders_count || 0) >= 5
    }
    if (filter === 'birthday') {
      if (!customer.birth_date) return false
      try {
        const d = new Date(customer.birth_date)
        return d.getMonth() + 1 === currentMonth
      } catch {
        return false
      }
    }

    return true
  })

  // Quick stats for filter pills
  const countWithDebt = customers.filter((c) => (c.current_debt || 0) > 0).length
  const countWithCredit = customers.filter((c) => (c.credit_limit || 0) > 0).length
  const countVip = customers.filter((c) => (c.total_spent || 0) >= 100 || (c.total_orders_count || 0) >= 5).length
  const countBirthday = customers.filter((c) => {
    if (!c.birth_date) return false
    try {
      return new Date(c.birth_date).getMonth() + 1 === currentMonth
    } catch {
      return false
    }
  }).length

  const allCustomersForPayment = customers.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    current_debt: c.current_debt,
    credit_limit: c.credit_limit,
  }))

  return (
    <div className="space-y-4">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Button
            size="xs"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="text-xs h-8"
          >
            Todos ({customers.length})
          </Button>

          <Button
            size="xs"
            variant={filter === 'with_debt' ? 'default' : 'outline'}
            onClick={() => setFilter('with_debt')}
            className={`text-xs h-8 ${filter !== 'with_debt' && countWithDebt > 0 ? 'text-rose-600 border-rose-500/30' : ''}`}
          >
            Con Deuda ({countWithDebt})
          </Button>

          <Button
            size="xs"
            variant={filter === 'with_credit' ? 'default' : 'outline'}
            onClick={() => setFilter('with_credit')}
            className="text-xs h-8"
          >
            Con Crédito ({countWithCredit})
          </Button>

          <Button
            size="xs"
            variant={filter === 'vip' ? 'default' : 'outline'}
            onClick={() => setFilter('vip')}
            className="text-xs h-8 gap-1"
          >
            <Crown className="size-3 text-amber-500" />
            <span>VIP ({countVip})</span>
          </Button>

          <Button
            size="xs"
            variant={filter === 'birthday' ? 'default' : 'outline'}
            onClick={() => setFilter('birthday')}
            className="text-xs h-8 gap-1"
          >
            <Cake className="size-3 text-pink-500" />
            <span>Cumpleañeros ({countBirthday})</span>
          </Button>
        </div>
      </div>

      {/* Main Table with Clean Horizontal Scrolling */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Cliente / Contacto</th>
                <th className="py-3.5 px-4 text-center">Frecuencia</th>
                <th className="py-3.5 px-4 text-right">Total Gastado</th>
                <th className="py-3.5 px-4">Línea de Crédito</th>
                <th className="py-3.5 px-4 text-right">Deuda Actual</th>
                <th className="py-3.5 px-4">Estado Cuenta</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-muted-foreground">
                    <Users className="size-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="font-semibold text-sm text-foreground">No se encontraron clientes</p>
                    <p className="text-xs text-muted-foreground">Prueba con otro término de búsqueda o registra un nuevo cliente.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const creditLimit = customer.credit_limit || 0
                  const currentDebt = customer.current_debt || 0
                  const totalSpent = customer.total_spent || 0
                  const totalOrders = customer.total_orders_count || 0
                  const isVip = totalSpent >= 100 || totalOrders >= 5

                  const usagePct = creditLimit > 0 ? Math.min(100, Math.round((currentDebt / creditLimit) * 100)) : 0
                  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : null

                  return (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      {/* Cliente & Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {customer.full_name
                              ? customer.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()
                              : 'CL'}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground truncate">{customer.full_name || 'Sin Nombre'}</span>
                              {isVip && (
                                <Badge variant="default" className="bg-amber-500 text-[9px] px-1.5 py-0 h-4 font-bold">
                                  VIP
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {customer.phone && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="size-2.5" />
                                  {customer.phone}
                                </span>
                              )}
                              {customer.email && (
                                <span className="truncate max-w-[140px]">{customer.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Frecuencia / Visitas */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-foreground">{totalOrders}</span>
                        <span className="text-muted-foreground text-[11px]"> visitas</span>
                      </td>

                      {/* Total Gastado */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${totalSpent.toFixed(2)}
                      </td>

                      {/* Línea de Crédito */}
                      <td className="py-3.5 px-4">
                        {creditLimit > 0 ? (
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-semibold">${creditLimit.toFixed(2)}</span>
                              <span className="text-[10px] text-muted-foreground">{usagePct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usagePct > 90
                                    ? 'bg-rose-500'
                                    : usagePct > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${usagePct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Sin crédito</span>
                        )}
                      </td>

                      {/* Deuda Actual */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {currentDebt > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">${currentDebt.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">$0.00</span>
                        )}
                      </td>

                      {/* Estado Cuenta */}
                      <td className="py-3.5 px-4">
                        {currentDebt > 0 && currentDebt > creditLimit && creditLimit > 0 ? (
                          <Badge variant="destructive" className="text-[10px] gap-1 font-semibold">
                            <AlertTriangle className="size-3" /> Sobregiro
                          </Badge>
                        ) : currentDebt > 0 ? (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] border-amber-500/30 font-semibold">
                            Deuda Activa
                          </Badge>
                        ) : creditLimit > 0 ? (
                          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-500/30 font-semibold bg-emerald-500/5">
                            <CheckCircle2 className="size-3 text-emerald-600" /> Solvente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Contado
                          </Badge>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón rápido Abonar */}
                          {currentDebt > 0 && (
                            <RecordCreditPaymentDialog
                              customers={allCustomersForPayment}
                              paymentMethods={paymentMethods}
                              initialCustomerId={customer.id}
                              triggerButton={
                                <Button size="xs" variant="outline" className="h-8 px-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10 rounded-lg active:scale-95 transition-transform">
                                  Abonar
                                </Button>
                              }
                            />
                          )}

                          {/* Ajustar Crédito */}
                          <UpdateCreditDialog
                            customerId={customer.id}
                            customerName={customer.full_name || 'Cliente'}
                            currentCreditLimit={creditLimit}
                            currentDebt={currentDebt}
                            triggerButton={
                              <Button size="xs" variant="ghost" className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-lg">
                                Crédito
                              </Button>
                            }
                          />

                          {/* Ver Ficha Detallada */}
                          <CustomerDetailDialog
                            customer={customer}
                            paymentMethods={paymentMethods}
                            allCustomersForPayment={allCustomersForPayment}
                            triggerButton={
                              <Button size="xs" variant="ghost" className="h-8 px-2.5 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg">
                                Ver Ficha
                              </Button>
                            }
                          />

                          {/* WhatsApp Directo */}
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="size-8 rounded-lg hover:bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-colors shrink-0"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageCircle className="size-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
