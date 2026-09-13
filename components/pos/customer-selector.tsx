'use client'

import { useState } from 'react'
import { User, Users, Search, Check, Plus, AlertTriangle, ShieldCheck, DollarSign, X, Phone, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { ButtonGroup, ButtonGroupItem } from '@/components/ui/button-group'

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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null

  const currentDebt = selectedCustomer?.current_debt || 0
  const creditLimit = selectedCustomer?.credit_limit || 0
  const availableCredit = Math.max(0, creditLimit - currentDebt)
  const exceedsCredit = isCreditSale && creditLimit > 0 && currentDebt + totalAmount > creditLimit

  const comboboxOptions: ComboboxOption[] = customers.map((c) => ({
    value: c.id,
    label: c.full_name || 'Sin nombre',
    description: `${c.phone ? `${c.phone} • ` : ''}Deuda: $${(c.current_debt || 0).toFixed(2)} | Límite: $${(c.credit_limit || 0).toFixed(2)}`,
    metadata: { customer: c }
  }))

  return (
    <div className="space-y-2.5">
      {/* Encabezado y Selector de Modo con ButtonGroup */}
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
          <ButtonGroup>
            <ButtonGroupItem
              active={mode === 'registered'}
              onClick={() => setMode('registered')}
              className="py-1 px-2.5 text-[11px]"
            >
              👥 Registrado ({customers.length})
            </ButtonGroupItem>
            <ButtonGroupItem
              active={mode === 'guest'}
              onClick={() => {
                setMode('guest')
                onSelectCustomer(null)
              }}
              className="py-1 px-2.5 text-[11px]"
            >
              ✍️ Ocasional
            </ButtonGroupItem>
          </ButtonGroup>
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
            /* Combobox Autocomplete con Buscador y Saldo */
            <div className="space-y-2">
              <Combobox
                options={comboboxOptions}
                value={selectedCustomerId}
                onChange={(val, opt) => {
                  const cust = customers.find((c) => c.id === val) || null
                  onSelectCustomer(cust)
                  if (cust?.full_name) onChangeCustomName(cust.full_name)
                }}
                placeholder="🔍 Seleccionar o buscar cliente registrado..."
                searchPlaceholder="Escribe nombre o teléfono del cliente..."
                emptyText="No se encontró ningún cliente con ese nombre."
                renderItem={(opt) => {
                  const cust = (opt.metadata?.customer as CustomerOption) || null
                  return (
                    <div className="flex items-center justify-between w-full py-0.5">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-xs text-foreground truncate">{opt.label}</span>
                        {cust?.phone && (
                          <span className="text-[10px] text-muted-foreground">{cust.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                        {(cust?.current_debt || 0) > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                            Deuda: ${(cust?.current_debt || 0).toFixed(0)}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          Lím: ${(cust?.credit_limit || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />

              {/* Chips de Selección Rápida en 1 Clic */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {customers.slice(0, 5).map((cust) => (
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
