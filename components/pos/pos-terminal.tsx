'use client'

import { useState } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Loader2,
  Receipt,
  User,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  ChevronUp,
  X,
  Tag,
  Coins
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { processOrderAction } from '@/app/pos/actions'
import { CustomerSelector, CustomerOption } from '@/components/pos/customer-selector'

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

interface PosTerminalProps {
  recipes: RecipeItem[]
  tables: TableItem[]
  customers?: CustomerOption[]
}

interface CartItem {
  recipe_id: string
  name: string
  quantity: number
  unit_price: number
  notes: string
}

const QUICK_NOTES = ['Sin cebolla', 'Para llevar', 'Extra salsa', 'Bien cocido', 'Sin sal', 'Poco picante']
const CASH_DENOMINATIONS = [5, 10, 20, 50, 100]

export function PosTerminal({ recipes, tables, customers = [] }: PosTerminalProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  
  // Mobile Cart Sheet State
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Efectivo USD')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [refError, setRefError] = useState('')
  const [cashTendered, setCashTendered] = useState<string>('')
  const [bcvRate, setBcvRate] = useState(813.74)
  const [loading, setLoading] = useState(false)
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null)

  // Cargar tasa BCV
  useState(() => {
    fetch('/api/bcv')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rate) setBcvRate(data.rate)
      })
      .catch(() => {})
  })

  const finalRecipes = recipes.filter((r) => r.type === 'final_product')
  const categories = Array.from(new Set(finalRecipes.map((r) => r.category || 'General')))

  const filteredRecipes = finalRecipes.filter((r) => {
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory
    const matchesSearch = searchTerm.trim() === '' || r.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Cart operations
  function addToCart(recipe: RecipeItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.recipe_id === recipe.id)
      if (existing) {
        return prev.map((item) =>
          item.recipe_id === recipe.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          recipe_id: recipe.id,
          name: recipe.name,
          quantity: 1,
          unit_price: recipe.price || 0,
          notes: '',
        },
      ]
    })
  }

  function updateQuantity(recipe_id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.recipe_id === recipe_id) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  function updateNotes(recipe_id: string, notes: string) {
    setCart((prev) =>
      prev.map((item) => (item.recipe_id === recipe_id ? { ...item, notes } : item))
    )
  }

  function appendQuickNote(recipe_id: string, noteText: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.recipe_id !== recipe_id) return item
        const existing = item.notes.trim()
        const newNotes = existing ? `${existing}, ${noteText}` : noteText
        return { ...item, notes: newNotes }
      })
    )
  }

  function clearCart() {
    setCart([])
  }

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const subtotal = cart.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0)
  const tax = 0
  const total = subtotal + tax
  const totalBs = (total * bcvRate)
  const isCash = paymentMethod === 'Efectivo USD'
  const isCredit = paymentMethod === 'Crédito'

  // Change calculation for cash payment
  const numericTendered = parseFloat(cashTendered) || 0
  const changeDue = Math.max(0, numericTendered - total)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null

  async function handleCheckout() {
    if (cart.length === 0) return

    if (isCredit && !selectedCustomerId) {
      setRefError('Para una venta a crédito debes seleccionar un cliente registrado.')
      return
    }

    if (!isCash && !isCredit && !referenceNumber.trim()) {
      setRefError('Por favor ingresa el número de referencia bancaria.')
      return
    }

    setRefError('')
    setLoading(true)

    try {
      const res = await processOrderAction({
        table_id: orderType === 'dine_in' ? selectedTable : null,
        type: orderType,
        items: cart,
        subtotal,
        total,
        payment_method_name: paymentMethod,
        customer_id: selectedCustomerId || null,
        customer_name: customerName || selectedCustomer?.full_name || (selectedTable ? `Mesa ${selectedTable}` : 'Cliente Mostrador'),
        is_paid: !isCredit,
        is_credit: isCredit,
        reference_number: isCredit ? 'VENTA-A-CREDITO' : !isCash ? referenceNumber.trim() : 'POS-EFECTIVO',
      })

      setSuccessOrderNumber(res.orderId.slice(0, 8))
      setCart([])
      setSelectedCustomerId(null)
      setCustomerName('')
      setCheckoutOpen(false)
      setMobileCartOpen(false)
      setCashTendered('')
      setReferenceNumber('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar comanda')
    } finally {
      setLoading(false)
    }
  }

  // Cart Content Component (reused on Desktop sidebar and Mobile Sheet)
  const renderCartContent = (isMobileSheet = false) => (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            Comanda Activa ({totalItemsCount})
          </span>
        </div>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={clearCart}
            className="text-xs text-muted-foreground hover:text-destructive gap-1 h-8 px-2"
          >
            <Trash2 className="size-3.5" /> Limpiar
          </Button>
        )}
      </div>

      {/* Selector de Cliente en la Comanda */}
      <div className="p-2.5 rounded-xl border bg-muted/20">
        <CustomerSelector
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={(cust) => {
            setSelectedCustomerId(cust?.id || null)
            setCustomerName(cust?.full_name || '')
          }}
          customName={customerName}
          onChangeCustomName={setCustomerName}
          totalAmount={total}
        />
      </div>

      {cart.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
          <ShoppingBag className="size-10 mx-auto text-muted-foreground/30" />
          <p className="font-semibold text-foreground text-sm">Comanda vacía</p>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Toca los platos del catálogo para añadirlos a la orden del cliente.
          </p>
        </div>
      ) : (
        <div className={`space-y-3 overflow-y-auto pr-1 ${isMobileSheet ? 'flex-1 max-h-[50vh]' : 'max-h-[380px]'}`}>
          {cart.map((item) => (
            <div key={item.recipe_id} className="p-3 rounded-xl border bg-card shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs text-foreground leading-snug">{item.name}</span>
                <span className="font-mono font-bold text-xs text-primary shrink-0">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </span>
              </div>

              {/* Quantity Controls - Touch optimized */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => updateQuantity(item.recipe_id, -1)}
                    className="size-8 rounded-md hover:bg-card text-foreground"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-foreground">
                    {item.quantity}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => updateQuantity(item.recipe_id, 1)}
                    className="size-8 rounded-md hover:bg-card text-foreground"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground">
                  ${item.unit_price.toFixed(2)} c/u
                </span>
              </div>

              {/* Culinary Notes Field & Quick Tags */}
              <div className="space-y-1.5 pt-1">
                <Input
                  placeholder="Nota de cocina (ej: Sin cebolla, extra salsa)..."
                  value={item.notes}
                  onChange={(e) => updateNotes(item.recipe_id, e.target.value)}
                  className="h-8 text-xs bg-muted/20"
                />
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  {QUICK_NOTES.map((qn) => (
                    <button
                      key={qn}
                      type="button"
                      onClick={() => appendQuickNote(item.recipe_id, qn)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted font-medium shrink-0 transition-colors"
                    >
                      + {qn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totales & Checkout Action Button */}
      <div className="pt-3 border-t space-y-3 mt-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Subtotal ({totalItemsCount} platos):</span>
          <span className="font-mono font-semibold text-foreground">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-bold text-foreground">
          <span>Total a Cobrar:</span>
          <span className="font-mono text-lg text-primary">${total.toFixed(2)}</span>
        </div>

        <Button
          size="lg"
          className="w-full font-bold gap-2 text-sm shadow-md h-12 rounded-xl active:scale-[0.99] transition-transform"
          disabled={cart.length === 0}
          onClick={() => {
            setCheckoutOpen(true)
          }}
        >
          <CheckCircle2 className="size-5" />
          <span>Cobrar y Enviar a Cocina (${total.toFixed(2)})</span>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="relative pb-20 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de Productos y Selector de Modo (8 columnas en desktop) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Barra Superior: Selector de Modo y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-card p-3 rounded-2xl border shadow-xs gap-3">
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  orderType === 'dine_in'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>🍽️</span>
                <span>Salón</span>
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  orderType === 'takeaway'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>🛍️</span>
                <span>Llevar</span>
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  orderType === 'delivery'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>🛵</span>
                <span>Delivery</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-44">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar plato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 text-xs bg-muted/20"
                />
              </div>
              <Input
                placeholder="Mesa / Cliente..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 w-32 sm:w-36 text-xs"
              />
            </div>
          </div>

          {/* Categorías (Pills Horizontales Touch) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            <Button
              size="sm"
              variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs h-9 px-3.5 rounded-xl font-medium shrink-0"
            >
              Todos ({finalRecipes.length})
            </Button>
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={selectedCategory === c ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(c)}
                className="text-xs h-9 px-3.5 rounded-xl whitespace-nowrap font-medium shrink-0"
              >
                {c}
              </Button>
            ))}
          </div>

          {/* Grid de Platos - Touch Targets Cómodos */}
          {filteredRecipes.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card text-muted-foreground space-y-2">
              <UtensilsCrossed className="size-10 mx-auto text-muted-foreground/30" />
              <p className="font-semibold text-sm text-foreground">No se encontraron platos a la venta</p>
              <p className="text-xs max-w-sm mx-auto">
                {searchTerm
                  ? 'No hay platos que coincidan con la búsqueda.'
                  : 'Crea platos en el módulo de "Recetas & Escandallos" para agregarlos al POS.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredRecipes.map((dish) => {
                const inCart = cart.find((i) => i.recipe_id === dish.id)
                return (
                  <button
                    key={dish.id}
                    onClick={() => addToCart(dish)}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 relative overflow-hidden select-none active:scale-[0.96] ${
                      inCart
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                        : 'border-border bg-card hover:border-primary/40 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <Badge variant="outline" className="text-[10px] mb-2 font-medium px-2 py-0.5 rounded-md">
                        {dish.category}
                      </Badge>
                      <p className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-2">
                        {dish.name}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="font-mono font-extrabold text-sm sm:text-base text-primary">
                        ${dish.price.toFixed(2)}
                      </span>
                      {inCart ? (
                        <span className="size-6 sm:size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono shadow-xs">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <span className="size-6 sm:size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus className="size-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Comanda Activa en Desktop (4 columnas - Sticky) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <Card className="border shadow-xs rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              {renderCartContent(false)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barra Flotante Móvil/Tablet (< lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-md border-t z-30 shadow-lg flex items-center justify-between gap-3">
        <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
          <SheetTrigger
            render={
              <button
                className="flex items-center gap-2.5 text-left text-foreground hover:opacity-80 transition-opacity"
              />
            }
          >
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-foreground">
                {totalItemsCount} {totalItemsCount === 1 ? 'plato' : 'platos'} en comanda
              </p>
              <p className="font-mono font-extrabold text-sm text-primary leading-tight">
                ${total.toFixed(2)}
              </p>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-4 rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="pb-2">
              <SheetTitle>Resumen de Comanda</SheetTitle>
            </SheetHeader>
            {renderCartContent(true)}
          </SheetContent>
        </Sheet>

        <Button
          size="lg"
          className="font-bold gap-2 px-5 h-11 rounded-xl shadow-md text-xs sm:text-sm active:scale-95 transition-transform"
          disabled={cart.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          <CheckCircle2 className="size-4" />
          <span>Cobrar ${total.toFixed(2)}</span>
        </Button>
      </div>

      {/* Modal de Cobro Multi-Método con Calculadora de Efectivo */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Procesar Pago y Cerrar Orden</DialogTitle>
            <DialogDescription className="text-xs">
              Selecciona el método de pago. El inventario de insumos se descontará en tiempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Resumen de Total USD y Bolívares */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">Monto Total a Cobrar:</span>
                <span className="font-mono font-black text-2xl text-primary">${total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-primary/20 text-xs">
                <span className="text-muted-foreground">Equivalente BCV ({bcvRate.toFixed(2)} Bs/$):</span>
                <span className="font-mono font-extrabold text-foreground">
                  Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Selector de Cliente */}
            <div className="p-3 bg-muted/30 rounded-2xl border">
              <CustomerSelector
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={(cust) => {
                  setSelectedCustomerId(cust?.id || null)
                  setCustomerName(cust?.full_name || '')
                }}
                customName={customerName}
                onChangeCustomName={setCustomerName}
                isCreditSale={isCredit}
                totalAmount={total}
              />
            </div>

            {/* Selección de Método de Pago */}
            <div className="space-y-2">
              <label className="font-semibold text-foreground">Método de Pago:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Efectivo USD', icon: Banknote },
                  { name: 'Pago Móvil', icon: Smartphone },
                  { name: 'Zelle', icon: Smartphone },
                  { name: 'Punto de Venta / Tarjeta', icon: CreditCard },
                  { name: 'Crédito', icon: Coins, label: '💳 Venta a Crédito' },
                ].map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.name)
                      setRefError('')
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                      paymentMethod === m.name
                        ? m.name === 'Crédito'
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs'
                          : 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : m.name === 'Crédito'
                        ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10'
                        : 'border-input bg-card hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <m.icon className="size-4 shrink-0" />
                    <span className="truncate">{m.label || m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detalle si es Venta a Crédito */}
            {isCredit && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                  <Coins className="size-4" />
                  <span>Cargar a Cuenta Corriente del Cliente</span>
                </div>
                {selectedCustomer ? (
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Se incrementará la deuda de <strong>{selectedCustomer.full_name}</strong> por <strong>${total.toFixed(2)}</strong>.
                    Nueva deuda acumulada: <strong className="font-mono text-foreground">${((selectedCustomer.current_debt || 0) + total).toFixed(2)}</strong>.
                  </p>
                ) : (
                  <p className="text-[11px] text-destructive font-semibold">
                    ⚠️ Debes seleccionar un cliente registrado en el buscador de arriba.
                  </p>
                )}
              </div>
            )}

            {/* Campo de Referencia para No-Efectivo y No-Crédito */}
            {!isCash && !isCredit && (
              <div className="p-3.5 rounded-xl border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <span>Nº Referencia Bancaria:</span>
                    <span className="text-destructive font-black">*</span>
                  </label>
                  {paymentMethod === 'Pago Móvil' && (
                    <span className="text-[11px] font-mono font-bold text-primary">
                      Monto: Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <Input
                  placeholder="Ej. 123456 (Últimos dígitos del comprobante)..."
                  value={referenceNumber}
                  onChange={(e) => {
                    setReferenceNumber(e.target.value)
                    if (e.target.value.trim()) setRefError('')
                  }}
                  className={`h-9 text-xs font-mono ${refError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {refError && (
                  <p className="text-[11px] text-destructive font-medium">{refError}</p>
                )}
              </div>
            )}

            {/* Calculadora de Vuelto para Efectivo USD */}
            {paymentMethod === 'Efectivo USD' && (
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Monto Recibido:</span>
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

                {/* Denominaciones Rápidas */}
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
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">Vuelto / Cambio a entregar:</span>
                    <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300">
                      ${changeDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={loading} className="h-10 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={loading} className="gap-2 font-bold h-10 rounded-xl shadow-xs">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando Cobro...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Confirmar Cobro ${total.toFixed(2)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

