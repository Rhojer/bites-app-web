import { describe, it, expect } from 'vitest'
import {
  convertUnitQuantity,
  calculateNormalizedUnitCost,
  calculateWeightedAverageCost,
  getDisplayStockAndCost,
} from '@/lib/domain/units'

describe('Inventory Unit Display & Costing Engine', () => {
  describe('Soporte de Miligramos (mg)', () => {
    it('convierte correctamente entre gr, kg y mg', () => {
      expect(convertUnitQuantity(1, 'gr', 'mg')).toBe(1000)
      expect(convertUnitQuantity(500, 'mg', 'gr')).toBe(0.5)
      expect(convertUnitQuantity(1, 'kg', 'mg')).toBe(1000000)
      expect(convertUnitQuantity(250000, 'mg', 'kg')).toBe(0.25)
    })
  })

  describe('Switch de Visualización de Unidades (Macro vs Micro)', () => {
    it('transforma masa de kg a gr en modo micro y viceversa en modo macro', () => {
      // Insumo guardado en kg: 2.5 kg a $12/kg, mín: 1 kg
      const inMicro = getDisplayStockAndCost(2.5, 12, 1, 'kg', 'micro')
      expect(inMicro.stock).toBe(2500)
      expect(inMicro.minStock).toBe(1000)
      expect(inMicro.unit).toBe('gr')
      expect(inMicro.costPerUnit).toBe(0.012) // $12 / 1000 = $0.012/gr

      // Verificar que el valor total en inventario se conserva idéntico
      const originalValue = 2.5 * 12 // $30
      const convertedValue = inMicro.stock * inMicro.costPerUnit // 2500 * 0.012 = $30
      expect(convertedValue).toBeCloseTo(originalValue, 4)

      // Insumo guardado en gr: 500 gr a $0.02/gr, mín: 200 gr en modo macro
      const inMacro = getDisplayStockAndCost(500, 0.02, 200, 'gr', 'macro')
      expect(inMacro.stock).toBe(0.5)
      expect(inMacro.minStock).toBe(0.2)
      expect(inMacro.unit).toBe('kg')
      expect(inMacro.costPerUnit).toBe(20) // $0.02 * 1000 = $20/kg
      expect(inMacro.stock * inMacro.costPerUnit).toBeCloseTo(500 * 0.02, 4)
    })

    it('transforma volumen de lt a ml en modo micro y viceversa en modo macro', () => {
      // Insumo guardado en lt: 1.5 lt a $8/lt
      const inMicro = getDisplayStockAndCost(1.5, 8, 0.5, 'lt', 'micro')
      expect(inMicro.stock).toBe(1500)
      expect(inMicro.minStock).toBe(500)
      expect(inMicro.unit).toBe('ml')
      expect(inMicro.costPerUnit).toBe(0.008) // $8 / 1000 = $0.008/ml

      // Insumo guardado en ml: 250 ml a $0.01/ml
      const inMacro = getDisplayStockAndCost(250, 0.01, 100, 'ml', 'macro')
      expect(inMacro.stock).toBe(0.25)
      expect(inMacro.minStock).toBe(0.1)
      expect(inMacro.unit).toBe('lt')
      expect(inMacro.costPerUnit).toBe(10) // $0.01 * 1000 = $10/lt
    })

    it('no modifica unidades de conteo (und, porcion)', () => {
      const countItem = getDisplayStockAndCost(24, 1.5, 6, 'und', 'micro')
      expect(countItem.stock).toBe(24)
      expect(countItem.minStock).toBe(6)
      expect(countItem.unit).toBe('und')
      expect(countItem.costPerUnit).toBe(1.5)

      const countItemMacro = getDisplayStockAndCost(24, 1.5, 6, 'und', 'macro')
      expect(countItemMacro.stock).toBe(24)
      expect(countItemMacro.unit).toBe('und')
    })
  })

  describe('Costo Promedio Ponderado (PMP / Weighted Average Cost)', () => {
    it('calcula correctamente el precio medio cuando entra una carga a distinto precio', () => {
      // Teníamos 10 kg a $10 ($100 total)
      // Compramos 10 kg a $20 ($200 total)
      // Total 20 kg con valor $300 -> $15/kg
      const pmp = calculateWeightedAverageCost(10, 10, 10, 20)
      expect(pmp).toBe(15)
    })

    it('maneja proporciones desiguales de stock y compras', () => {
      // Teníamos 5 kg a $12 ($60 total)
      // Compramos 15 kg a $16 ($240 total)
      // Total 20 kg con valor $300 -> $15/kg
      const pmp = calculateWeightedAverageCost(5, 12, 15, 16)
      expect(pmp).toBe(15)
    })

    it('adopta el nuevo precio si el stock actual era 0 o negativo', () => {
      // Si el stock actual era 0, el nuevo costo debe ser el precio de la nueva compra
      expect(calculateWeightedAverageCost(0, 5, 10, 8.5)).toBe(8.5)
      expect(calculateWeightedAverageCost(-2, 5, 10, 9.2)).toBe(9.2)
    })

    it('mantiene el costo anterior si la nueva cantidad es 0 o menor', () => {
      expect(calculateWeightedAverageCost(10, 12.5, 0, 20)).toBe(12.5)
    })
  })
})
