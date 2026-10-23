import { describe, it, expect, beforeEach } from 'vitest'
import {
  getBcvRate,
  setManualBcvRate,
  clearManualBcvRate,
  convertUsdToBs,
  formatBs,
  formatDualPrice,
  BCV_FALLBACK_RATE,
} from '@/lib/bcv'

describe('Motor de Tasa BCV y Conversión Multimoneda', () => {
  beforeEach(() => {
    clearManualBcvRate()
  })

  it('calcula conversiones monetarias correctamente', () => {
    expect(convertUsdToBs(10, 800)).toBe(8000)
    expect(convertUsdToBs(12.5, 850.5)).toBe(10631.25)
    expect(convertUsdToBs(0, 850)).toBe(0)
    expect(convertUsdToBs(10, 0)).toBe(0)
  })

  it('formatea montos en bolívares con localización venezolana', () => {
    expect(formatBs(8500)).toBe('Bs. 8.500,00')
    expect(formatBs(1234567.89)).toBe('Bs. 1.234.567,89')
  })

  it('formatea precios duales USD y Bs.', () => {
    const formatted = formatDualPrice(10, 800)
    expect(formatted).toBe('$10.00 (Bs. 8.000,00)')
  })

  it('permite fijar una tasa manual provisional y tiene prioridad absoluta', async () => {
    const manualInfo = setManualBcvRate(950)
    expect(manualInfo.rate).toBe(950)
    expect(manualInfo.source).toBe('manual_override')
    expect(manualInfo.isStale).toBe(false)

    // Al consultar getBcvRate debe retornar la tasa manual
    const activeRate = await getBcvRate()
    expect(activeRate.rate).toBe(950)
    expect(activeRate.source).toBe('manual_override')

    // Al limpiar la tasa manual debe deshabilitarse
    clearManualBcvRate()
  })

  it('lanza error al intentar fijar una tasa manual negativa o no numérica', () => {
    expect(() => setManualBcvRate(-100)).toThrow()
    expect(() => setManualBcvRate(0)).toThrow()
    expect(() => setManualBcvRate(NaN)).toThrow()
  })

  it('devuelve una tasa positiva y válida al consultar getBcvRate()', async () => {
    const rateInfo = await getBcvRate()
    expect(rateInfo.rate).toBeGreaterThan(0)
    expect(typeof rateInfo.formattedRate).toBe('string')
    expect(rateInfo.currency).toBe('Bs/USD')
    expect(rateInfo.date).toBeDefined()
  })
})
