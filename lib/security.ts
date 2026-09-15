/**
 * Capa de Seguridad, Saneamiento y Validación Defensiva (Anti-XSS & Anti-SQLi)
 */

/**
 * Sanitiza texto libre removiendo etiquetas HTML, scripts, iframes, atributos peligrosos y protocolos maliciosos.
 */
export function sanitizeText(input?: string | null): string {
  if (!input) return ''

  let sanitized = String(input)

  // 1. Eliminar etiquetas <script> e <iframe> con su contenido
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // 2. Neutralizar protocolos peligrosos (javascript:, data:, vbscript:)
  sanitized = sanitized.replace(/(javascript|vbscript|data):/gi, '$1_neutralized:')

  // 3. Neutralizar manejadores de eventos (onload=, onerror=, onclick=, etc.)
  sanitized = sanitized.replace(/\bon\w+\s*=/gi, 'data-blocked=')

  // 4. Remover etiquetas HTML generales dejando solo texto plano seguro
  sanitized = sanitized.replace(/<[^>]*>?/gm, '')

  // 5. Escapar caracteres HTML residuales
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return sanitized.trim()
}

/**
 * Valida si un string cumple con el formato estándar UUID v4.
 */
export function validateUUID(id?: string | null): boolean {
  if (!id) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id.trim())
}

/**
 * Valida que un número esté dentro de un rango seguro y no sea NaN ni Infinity.
 */
export function validateNumeric(
  value: unknown,
  min = 0,
  max = 1_000_000_000
): { isValid: boolean; value: number } {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num) || !isFinite(num) || num < min || num > max) {
    return { isValid: false, value: 0 }
  }
  return { isValid: true, value: num }
}

/**
 * Detecta y rechaza patrones evidentes de inyección SQL en búsquedas y textos de entrada.
 */
export function validateSqlSafeString(str?: string | null): boolean {
  if (!str) return true
  const upper = str.toUpperCase()

  const dangerousPatterns = [
    /(\bOR\b|\bAND\b)\s+(['"]?[^\s=]+['"]?)\s*=\s*\2/i,
    /(\bOR\b|\bAND\b)\s+['"]?1['"]?\s*=\s*['"]?1/i,
    /(\bOR\b|\bAND\b)\s+["']{2}\s*=\s*["']{2}/i,
    /\bUNION\b\s+(\bALL\b\s+)?\bSELECT\b/i,
    /\bDROP\b\s+\bTABLE\b/i,
    /\bDELETE\b\s+\bFROM\b/i,
    /\bINSERT\b\s+\bINTO\b/i,
    /\bUPDATE\b\s+\w+\s+\bSET\b/i,
    /--/,
    /\/\*[\s\S]*?\*\//,
    /;\s*\b(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)\b/i,
    /\bxp_cmdshell\b/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(str)) {
      return false
    }
  }

  return true
}
