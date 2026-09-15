/**
 * Motor de Unidades de Medida y Conversión Gastronómica
 * Soporta conversión segura entre familias de medida:
 * - Masa: kg <-> gr (1 kg = 1000 gr)
 * - Volumen: lt <-> ml (1 lt = 1000 ml)
 * - Conteo: und <-> porcion (1 und = 1 porcion)
 */

export type UnitFamily = 'mass' | 'volume' | 'count'

export interface UnitDefinition {
  code: string
  label: string
  family: UnitFamily
  toBaseFactor: number // Factor para convertir a la unidad base de su familia (gr para masa, ml para volumen, und para conteo)
}

export const SUPPORTED_UNITS: Record<string, UnitDefinition> = {
  // Masa (Base: gr)
  kg: { code: 'kg', label: 'Kilogramos (kg)', family: 'mass', toBaseFactor: 1000 },
  gr: { code: 'gr', label: 'Gramos (gr)', family: 'mass', toBaseFactor: 1 },
  g: { code: 'gr', label: 'Gramos (gr)', family: 'mass', toBaseFactor: 1 },

  // Volumen (Base: ml)
  lt: { code: 'lt', label: 'Litros (lt)', family: 'volume', toBaseFactor: 1000 },
  l: { code: 'lt', label: 'Litros (lt)', family: 'volume', toBaseFactor: 1000 },
  ml: { code: 'ml', label: 'Mililitros (ml)', family: 'volume', toBaseFactor: 1 },
  cc: { code: 'ml', label: 'Mililitros (ml)', family: 'volume', toBaseFactor: 1 },

  // Conteo / Porciones (Base: und)
  und: { code: 'und', label: 'Unidades (und)', family: 'count', toBaseFactor: 1 },
  unid: { code: 'und', label: 'Unidades (und)', family: 'count', toBaseFactor: 1 },
  unit: { code: 'und', label: 'Unidades (und)', family: 'count', toBaseFactor: 1 },
  porcion: { code: 'porcion', label: 'Porción', family: 'count', toBaseFactor: 1 },
  porción: { code: 'porcion', label: 'Porción', family: 'count', toBaseFactor: 1 },
  pieza: { code: 'und', label: 'Unidades (und)', family: 'count', toBaseFactor: 1 },
}

/**
 * Normaliza el código de una unidad (minúsculas, trim, variantes).
 */
export function normalizeUnitCode(unitStr?: string | null): string {
  if (!unitStr) return 'und'
  const cleaned = unitStr.trim().toLowerCase()
  return SUPPORTED_UNITS[cleaned]?.code || cleaned
}

/**
 * Valida si dos unidades pertenecen a la misma familia física.
 */
export function validateUnitCompatibility(unitA: string, unitB: string): boolean {
  const normA = normalizeUnitCode(unitA)
  const normB = normalizeUnitCode(unitB)

  const defA = SUPPORTED_UNITS[normA]
  const defB = SUPPORTED_UNITS[normB]

  if (!defA || !defB) {
    // Si no están en el diccionario estricto, son compatibles solo si sus nombres son idénticos
    return normA === normB
  }

  return defA.family === defB.family
}

/**
 * Convierte una cantidad de una unidad a otra dentro de la misma familia.
 * Lanza un error si las familias son incompatibles.
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  if (quantity === 0) return 0
  const normFrom = normalizeUnitCode(fromUnit)
  const normTo = normalizeUnitCode(toUnit)

  if (normFrom === normTo) return quantity

  const defFrom = SUPPORTED_UNITS[normFrom]
  const defTo = SUPPORTED_UNITS[normTo]

  if (!defFrom || !defTo || defFrom.family !== defTo.family) {
    throw new Error(
      `Conversión incompatible: No se puede convertir de '${fromUnit}' a '${toUnit}' (familias físicas incompatibles o no soportadas).`
    )
  }

  // Convertir origen a unidad base de la familia, y luego a la unidad destino
  const baseQuantity = quantity * defFrom.toBaseFactor
  const targetQuantity = baseQuantity / defTo.toBaseFactor

  return Number(targetQuantity.toFixed(6))
}

/**
 * Calcula el costo unitario normalizado para una receta.
 * Ejemplo: Si el insumo en almacén está en 'kg' a $11/kg y la receta pide en 'gr',
 * el costo por gramo es $0.011/gr.
 */
export function calculateNormalizedUnitCost(
  costPerStorageUnit: number,
  storageUnit: string,
  recipeUnit: string
): number {
  const normStorage = normalizeUnitCode(storageUnit)
  const normRecipe = normalizeUnitCode(recipeUnit)

  if (normStorage === normRecipe) return costPerStorageUnit

  // 1 unidad de receta expresada en unidades de almacén
  const storageUnitsPerRecipeUnit = convertUnitQuantity(1, normRecipe, normStorage)
  return Number((costPerStorageUnit * storageUnitsPerRecipeUnit).toFixed(6))
}

/**
 * Valida límites razonables para una porción de plato para evitar errores tipográficos (ej. 150 kg en vez de 150 gr).
 */
export function checkRecipeQuantitySanity(
  quantity: number,
  unit: string
): { isSane: boolean; warningMessage?: string } {
  const normUnit = normalizeUnitCode(unit)
  const def = SUPPORTED_UNITS[normUnit]

  if (!def) return { isSane: true }

  if (def.family === 'mass') {
    const qtyInKg = convertUnitQuantity(quantity, normUnit, 'kg')
    if (qtyInKg > 10) {
      return {
        isSane: false,
        warningMessage: `?? Cantidad muy alta (${quantity} ${unit} = ${qtyInKg} kg). ¿Quisiste decir gramos (gr)?`,
      }
    }
  }

  if (def.family === 'volume') {
    const qtyInLt = convertUnitQuantity(quantity, normUnit, 'lt')
    if (qtyInLt > 10) {
      return {
        isSane: false,
        warningMessage: `?? Cantidad muy alta (${quantity} ${unit} = ${qtyInLt} lt). ¿Quisiste decir mililitros (ml)?`,
      }
    }
  }

  return { isSane: true }
}

