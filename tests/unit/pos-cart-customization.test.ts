import { describe, it, expect } from 'vitest'
import {
  addItemToCart,
  splitCartItem,
  customizeCartItem,
  formatCulinaryExclusions,
  POSCartItem,
} from '@/lib/domain/pos'

describe('Domain: Personalización individual de platos en comanda POS', () => {
  const burgerRecipe = {
    id: 'rec-burger',
    name: 'Hamburguesa Doble Angus Clásica',
    price: 14.0,
    category: 'Hamburguesas',
  }

  it('debe agrupar hamburguesas normales sin notas al añadirlas sucesivamente', () => {
    let cart: POSCartItem[] = []
    cart = addItemToCart(cart, burgerRecipe)
    cart = addItemToCart(cart, burgerRecipe)
    cart = addItemToCart(cart, burgerRecipe)

    expect(cart.length).toBe(1)
    expect(cart[0].quantity).toBe(3)
    expect(cart[0].notes || '').toBe('')
  })

  it('debe permitir separar 1 hamburguesa de un grupo de 3 para personalizarla individualmente', () => {
    let cart: POSCartItem[] = [
      { id: 'item-1', recipe_id: 'rec-burger', name: 'Hamburguesa Doble Angus', quantity: 3, unit_price: 14.0, notes: '' },
    ]

    const { updatedCart, newSplitItemId } = splitCartItem(cart, 'item-1', 1)

    expect(updatedCart.length).toBe(2)
    // El original quedó en 2 unidades
    const original = updatedCart.find((i) => i.id === 'item-1')
    expect(original?.quantity).toBe(2)
    expect(original?.notes || '').toBe('')

    // El nuevo separado tiene 1 unidad
    const splitItem = updatedCart.find((i) => i.id === newSplitItemId)
    expect(splitItem).toBeDefined()
    expect(splitItem?.quantity).toBe(1)
  })

  it('debe personalizar SOLO 1 hamburguesa cuando se aplica en modo single (quitar cebolla a 1 de 3)', () => {
    let cart: POSCartItem[] = [
      { id: 'item-1', recipe_id: 'rec-burger', name: 'Hamburguesa Doble Angus', quantity: 3, unit_price: 14.0, notes: '' },
    ]

    // Usuario tiene 3 hamburguesas y quiere quitar cebolla a SOLO 1
    const newCart = customizeCartItem(cart, 'item-1', 'Sin cebolla', 'single')

    expect(newCart.length).toBe(2)
    // 2 hamburguesas siguen normales sin cebolla
    const normalItems = newCart.find((i) => !i.notes || i.notes === '')
    expect(normalItems).toBeDefined()
    expect(normalItems?.quantity).toBe(2)

    // 1 hamburguesa tiene la nota "Sin cebolla"
    const customizedItem = newCart.find((i) => i.notes === 'Sin cebolla')
    expect(customizedItem).toBeDefined()
    expect(customizedItem?.quantity).toBe(1)
  })

  it('debe personalizar TODAS las hamburguesas si se elige modo all', () => {
    let cart: POSCartItem[] = [
      { id: 'item-1', recipe_id: 'rec-burger', name: 'Hamburguesa Doble Angus', quantity: 3, unit_price: 14.0, notes: '' },
    ]

    const newCart = customizeCartItem(cart, 'item-1', 'Para llevar', 'all')

    expect(newCart.length).toBe(1)
    expect(newCart[0].quantity).toBe(3)
    expect(newCart[0].notes).toBe('Para llevar')
  })

  it('si se añade otra hamburguesa estándar después de personalizar una, no debe mezclarse con la personalizada', () => {
    let cart: POSCartItem[] = [
      { id: 'item-custom', recipe_id: 'rec-burger', name: 'Hamburguesa Doble Angus', quantity: 1, unit_price: 14.0, notes: 'Sin cebolla' },
    ]

    // Añadimos una hamburguesa nueva desde el catálogo
    cart = addItemToCart(cart, burgerRecipe)

    expect(cart.length).toBe(2)
    const custom = cart.find((i) => i.notes === 'Sin cebolla')
    const normal = cart.find((i) => !i.notes || i.notes === '')
    expect(custom?.quantity).toBe(1)
    expect(normal?.quantity).toBe(1)
  })

  it('debe formatear correctamente los ingredientes excluidos y notas culinarias', () => {
    const formatted = formatCulinaryExclusions(['Cebolla Morada', 'Tomate Chonto'], 'Término medio')
    expect(formatted).toBe('Sin Cebolla Morada, Sin Tomate Chonto, Término medio')

    const onlyExclusions = formatCulinaryExclusions(['Pepinillos'])
    expect(onlyExclusions).toBe('Sin Pepinillos')
  })
})
