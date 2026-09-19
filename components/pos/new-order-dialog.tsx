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
  SlidersHorizontal,
  Scissors,
  ArrowRight,
  ArrowLeft,
  ChefHat,
  MapPin,
  Phone,
  User
} from 'lucide-react'
import { processOrderAction, CartItemInput } from '@/app/pos/actions'
import { formatBs, convertUsdToBs } from '@/lib/bcv'
import { CustomerSelector, CustomerOption } from '@/components/pos/customer-selector'
import { ButtonGroup, ButtonGroupItem } from '@/components/ui/button-group'
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

interface NewOrderDialogProps {
  recipes: RecipeItem[]
  tables: TableItem[]
  customers?: CustomerOption[]
  recipeIngredientsMap?: Record<string, string[]>
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface CartItem extends CartItemInput {
  id: string
  category?: string
}

export function NewOrderDialog({
  recipes,
  tables,
  customers = [],
  recipeIngredientsMap = {},
  trigger,
  onSuccess,
}: NewOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'catalog' | 'assign'>('catalog')
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Modal de personalización de ingredientes
  const [customizingItem, setCustomizingItem] = useState<CartItem | null>(null)
  const [bcvRate, setBcvRate] = useState(813.74)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    fetch(`${basePath}/api/bcv`)
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
    setCart((prev) => addItemToCart(prev, recipe) as CartItem[])
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: nextQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  function handleSplitItem(itemId: string) {
    const { updatedCart } = splitCartItem(cart, itemId, 1)
    setCart(updatedCart as CartItem[])
  }

  function updateItemNotes(itemId: string, notes: string) {
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)))
  }

  function handleSaveCustomization(itemId: string, notes: string, applyMode: 'single' | 'all') {
    setCart((prev) => customizeCartItem(prev, itemId, notes, applyMode) as CartItem[])
  }

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const subtotal = cart.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0)
  const total = subtotal
  const totalBs = convertUsdToBs(total, bcvRate)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null

  function resetForm() {
    setStep('catalog')
    setCart([])
    setSelectedCustomerId(null)
    setCustomerName('')
    setCustomerPhone('')
    setOrderNotes('')
    setDeliveryAddress('')
    setSelectedTable('')
    setOrderType('dine_in')
    setLoading(false)
  }

  async function handleGenerateOrder() {
    if (cart.length === 0) return

    if (orderType === 'dine_in' && !selectedTable) {
      alert('Por favor selecciona una mesa para la comanda de salón.')
      return
    }

    setLoading(true)

    try {
      const defaultName = orderType === 'dine_in' && selectedTable
        ? `Mesa ${tables.find((t) => t.id === selectedTable)?.number || ''}`
        : orderType === 'takeaway'
        ? (customerName.trim() || 'Para Llevar')
        : (customerName.trim() || 'Delivery')

      const finalNotes = [
        orderNotes.trim(),
        deliveryAddress.trim() ? `Dirección: ${deliveryAddress.trim()}` : null
      ].filter(Boolean).join(' | ')

      await processOrderAction({
        table_id: orderType === 'dine_in' ? selectedTable || null : null,
        type: orderType,
        items: cart,
        subtotal,
        total,
        payment_method_name: 'Pendiente',
        customer_id: selectedCustomerId || null,
        customer_name: customerName.trim() || selectedCustomer?.full_name || defaultName,
        customer_phone: customerPhone.trim() || selectedCustomer?.phone || undefined,
        notes: finalNotes || undefined,
        is_paid: false,
        is_credit: false,
        reference_number: null,
      })

      resetForm()
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar la comanda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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

      <DialogContent className="sm:max-w-5xl h-[90vh] max-h-[92vh] flex flex-col p-5 sm:p-6 rounded-2xl overflow-hidden">
        
        {/* ========================================================= */}
        {/* PASO 1: SELECCIÓN DE TIPO DE PEDIDO Y CATÁLOGO DE PLATOS */}
        {/* ========================================================= */}
        {step === 'catalog' ? (
          <>
            <DialogHeader className="pb-3 border-b shrink-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
                    <UtensilsCrossed className="size-5 text-primary" />
                    <span>Nuevo Pedido / Comanda</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Selecciona el tipo de servicio y agrega los platos a la orden.
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-muted text-foreground border">
                    BCV: Bs. {bcvRate.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selector de Tipo de Servicio */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border">
                <span className="text-xs font-bold text-foreground">Tipo de Pedido:</span>
                <ButtonGroup className="w-64 sm:w-72 grid grid-cols-3">
                  <ButtonGroupItem
                    active={orderType === 'dine_in'}
                    onClick={() => setOrderType('dine_in')}
                    className="py-1 px-2 text-xs font-bold"
                  >
                    🍽️ Salón
                  </ButtonGroupItem>
                  <ButtonGroupItem
                    active={orderType === 'takeaway'}
                    onClick={() => setOrderType('takeaway')}
                    className="py-1 px-2 text-xs font-bold"
                  >
                    🛍️ Llevar
                  </ButtonGroupItem>
                  <ButtonGroupItem
                    active={orderType === 'delivery'}
                    onClick={() => setOrderType('delivery')}
                    className="py-1 px-2 text-xs font-bold"
                  >
                    🛵 Delivery
                  </ButtonGroupItem>
                </ButtonGroup>
              </div>
            </DialogHeader>

            {/* Contenido Principal con 2 Columnas Independientes */}
            <div className="flex-1 min-h-0 py-2 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto lg:overflow-hidden">
              
              {/* Columna Izquierda: Catálogo de Platos (7 cols) */}
              <div className="lg:col-span-7 flex flex-col h-full min-h-0 space-y-2.5">
                {/* Barra de Búsqueda y Categorías (shrink-0) */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">Platos del Menú:</span>
                    <div className="relative w-48 sm:w-56">
                      <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar plato..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 pl-8 text-xs bg-muted/20 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Pills de Categorías */}
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
                </div>

                {/* Grid de Platos con su Propio Scroll Vertical */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start">
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

              {/* Columna Derecha: Comanda / Platos Agregados (5 cols) */}
              <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-card rounded-2xl border p-4 shadow-xs">
                {/* Header de la Comanda (shrink-0) */}
                <div className="flex items-center justify-between pb-2 border-b shrink-0">
                  <span className="font-bold text-xs text-foreground">
                    Platos Agregados ({totalItemsCount})
                  </span>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="size-3" /> Limpiar
                    </button>
                  )}
                </div>

                {/* Lista de Platos con Scroll Dedicado en Todo el Alto */}
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-xs space-y-2">
                    <ShoppingBag className="size-8 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">Comanda vacía</p>
                    <p className="text-[11px] text-muted-foreground">
                      Toca los platos a la izquierda para agregarlos al pedido.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 mt-2">
                    {cart.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-xl border bg-muted/20 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-foreground leading-snug block">{item.name}</span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-muted-foreground">
                                {item.quantity} unidades agrupadas
                              </span>
                            )}
                          </div>
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
                              onClick={() => updateQuantity(item.id, -1)}
                              className="size-6 flex items-center justify-center hover:bg-muted rounded"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="size-6 flex items-center justify-center hover:bg-muted rounded"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Botón para separar 1 unidad si hay varias */}
                            {item.quantity > 1 && (
                              <button
                                type="button"
                                onClick={() => handleSplitItem(item.id)}
                                className="h-6 px-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10 text-[10px] font-semibold flex items-center gap-1"
                                title="Separa 1 unidad en otra fila para personalizarla por separado"
                              >
                                <Scissors className="size-2.5" />
                                <span>Separar 1</span>
                              </button>
                            )}

                            {/* Botón para personalizar / quitar ingredientes */}
                            <button
                              type="button"
                              onClick={() => setCustomizingItem(item)}
                              className={`h-6 px-1.5 rounded-md border text-[10px] font-semibold flex items-center gap-1 ${
                                item.notes
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-bold'
                                  : 'border-input bg-card text-muted-foreground hover:text-foreground'
                              }`}
                              title="Personalizar o quitar ingredientes de este plato"
                            >
                              <SlidersHorizontal className="size-2.5" />
                              <span>{item.notes ? 'Modificado' : 'Personalizar'}</span>
                            </button>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground">
                            ${item.unit_price.toFixed(2)} c/u
                          </span>
                        </div>

                        {/* Etiqueta de notas culinarias si existen */}
                        {item.notes && (
                          <div className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-semibold">
                            <span className="flex items-center gap-1 truncate">
                              <span>⚠️</span>
                              <span className="truncate">{item.notes}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemNotes(item.id, '')}
                              className="text-[10px] text-muted-foreground hover:text-destructive shrink-0 ml-1.5"
                              title="Restablecer a estándar"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Notas culinarias del plato */}
                        <Input
                          placeholder="Nota de cocina (ej: Sin cebolla)..."
                          value={item.notes || ''}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          className="h-7 text-[11px] bg-card"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* PIE DE PÁGINA PERMANENTE Y FUERA DEL SCROLL (PASO 1)     */}
            {/* ========================================================= */}
            <DialogFooter className="shrink-0 pt-3 border-t bg-card/95 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Totales visibles permanentemente a la izquierda */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Total comanda:</span>
                  <span className="font-mono font-black text-xl text-primary">${total.toFixed(2)}</span>
                  <span className="font-mono text-xs text-muted-foreground">({formatBs(totalBs)})</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  • {totalItemsCount} {totalItemsCount === 1 ? 'plato' : 'platos'}
                </span>
              </div>

              {/* Botones de acción fuera del scroll */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-xl text-xs font-semibold px-3"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setStep('assign')}
                  className="h-10 px-5 rounded-xl text-xs font-bold gap-2 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                >
                  <span>Continuar a Asignar Mesa / Datos</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          /* ========================================================= */
          /* PASO 2: ASIGNACIÓN DE MESA / CLIENTE Y GENERAR COMANDA    */
          /* ========================================================= */
          <>
            <DialogHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('catalog')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-bold transition-colors"
                >
                  <ArrowLeft className="size-4 text-primary" />
                  <span>Volver a Platos</span>
                </button>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">
                    {orderType === 'dine_in' ? '🍽️ Salón' : orderType === 'takeaway' ? '🛍️ Para Llevar' : '🛵 Delivery'}
                  </Badge>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    ${total.toFixed(2)} ({formatBs(totalBs)})
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                  Asignar Mesa y Confirmar Comanda
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ingresa la mesa o datos del cliente. La orden se generará y enviará a cocina sin cobro inmediato.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto py-3 max-w-xl mx-auto w-full space-y-4">
              
              {/* Resumen Compacto del Pedido */}
              <div className="p-3 rounded-xl bg-muted/30 border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ChefHat className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">
                    {totalItemsCount} {totalItemsCount === 1 ? 'plato en la orden' : 'platos en la orden'}
                  </span>
                </div>
                <span className="font-mono font-black text-sm text-foreground">
                  Total: ${total.toFixed(2)}
                </span>
              </div>

              {/* Si es Salón: Selector Visual de Mesas */}
              {orderType === 'dine_in' && (
                <div className="p-3.5 rounded-2xl border bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>Mesa asignada:</span>
                      <span className="text-destructive font-black">*</span>
                    </label>
                    {selectedTable && (
                      <span className="text-xs font-bold text-primary">
                        Mesa {tables.find((t) => t.id === selectedTable)?.number} Seleccionada
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {tables.map((tbl) => {
                      const isOccupied = tbl.status === 'occupied'
                      const isSelected = selectedTable === tbl.id
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => setSelectedTable(tbl.id)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/40'
                              : isOccupied
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20'
                              : 'border-input bg-card text-foreground hover:border-primary/40'
                          }`}
                        >
                          <span className="leading-tight">Mesa {tbl.number}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-normal ${
                              isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : isOccupied
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {isOccupied ? 'Ocupada' : 'Libre'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selector de Cliente Registrado o Manual */}
              <div className="p-3.5 rounded-2xl border bg-card space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  {orderType === 'dine_in' ? 'Cliente (Opcional):' : 'Datos del Cliente:'}
                </label>
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
                  totalAmount={total}
                />
              </div>

              {/* Teléfono y Dirección si aplica para Llevar o Delivery */}
              {(orderType === 'takeaway' || orderType === 'delivery') && (
                <div className="p-3.5 rounded-2xl border bg-card space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3 text-primary" />
                      <span>Teléfono de contacto:</span>
                    </label>
                    <Input
                      placeholder="Ej. +58 412 1234567..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-8 text-xs bg-muted/20"
                    />
                  </div>

                  {orderType === 'delivery' && (
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3 text-primary" />
                        <span>Dirección de Entrega:</span>
                        <span className="text-destructive font-black">*</span>
                      </label>
                      <Input
                        placeholder="Ej. Av. Principal, Edif. Los Olivos, Apto 4-B..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="h-8 text-xs bg-muted/20"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Nota General de Cocina / Comanda */}
              <div className="p-3.5 rounded-2xl border bg-card space-y-1 text-xs">
                <label className="font-bold text-muted-foreground">
                  Instrucción especial para cocina (Opcional):
                </label>
                <Input
                  placeholder="Ej. Servir todo junto, comensal alérgico al marisco, término general..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="h-8 text-xs bg-muted/20"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* PIE DE PÁGINA PERMANENTE Y FUERA DEL SCROLL (PASO 2)     */}
            {/* ========================================================= */}
            <DialogFooter className="shrink-0 pt-3 border-t bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep('catalog')}
                disabled={loading}
                className="h-10 rounded-xl text-xs font-semibold gap-1.5 w-full sm:w-auto"
              >
                <ArrowLeft className="size-3.5" />
                <span>Volver a Platos</span>
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="hidden sm:flex items-baseline gap-1.5 font-mono text-xs">
                  <span className="text-muted-foreground font-medium">Total:</span>
                  <span className="font-bold text-primary">${total.toFixed(2)}</span>
                  <span className="text-muted-foreground">({formatBs(totalBs)})</span>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateOrder}
                  disabled={loading || (orderType === 'dine_in' && !selectedTable)}
                  className="h-10 px-6 rounded-xl text-xs font-bold gap-2 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Generando Comanda...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Generar Comanda / Guardar Orden</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Diálogo para personalizar ingredientes de un plato individual o grupal */}
    <CustomizeItemDialog
      open={!!customizingItem}
      onOpenChange={(op) => {
        if (!op) setCustomizingItem(null)
      }}
      item={customizingItem}
      ingredients={customizingItem ? (recipeIngredientsMap[customizingItem.recipe_id] || []) : []}
      onSaveCustomization={handleSaveCustomization}
    />
    </>
  )
}
