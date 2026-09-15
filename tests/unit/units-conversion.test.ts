import { describe, it, expect } from 'vitest'
import {
  convertUnitQuantity,
  calculateNormalizedUnitCost,
  validateUnitCompatibility,
  checkRecipeQuantitySanity,
  normalizeUnitCode
} from '@/lib/domain/units'
import {
  calculateRecipeCost,
  getFlattenedIngredientRequirements,
  calculatePreparableDishes,
  IngredientItem,
  RecipeItem,
  RecipeIngredientRelation,
  RecipeSubRecipeRelation
} from '@/lib/domain/recipes'
import { calculatePOSInventoryDeductions } from '@/lib/domain/pos'

describe('?? PILLAR 1: Units of Measurement & Auto-Conversion Engine', () => {
  describe('Unit Conversions', () => {
    it('convierte correctamente entre unidades de masa (kg <-> gr)', () => {
      expect(convertUnitQuantity(1.5, 'kg', 'gr')).toBe(1500)
      expect(convertUnitQuantity(500, 'gr', 'kg')).toBe(0.5)
      expect(convertUnitQuantity(150, 'g', 'kg')).toBe(0.15)
    })

    it('convierte correctamente entre unidades de volumen (lt <-> ml)', () => {
      expect(convertUnitQuantity(0.75, 'lt', 'ml')).toBe(750)
      expect(convertUnitQuantity(250, 'ml', 'lt')).toBe(0.25)
      expect(convertUnitQuantity(100, 'cc', 'lt')).toBe(0.1)
    })

    it('convierte correctamente entre unidades de conteo (und <-> porcion)', () => {
      expect(convertUnitQuantity(2, 'und', 'porcion')).toBe(2)
      expect(convertUnitQuantity(1, 'porción', 'und')).toBe(1)
    })

    it('rechaza conversiones entre familias físicas incompatibles (ej. kg a lt)', () => {
      expect(validateUnitCompatibility('kg', 'lt')).toBe(false)
      expect(() => convertUnitQuantity(1, 'kg', 'lt')).toThrowError(/Conversión incompatible/)
      expect(() => convertUnitQuantity(500, 'ml', 'gr')).toThrowError(/Conversión incompatible/)
    })

    it('calcula el costo unitario normalizado para recetas con diferentes unidades', () => {
      // Insumo en almacén a $11/kg, la receta usa gramos: $11 / 1000 = $0.011 / gr
      const costPerGr = calculateNormalizedUnitCost(11, 'kg', 'gr')
      expect(costPerGr).toBe(0.011)

      // Insumo en almacén a $0.02/gr, receta pide en kg: $0.02 * 1000 = $20 / kg
      const costPerKg = calculateNormalizedUnitCost(0.02, 'gr', 'kg')
      expect(costPerKg).toBe(20)

      // Aceite a $3.5/lt, receta pide en ml: $3.5 / 1000 = $0.0035 / ml
      const costPerMl = calculateNormalizedUnitCost(3.5, 'lt', 'ml')
      expect(costPerMl).toBe(0.0035)
    })

    it('detecta advertencias de cordura en cantidades excesivas de un plato', () => {
      const normalDish = checkRecipeQuantitySanity(150, 'gr')
      expect(normalDish.isSane).toBe(true)

      const typoDish = checkRecipeQuantitySanity(150, 'kg')
      expect(typoDish.isSane).toBe(false)
      expect(typoDish.warningMessage).toContain('Cantidad muy alta')
    })
  })

  describe('Recipe Costing & Inventory Deductions with Units Integration', () => {
    const mockIngredients: IngredientItem[] = [
      { id: 'ing-beef', name: 'Carne Molida Angus', current_stock: 10, cost_per_unit: 12, unit: 'kg' }, // $12/kg = $0.012/gr
      { id: 'ing-bun', name: 'Pan Brioche', current_stock: 50, cost_per_unit: 0.8, unit: 'und' },
      { id: 'ing-sauce', name: 'Salsa Especial', current_stock: 5, cost_per_unit: 6, unit: 'lt' }, // $6/lt = $0.006/ml
    ]

    const mockRecipes: RecipeItem[] = [
      {
        id: 'rec-burger',
        name: 'Burger Angus Especial',
        type: 'final_product',
        price: 12,
        yield_quantity: 1,
        yield_unit: 'porción',
      },
    ]

    const mockRecipeIngredients: RecipeIngredientRelation[] = [
      { recipe_id: 'rec-burger', ingredient_id: 'ing-beef', quantity: 180, unit: 'gr' }, // 180 gr * $0.012 = $2.16
      { recipe_id: 'rec-burger', ingredient_id: 'ing-bun', quantity: 1, unit: 'und' },   // 1 und * $0.80 = $0.80
      { recipe_id: 'rec-burger', ingredient_id: 'ing-sauce', quantity: 30, unit: 'ml' }, // 30 ml * $0.006 = $0.18
    ]

    it('calcula el costo de la receta normalizando unidades mixtas (kg/gr, lt/ml)', () => {
      const breakdown = calculateRecipeCost(
        'rec-burger',
        mockRecipes,
        mockIngredients,
        mockRecipeIngredients,
        []
      )

      // Costo esperado: $2.16 (carne) + $0.80 (pan) + $0.18 (salsa) = $3.14
      expect(breakdown.directIngredientsCost).toBeCloseTo(3.14, 2)
      expect(breakdown.unitCost).toBeCloseTo(3.14, 2)
      expect(breakdown.grossProfit).toBeCloseTo(12 - 3.14, 2)
    })

    it('calcula platos preparables con normalización de unidades de stock', () => {
      // Carne: 10 kg en stock / 0.180 kg por porción = 55 hamburguesas
      // Pan: 50 unidades / 1 por porción = 50 hamburguesas (Limitante)
      // Salsa: 5 lt en stock / 0.030 lt por porción = 166 hamburguesas
      const preparable = calculatePreparableDishes(
        'rec-burger',
        mockRecipes,
        mockIngredients,
        mockRecipeIngredients,
        []
      )

      expect(preparable.preparableUnits).toBe(50)
      expect(preparable.limitingIngredient?.name).toBe('Pan Brioche')
    })

    it('calcula las deducciones exactas de inventario en el POS en las unidades de almacén', () => {
      const deductions = calculatePOSInventoryDeductions(
        [{ recipe_id: 'rec-burger', quantity: 5, unit_price: 12 }],
        mockIngredients,
        mockRecipes,
        mockRecipeIngredients,
        []
      )

      // 5 hamburguesas:
      // Carne: 5 * 180 gr = 900 gr = 0.9 kg deducidos
      // Pan: 5 * 1 und = 5 und deducidas
      // Salsa: 5 * 30 ml = 150 ml = 0.15 lt deducidos
      const beefDeduction = deductions.deductions.find((d) => d.ingredient_id === 'ing-beef')
      expect(beefDeduction?.deducted_quantity).toBe(0.9)
      expect(beefDeduction?.new_stock).toBe(9.1)

      const bunDeduction = deductions.deductions.find((d) => d.ingredient_id === 'ing-bun')
      expect(bunDeduction?.deducted_quantity).toBe(5)
      expect(bunDeduction?.new_stock).toBe(45)

      const sauceDeduction = deductions.deductions.find((d) => d.ingredient_id === 'ing-sauce')
      expect(sauceDeduction?.deducted_quantity).toBe(0.15)
      expect(sauceDeduction?.new_stock).toBe(4.85)
    })
  })
})

