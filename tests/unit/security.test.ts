import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  validateUUID,
  validateNumeric,
  validateSqlSafeString
} from '@/lib/security'

describe('🛡️ PILLAR 5: Security Hardening (Anti-XSS & Anti-SQLi)', () => {
  describe('XSS Neutralization', () => {
    it('elimina scripts maliciosos e iframes inyectados', () => {
      const dirty = 'Hamburguesa <script>alert("hack")</script> Especial'
      expect(sanitizeText(dirty)).toBe('Hamburguesa  Especial')

      const iframeDirty = '<iframe src="http://malicious.site"></iframe>Mesa 4'
      expect(sanitizeText(iframeDirty)).toBe('Mesa 4')
    })

    it('neutraliza manejadores de eventos peligrosos (onload, onerror, onclick)', () => {
      const dirty = '<img src=x onerror=alert(1)> Sin cebolla'
      const clean = sanitizeText(dirty)
      expect(clean).not.toContain('onerror')
      expect(clean).toContain('Sin cebolla')
    })

    it('neutraliza esquemas de protocolo peligrosos como javascript:', () => {
      const dirty = 'javascript:alert(document.cookie)'
      const clean = sanitizeText(dirty)
      expect(clean).toContain('javascript_neutralized:')
    })

    it('escapa caracteres especiales para prevenir deformación HTML', () => {
      const dirty = 'Cliente "VIP" & Amigos <test>'
      const clean = sanitizeText(dirty)
      expect(clean).toContain('&quot;VIP&quot;')
      expect(clean).toContain('&amp;')
    })
  })

  describe('SQL Injection Detection', () => {
    it('detecta y rechaza patrones clásicos de inyección SQL', () => {
      expect(validateSqlSafeString("' OR 1=1 --")).toBe(false)
      expect(validateSqlSafeString('" OR ""=""')).toBe(false)
      expect(validateSqlSafeString("admin' UNION SELECT * FROM profiles --")).toBe(false)
      expect(validateSqlSafeString("; DROP TABLE orders;")).toBe(false)
      expect(validateSqlSafeString("1; DELETE FROM cash_expenses;")).toBe(false)
    })

    it('permite búsquedas y textos legítimos en español', () => {
      expect(validateSqlSafeString('Hamburguesa Angus Doble')).toBe(true)
      expect(validateSqlSafeString('Mesa 4 - Salón Principal')).toBe(true)
      expect(validateSqlSafeString('Pago de nómina y compra de verduras frescas')).toBe(true)
      expect(validateSqlSafeString('Juan Pérez (Cliente Frecuente)')).toBe(true)
    })
  })

  describe('UUID & Numeric Validation', () => {
    it('valida identificadores UUID v4 genuinos', () => {
      expect(validateUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true)
      expect(validateUUID('invalid-uuid')).toBe(false)
      expect(validateUUID('')).toBe(false)
      expect(validateUUID(null)).toBe(false)
    })

    it('valida límites numéricos y descarta valores no seguros', () => {
      expect(validateNumeric(15.5, 0, 100)).toEqual({ isValid: true, value: 15.5 })
      expect(validateNumeric(-5, 0, 100)).toEqual({ isValid: false, value: 0 })
      expect(validateNumeric(NaN, 0, 100)).toEqual({ isValid: false, value: 0 })
      expect(validateNumeric(Infinity, 0, 100)).toEqual({ isValid: false, value: 0 })
    })
  })
})
