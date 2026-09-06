'use client'

import { useState } from 'react'
import { User, Users, Search, Check, Plus, AlertTriangle, ShieldCheck, DollarSign, X, Phone, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface CustomerOption {
  id: string
  full_name: string | null
  phone: string | null
  current_debt: number | null
  credit_limit: number | null
}

interface CustomerSelectorProps {
  customers: CustomerOption[]
  selectedCustomerId: string | null
  onSelectCustomer: (customer: CustomerOption | null) => void
  customName: string
  onChangeCustomName: (name: string) => void
  isCreditSale?: boolean
  totalAmount?: number
}

export function CustomerSelector({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  customName,
  onChangeCustomName,
  isCreditSale = false,
  totalAmount = 0,
}: CustomerSelectorProps) {
  // Mode: 'registered' (cliente registrado en CRM) vs 'guest' (nombre manual/mostrador)
  const [mode, setMode] = useState<'registered' | 'guest'>(
    isCreditSale || selectedCustomerId || customers.length > 0 ? 'registered' : 'guest'
  )
  const [searchTerm, setSearchTerm] = useState('')

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null

  const filteredCustomers = customers.filter((c) => {
    if (!c.full_name) return false
    const nameMatch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const phoneMatch = c.phone ? c.phone.includes(searchTerm) : false
    return nameMatch || phoneMatch
  })

  const currentDebt = selectedCustomer?.current_debt || 0
  const creditLimit = selectedCustomer?.credit_limit || 0
  const availableCredit = Math.max(0, creditLimit - currentDebt)
  const remainingAfterSale = creditLimit - (currentDebt + totalAmount)
  const exceedsCredit = isCreditSale && creditLimit > 0 && currentDebt + totalAmount > creditLimit

  return (
    <div className="space-y-2.5">
      {/* Encabezado y Selector de Modo */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <User className="size-3.5 text-primary" />
          <span>Cliente de la Orden:</span>
          {isCreditSale && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold">
              Crédito Obligatorio
            </Badge>
          )}
        </label>

        {!isCreditSale && (
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
            <button
              type="button"
              onClick={() => {
                setMode('registered')
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                mode === 'registered'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👥 Registrado ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('guest')
                onSelectCustomer(null)
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                mode === 'guest'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ✍️ Ocasional
            </button>
          </div>
        )}
      </div>

      {/* 1. MODO: CLIENTE REGISTRADO */}
      {(mode === 'registered' || isCreditSale) && (
        <div className="space-y-2">
          {selectedCustomer ? (
            /* Tarjeta de Cliente Seleccionado */
            <div className="p-3 rounded-xl border bg-primary/10 border-primary/30 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-foreground">{selectedCustomer.full_name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-bold">
                      Registrado
                    </Badge>
                  </div>
                  {selectedCustomer.phone && (
                    <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      <Phone className="size-3" /> {selectedCustomer.phone}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    onSelectCustomer(null)
                    onChangeCustomName('')
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                >
                  <X className="size-3.5" /> Cambiar
                </Button>
              </div>

              {/* Indicadores de Crédito y Deuda */}
              <div className="pt-2 border-t border-primary/20 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-card/70 p-1.5 rounded-lg border border-primary/15">
                  <span className="text-[10px] text-muted-foreground block font-medium">Deuda Actual:</span>
                  <span className={`font-mono font-black ${currentDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ${currentDebt.toFixed(2)}
                  </span>
                </div>

                <div className="bg-card/70 p-1.5 rounded-lg border border-primary/15">
                  <span className="text-[10px] text-muted-foreground block font-medium">Límite Crédito:</span>
                  <span className="font-mono font-bold text-foreground">
                    ${creditLimit.toFixed(2)}
                  </span>
                </div>

                <div className="bg-card/70 p-1.5 rounded-lg border border-primary/15 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-muted-foreground block font-medium">Disponible:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${availableCredit.toFixed(2)}
                  </span>
                </div>
              </div>

              {exceedsCredit && (
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Esta orden (${totalAmount.toFixed(2)}) excede el crédito disponible (${availableCredit.toFixed(2)}).</span>
                </div>
              )}
            </div>
          ) : (
            /* Lista y Selector Desplegable de Clientes */
            <div className="space-y-2">
              {/* Selector Select Directo */}
              <div className="relative">
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value) || null
                    onSelectCustomer(cust)
                    if (cust?.full_name) onChangeCustomName(cust.full_name)
                  }}
                  className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
                >
                  <option value="">-- Seleccionar Cliente Registrado ({customers.length} disponibles) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} {c.phone ? `(${c.phone})` : ''} - Deuda: ${(c.current_debt || 0).toFixed(2)} / Límite: ${(c.credit_limit || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buscador Rápido y Chips */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar clientes por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs bg-muted/20"
                  />
                </div>

                {/* Chips de Selección Rápida con 1 Clic */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {filteredCustomers.slice(0, 6).map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(cust)
                        onChangeCustomName(cust.full_name || '')
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg border bg-card hover:bg-primary/10 hover:border-primary/50 text-foreground font-semibold shrink-0 transition-colors flex items-center gap-1"
                    >
                      <span>👤 {cust.full_name}</span>
                      {(cust.current_debt || 0) > 0 && (
                        <span className="text-amber-600 font-mono text-[9px]">
                          (${(cust.current_debt || 0).toFixed(0)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MODO: CLIENTE OCASIONAL / SALÓN */}
      {mode === 'guest' && !isCreditSale && (
        <div className="space-y-1.5">
          <Input
            placeholder="Escribir nombre del cliente o mesa (ej: Mesa 4, Juan Pérez)..."
            value={customName}
            onChange={(e) => onChangeCustomName(e.target.value)}
            className="h-9 text-xs bg-card"
          />
          <p className="text-[10px] text-muted-foreground">
            Para registrar una venta a crédito con cuenta corriente, cambia a &quot;Cliente Registrado&quot;.
          </p>
        </div>
      )}
    </div>
  )
}
