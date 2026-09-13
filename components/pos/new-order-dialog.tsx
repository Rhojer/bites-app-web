'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  ShoppingBag,
  Search,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  Banknote,
  CreditCard,
  Smartphone,
  AlertCircle,
  Coins,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { processOrderAction, CartItemInput } from '@/app/pos/actions'
import { formatBs, convertUsdToBs } from '@/lib/bcv'
import { CustomerSelector, CustomerOption } from '@/components/pos/customer-selector'
import { ButtonGroup, ButtonGroupItem } from '@/components/ui/button-group'

interface RecipeItem {
  id: string
  name: string
  price: number
  category: string
  type: string
}

interface TableItem {
  id: string
  number: string
  name: string | null
  status: string
}

interface NewOrderDialogProps {
  recipes: RecipeItem[]
  tables: TableItem[]
  customers?: CustomerOption[]
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface CartItem extends CartItemInput {
  category?: string
}

const QUICK_NOTES = ['Sin cebolla', 'Extra salsa', 'Para llevar', 'Bien cocido', 'Poco picante', 'Sin sal']
const CASH_DENOMINATIONS = [5, 10, 20, 50, 100]

export function NewOrderDialog({
  recipes,
  tables,
  customers = [],
  trigger,
  onSuccess,
}: NewOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Modal de pago directo
  const [isPayingNow, setIsPayingNow] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Efectivo USD')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [refError, setRefError] = useState('')
  const [cashTendered, setCashTendered] = useState('')
  const [bcvRate, setBcvRate] = useState(813.74)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/bcv')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rate) setBcvRate(data.rate)
      })
      .catch(() => {})
  }, [open])

  const finalRecipes = recipes.filter((r) => r.type === 'final_product')
  const categories = Array.from(new Set(finalRecipes.map((r) => r.category || 'General')))

  const filteredRecipes = finalRecipes.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory
    const matchesSearch = searchTerm.trim() === '' || r.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCat && matchesSearch
  })

  function addToCart(recipe: RecipeItem) {
    setCart((prev) => {
      const exists = prev.find((i) => i.recipe_id === recipe.id)
      if (exists) {
        return prev.map((i) => (i.recipe_id === recipe.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [
        ...prev,
        {
          recipe_id: recipe.id,
          name: recipe.name,
          quantity: 1,
          unit_price: recipe.price || 0,
          notes: '',
          category: recipe.category,
        },
      ]
    })
  }

  function updateQuantity(recipe_id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.recipe_id === recipe_id) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: nextQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  function updateItemNotes(recipe_id: string, notes: string) {
    setCart((prev) => prev.map((i) => (i.recipe_id === recipe_id ? { ...i, notes } : i)))
  }

  function appendQuickNote(recipe_id: string, noteText: string) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.recipe_id !== recipe_id) return i
        const existing = (i.notes || '').trim()
        const newNotes = existing ? `${existing}, ${noteText}` : noteText
        return { ...i, notes: newNotes }
      })
    )
  }

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const subtotal = cart.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0)
  const total = subtotal
  const totalBs = convertUsdToBs(total, bcvRate)
  const isCash = paymentMethod === 'Efectivo USD'
  const isCredit = paymentMethod === 'Crédito'

  const numericTendered = parseFloat(cashTendered) || 0
  const changeDue = Math.max(0, numericTendered - total)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null

  function resetForm() {
    setCart([])
    setSelectedCustomerId(null)
    setCustomerName('')
    setCustomerPhone('')
    setOrderNotes('')
    setSelectedTable('')
    setOrderType('dine_in')
    setIsPayingNow(false)
    setCashTendered('')
    setReferenceNumber('')
    setRefError('')
  }

  async function handleSaveOrder(payNow: boolean) {
    if (cart.length === 0) return

    // Validaciones para crédito
    if (payNow && isCredit) {
      if (!selectedCustomerId) {
        setRefError('Para una venta a crédito debes seleccionar un cliente registrado.')
        return
      }
    }

    // Validaciones para pago electrónico
    if (payNow && !isCash && !isCredit && !referenceNumber.trim()) {
      setRefError('Ingresa el número de referencia para confirmar el pago.')
      return
    }

    setRefError('')
    setLoading(true)

    try {
      const defaultName = orderType === 'dine_in' && selectedTable
        ? `Mesa ${tables.find((t) => t.id === selectedTable)?.number || ''}`
        : orderType === 'takeaway'
        ? 'Para Llevar'
        : 'Delivery'

      await processOrderAction({
        table_id: orderType === 'dine_in' ? selectedTable || null : null,
        type: orderType,
        items: cart,
        subtotal,
        total,
        payment_method_name: payNow ? paymentMethod : 'Pendiente',
        customer_id: selectedCustomerId || null,
        customer_name: customerName.trim() || selectedCustomer?.full_name || defaultName,
        customer_phone: customerPhone.trim() || selectedCustomer?.phone || undefined,
        notes: orderNotes.trim() || undefined,
        is_paid: payNow && !isCredit,
        is_credit: payNow && isCredit,
        reference_number: payNow && isCredit ? 'VENTA-A-CREDITO' : payNow && !isCash ? referenceNumber.trim() : 'POS-EFECTIVO',
      })

      resetForm()
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear la orden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button size="default" className="font-bold gap-2 rounded-xl shadow-xs">
              <Plus className="size-4" />
              <span>Nuevo Pedido</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-5 sm:p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
              <span>Nuevo Pedido / Comanda</span>
            </DialogTitle>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-muted text-foreground border">
              BCV: Bs. {bcvRate.toFixed(2)}
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Abre una comanda seleccionando el tipo de servicio, cliente y platos del menú.
          </DialogDescription>
        </DialogHeader>

        {/* Contenido Principal con 2 Columnas */}
        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Columna Izquierda: Configuración del Pedido y Catálogo de Platos (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Tipo de Pedido */}
            <div className="p-3.5 bg-muted/30 rounded-2xl border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Tipo de Pedido:</label>
                <ButtonGroup className="w-72 grid grid-cols-3">
                  <ButtonGroupItem
                    active={orderType === 'dine_in'}
                    onClick={() => setOrderType('dine_in')}
                    className="py-1.5 px-2 text-xs"
                  >
                    🍽️ Salón
                  </ButtonGroupItem>
                  <ButtonGroupItem
                    active={orderType === 'takeaway'}
                    onClick={() => setOrderType('takeaway')}
                    className="py-1.5 px-2 text-xs"
                  >
                    🛍️ Llevar
                  </ButtonGroupItem>
                  <ButtonGroupItem
                    active={orderType === 'delivery'}
                    onClick={() => setOrderType('delivery')}
                    className="py-1.5 px-2 text-xs"
                  >
                    🛵 Delivery
                  </ButtonGroupItem>
                </ButtonGroup>
              </div>

              {/* Si es Salón: Selector de Mesas */}
              {orderType === 'dine_in' && (
                <div className="space-y-1.5 pt-1 border-t border-border/50">
                  <label className="text-[11px] font-semibold text-muted-foreground">Mesa asignada:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {tables.map((tbl) => (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setSelectedTable(tbl.id)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedTable === tbl.id
                            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                            : 'border-input bg-card text-foreground hover:border-primary/40'
                        }`}
                      >
                        Mesa {tbl.number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Cliente Registrado / Manual */}
              <div className="pt-2 border-t border-border/50">
                <CustomerSelector
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={(cust) => {
                    setSelectedCustomerId(cust?.id || null)
                    setCustomerName(cust?.full_name || '')
                    setCustomerPhone(cust?.phone || '')
                  }}
                  customName={customerName}
                  onChangeCustomName={setCustomerName}
                  isCreditSale={isPayingNow && isCredit}
                  totalAmount={total}
                />
              </div>
            </div>

            {/* Catálogo de Platos con Precios Duales (USD y Bs) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">Platos del Menú:</span>
                <div className="relative w-48">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar plato..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs bg-muted/20 rounded-lg"
                  />
                </div>
              </div>

              {/* Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-foreground text-background shadow-2xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Todos ({finalRecipes.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`text-xs px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === c
                        ? 'bg-foreground text-background shadow-2xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Grid de Platos */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                {filteredRecipes.map((dish) => {
                  const inCart = cart.find((i) => i.recipe_id === dish.id)
                  const priceBs = convertUsdToBs(dish.price, bcvRate)
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => addToCart(dish)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-[0.98] ${
                        inCart
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-2xs'
                          : 'border-border bg-card hover:border-primary/40 hover:shadow-2xs'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                          {dish.category}
                        </span>
                        <p className="font-bold text-xs sm:text-sm text-foreground leading-tight line-clamp-2">
                          {dish.name}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-end justify-between pt-1.5 border-t border-border/40">
                        <div>
                          <span className="font-mono font-extrabold text-xs sm:text-sm text-foreground block leading-none">
                            ${dish.price.toFixed(2)}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground font-medium leading-tight">
                            {formatBs(priceBs)}
                          </span>
                        </div>
                        {inCart ? (
                          <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono">
                            {inCart.quantity}
                          </span>
                        ) : (
                          <span className="size-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Plus className="size-3.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Comanda / Resumen de Items (5 cols) */}
          <div className="lg:col-span-5 bg-card rounded-2xl border p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="font-bold text-xs text-foreground">
                  Platos Agregados ({totalItemsCount})
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <Trash2 className="size-3" /> Limpiar
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                  <ShoppingBag className="size-8 mx-auto text-muted-foreground/30" />
                  <p className="font-semibold text-foreground">Comanda vacía</p>
                  <p className="text-[11px] text-muted-foreground">Toca los platos a la izquierda para agregarlos.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 mt-2">
                  {cart.map((item) => (
                    <div key={item.recipe_id} className="p-2.5 rounded-xl border bg-muted/20 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-foreground leading-snug">{item.name}</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-primary block leading-none">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatBs(convertUsdToBs(item.quantity * item.unit_price, bcvRate))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-card px-1 py-0.5 rounded-md border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.recipe_id, -1)}
                            className="size-6 flex items-center justify-center hover:bg-muted rounded"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.recipe_id, 1)}
                            className="size-6 flex items-center justify-center hover:bg-muted rounded"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ${item.unit_price.toFixed(2)} c/u
                        </span>
                      </div>

                      {/* Notas culinarias del plato */}
                      <Input
                        placeholder="Nota de cocina (ej: Sin cebolla)..."
                        value={item.notes || ''}
                        onChange={(e) => updateItemNotes(item.recipe_id, e.target.value)}
                        className="h-7 text-[11px] bg-card"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                        {QUICK_NOTES.map((qn) => (
                          <button
                            key={qn}
                            type="button"
                            onClick={() => appendQuickNote(item.recipe_id, qn)}
                            className="text-[9px] px-1.5 py-0.5 rounded-md bg-card border text-muted-foreground hover:text-foreground font-medium shrink-0"
                          >
                            + {qn}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totales y Opciones de Cobro */}
            <div className="pt-3 border-t space-y-3 mt-auto">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground font-semibold">Total USD:</span>
                  <span className="font-mono font-black text-xl text-primary">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/20">
                  <span className="text-muted-foreground">Total Bs (BCV):</span>
                  <span className="font-mono font-bold text-foreground">{formatBs(totalBs)}</span>
                </div>
              </div>

              {/* Modo de Pago / Cobro Directo Expandible */}
              {isPayingNow && (
                <div className="p-3 rounded-xl border bg-card space-y-2 text-xs">
                  <span className="font-bold text-foreground block">Método de Cobro:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { name: 'Efectivo USD', label: '💵 Efectivo $' },
                      { name: 'Efectivo Bs', label: '🇻🇪 Efectivo Bs' },
                      { name: 'Pago Móvil', label: '🏦 Pago Móvil' },
                      { name: 'Punto de Venta / Tarjeta', label: '💳 Punto / Tarjeta' },
                      { name: 'Zelle', label: '📱 Zelle ($)' },
                      { name: 'Crédito', label: '👥 Crédito', highlight: true },
                    ].map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.name)
                          setRefError('')
                        }}
                        className={`p-2 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                          paymentMethod === m.name
                            ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                            : m.highlight
                            ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10'
                            : 'border-input bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {m.label || m.name}
                      </button>
                    ))}
                  </div>

                  {/* Detalle si es Venta a Crédito */}
                  {isCredit && (
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                        <Coins className="size-4" />
                        <span>Cargar a Cuenta Corriente del Cliente</span>
                      </div>
                      {selectedCustomer ? (
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Se incrementará la deuda de <strong>{selectedCustomer.full_name}</strong> por <strong>${total.toFixed(2)}</strong>.
                          Nueva deuda: <strong className="font-mono text-foreground">${((selectedCustomer.current_debt || 0) + total).toFixed(2)}</strong>.
                        </p>
                      ) : (
                        <p className="text-[11px] text-destructive font-semibold">
                          ⚠️ Debes seleccionar un cliente registrado en la parte izquierda.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Campo de Referencia para No-Efectivo y No-Crédito */}
                  {!isCash && !isCredit && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                        <span>Nº de Referencia Bancaria:</span>
                        <span className="text-destructive font-black">*</span>
                      </label>
                      <Input
                        placeholder="Ej. 123456 (Últimos 4-6 dígitos)..."
                        value={referenceNumber}
                        onChange={(e) => {
                          setReferenceNumber(e.target.value)
                          if (e.target.value.trim()) setRefError('')
                        }}
                        className={`h-8 text-xs font-mono ${refError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                      />
                      {refError && (
                        <p className="text-[10px] text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" /> {refError}
                        </p>
                      )}
                    </div>
                  )}

                  {isCash && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Monto recibido ($):</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="h-7 w-24 text-xs font-mono text-right"
                        />
                      </div>
                      {numericTendered >= total && (
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <span>Cambio:</span>
                          <span className="font-mono">${changeDue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botones de Guardado / Cobro */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={cart.length === 0 || loading}
                  onClick={() => handleSaveOrder(false)}
                  className="h-11 rounded-xl text-xs font-bold"
                >
                  {loading && !isPayingNow ? <Loader2 className="size-4 animate-spin" /> : 'Guardar Activo (Por Cobrar)'}
                </Button>

                {isPayingNow ? (
                  <Button
                    type="button"
                    disabled={cart.length === 0 || loading}
                    onClick={() => handleSaveOrder(true)}
                    className={`h-11 rounded-xl text-xs font-bold gap-1.5 shadow-xs ${
                      isCredit
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    <span>{isCredit ? 'Confirmar Crédito' : 'Confirmar Cobro'}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={cart.length === 0 || loading}
                    onClick={() => setIsPayingNow(true)}
                    className="h-11 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Cobrar / Crédito</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
