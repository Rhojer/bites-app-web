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
  Coins,
  SlidersHorizontal,
  Scissors
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
import { ButtonGroup, ButtonGroupItem } from '@/components/ui/button-group'
import { MobileCartDrawer } from '@/components/pos/mobile-cart-drawer'
import { addItemToCart, splitCartItem, customizeCartItem } from '@/lib/domain/pos'
import { CustomizeItemDialog } from '@/components/pos/customize-item-dialog'

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
  recipeIngredientsMap?: Record<string, string[]>
}

interface CartItem {
  id: string
  recipe_id: string
  name: string
  quantity: number
  unit_price: number
  notes: string
  category?: string
}

const QUICK_NOTES = [
  'Sin cebolla',
  'Término medio',
  'Extra queso',
  'Para llevar',
  'Sin sal',
  'Poco picante',
  'Salsa aparte',
  'Bien cocido'
]
const CASH_DENOMINATIONS = [5, 10, 20, 50, 100]

export function PosTerminal({
  recipes,
  tables,
  customers = [],
  recipeIngredientsMap = {},
}: PosTerminalProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  
  // Customization Dialog State
  const [customizingItem, setCustomizingItem] = useState<CartItem | null>(null)

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
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    fetch(`${basePath}/api/bcv`)
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
    setCart((prev) => addItemToCart(prev, recipe) as CartItem[])
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  function handleSplitItem(itemId: string) {
    const { updatedCart } = splitCartItem(cart, itemId, 1)
    setCart(updatedCart as CartItem[])
  }

  function updateNotes(itemId: string, notes: string) {
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notes } : item))
    )
  }

  function appendQuickNote(item: CartItem, noteText: string) {
    if (item.quantity > 1) {
      // Si tiene más de 1 unidad, abrir el modal para que el usuario confirme si aplica a 1 o a todas
      setCustomizingItem(item)
      return
    }
    setCart((prev) =>
      prev.map((curr) => {
        if (curr.id !== item.id) return curr
        const existing = curr.notes.trim()
        const newNotes = existing ? `${existing}, ${noteText}` : noteText
        return { ...curr, notes: newNotes }
      })
    )
  }

  function handleSaveCustomization(itemId: string, notes: string, applyMode: 'single' | 'all') {
    setCart((prev) => customizeCartItem(prev, itemId, notes, applyMode) as CartItem[])
  }

  function clearCart() {
    setCart([])
  }

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const subtotal = cart.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0)
  const tax = 0
  const total = subtotal + tax
  const totalBs = (total * bcvRate)
  const isCashUSD = paymentMethod === 'Efectivo USD'
  const isCashBs = paymentMethod === 'Efectivo Bs'
  const isCash = isCashUSD || isCashBs
  const isCredit = paymentMethod === 'Crédito'

  // Change calculation for cash payment
  const numericTendered = parseFloat(cashTendered) || 0
  const changeDueUSD = Math.max(0, numericTendered - total)
  const changeDueBs = Math.max(0, numericTendered - totalBs)

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
      const defaultRef = isCredit
        ? 'VENTA-A-CREDITO'
        : isCashUSD
        ? 'POS-EFECTIVO-USD'
        : isCashBs
        ? 'POS-EFECTIVO-BS'
        : referenceNumber.trim()

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
        reference_number: defaultRef,
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
            <div key={item.id} className="p-3 rounded-xl border bg-card shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-xs text-foreground leading-snug block">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-[10px] text-muted-foreground">
                      {item.quantity} unidades agrupadas
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-xs text-primary shrink-0">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </span>
              </div>

              {/* Quantity Controls & Splitting */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => updateQuantity(item.id, -1)}
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
                    onClick={() => updateQuantity(item.id, 1)}
                    className="size-8 rounded-md hover:bg-card text-foreground"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Botón para separar 1 unidad si hay varias */}
                  {item.quantity > 1 && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => handleSplitItem(item.id)}
                      className="h-7 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 border-primary/30 gap-1 rounded-lg"
                      title="Separa 1 unidad en otra fila para personalizarla por separado"
                    >
                      <Scissors className="size-3" />
                      <span>Separar 1</span>
                    </Button>
                  )}

                  {/* Botón para personalizar / quitar ingredientes */}
                  <Button
                    type="button"
                    size="xs"
                    variant={item.notes ? 'default' : 'outline'}
                    onClick={() => setCustomizingItem(item)}
                    className={`h-7 px-2 text-[11px] font-semibold gap-1 rounded-lg transition-colors ${
                      item.notes
                        ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Personalizar o quitar ingredientes de este plato"
                  >
                    <SlidersHorizontal className="size-3" />
                    <span>{item.notes ? 'Modificado' : 'Personalizar'}</span>
                  </Button>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                  ${item.unit_price.toFixed(2)} c/u
                </span>
              </div>

              {/* Etiqueta de notas culinarias si existen */}
              {item.notes && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>⚠️</span>
                    <span className="truncate">{item.notes}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => updateNotes(item.id, '')}
                    className="text-[11px] text-muted-foreground hover:text-destructive shrink-0 ml-2"
                    title="Restablecer a estándar"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Culinary Notes Field & Quick Tags */}
              <div className="space-y-1.5 pt-1">
                <Input
                  placeholder="Nota de cocina (ej: Sin cebolla, extra salsa)..."
                  value={item.notes}
                  onChange={(e) => updateNotes(item.id, e.target.value)}
                  className="h-9 text-base sm:text-xs bg-muted/20"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_NOTES.map((qn) => (
                    <button
                      key={qn}
                      type="button"
                      onClick={() => appendQuickNote(item, qn)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-muted/70 text-foreground hover:bg-muted font-medium shrink-0 transition-all active:scale-95 border shadow-2xs"
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
    <div className="relative pb-24 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de Productos y Selector de Modo (8 columnas en desktop) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Barra Superior: Selector de Modo y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-card p-3 rounded-2xl border shadow-xs gap-3">
            <ButtonGroup className="w-full sm:w-auto grid grid-cols-3 sm:flex">
              <ButtonGroupItem
                active={orderType === 'dine_in'}
                onClick={() => setOrderType('dine_in')}
                className="py-2 px-3 text-xs gap-1.5"
              >
                <span>🍽️</span>
                <span>Salón</span>
              </ButtonGroupItem>
              <ButtonGroupItem
                active={orderType === 'takeaway'}
                onClick={() => setOrderType('takeaway')}
                className="py-2 px-3 text-xs gap-1.5"
              >
                <span>🛍️</span>
                <span>Llevar</span>
              </ButtonGroupItem>
              <ButtonGroupItem
                active={orderType === 'delivery'}
                onClick={() => setOrderType('delivery')}
                className="py-2 px-3 text-xs gap-1.5"
              >
                <span>🛵</span>
                <span>Delivery</span>
              </ButtonGroupItem>
            </ButtonGroup>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-44">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar plato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 text-base sm:text-xs bg-muted/20"
                />
              </div>
              <Input
                placeholder="Mesa / Cliente..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 w-32 sm:w-36 text-base sm:text-xs"
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

      {/* Cajón y Barra Flotante Táctil para Móviles / Tablets (< lg) */}
      <MobileCartDrawer
        itemCount={totalItemsCount}
        totalUSD={total}
        totalVES={totalBs}
        open={mobileCartOpen}
        onOpenChange={setMobileCartOpen}
        onCheckout={() => setCheckoutOpen(true)}
      >
        {renderCartContent(true)}
      </MobileCartDrawer>

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
            {/* Resumen de Total: $ Principal y Bs Secundario */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs">Total a Cobrar:</span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-primary">${total.toFixed(2)}</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Efectivo USD', icon: Banknote, label: '💵 Efectivo $' },
                  { name: 'Efectivo Bs', icon: Banknote, label: '🇻🇪 Efectivo Bs' },
                  { name: 'Pago Móvil', icon: Smartphone, label: '🏦 Pago Móvil' },
                  { name: 'Punto de Venta / Tarjeta', icon: CreditCard, label: '💳 Punto / Tarjeta' },
                  { name: 'Zelle', icon: Smartphone, label: '📱 Zelle ($)' },
                  { name: 'Crédito', icon: Coins, label: '👥 Venta Crédito' },
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
                    Se incrementará la deuda de <strong>{selectedCustomer.full_name}</strong> por <strong>${total.toFixed(2)}</strong> (Bs. {totalBs.toFixed(2)} a tasa actual).
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
                  {(paymentMethod === 'Pago Móvil' || paymentMethod === 'Punto de Venta / Tarjeta') && (
                    <span className="text-[11px] font-mono font-bold text-primary">
                      Monto: Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  {paymentMethod === 'Zelle' && (
                    <span className="text-[11px] font-mono font-bold text-primary">
                      Monto: ${total.toFixed(2)}
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

                {/* Denominaciones Rápidas USD */}
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

      {/* Diálogo de Personalización / Quitar Ingredientes */}
      <CustomizeItemDialog
        open={!!customizingItem}
        onOpenChange={(open) => {
          if (!open) setCustomizingItem(null)
        }}
        item={customizingItem}
        ingredients={customizingItem ? (recipeIngredientsMap[customizingItem.recipe_id] || []) : []}
        onSaveCustomization={handleSaveCustomization}
      />
    </div>
  )
}

