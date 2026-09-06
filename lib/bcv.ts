import https from 'https';

export interface BcvRateInfo {
  rate: number
  formattedRate: string
  currency: string
  date: string
  lastUpdated: string
  source: 'bcv_direct' | 'dolarapi_backup' | 'pydolarve_backup' | 'fallback'
}

let cachedRate: BcvRateInfo | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutos de caché en memoria

/**
 * Consulta directa a la página oficial del BCV (https://www.bcv.org.ve/)
 */
async function fetchDirectFromBcv(): Promise<BcvRateInfo | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.bcv.org.ve',
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          // Extraer tasa USD del bloque: <span> USD</span> ... <strong class="strong-tb">813,73610000</strong>
          const usdMatch = data.match(/USD[\s\S]*?<strong[^>]*>\s*([0-9.,]+)\s*<\/strong>/i)
          // Extraer fecha valor si está presente
          const dateMatch = data.match(/Fecha Valor:[\s\S]*?content="([^"]+)"/i)

          if (usdMatch && usdMatch[1]) {
            const rawRate = usdMatch[1].replace(/\./g, '').replace(',', '.')
            const numRate = parseFloat(rawRate)

            if (!isNaN(numRate) && numRate > 0) {
              const info: BcvRateInfo = {
                rate: numRate,
                formattedRate: numRate.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                }),
                currency: 'Bs/USD',
                date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
                lastUpdated: new Date().toISOString(),
                source: 'bcv_direct',
              }
              return resolve(info)
            }
          }
          resolve(null)
        } catch {
          resolve(null)
        }
      })
    })

    req.on('error', () => resolve(null))
    req.setTimeout(7000, () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

/**
 * Backup 1: ve.dolarapi.com
 */
async function fetchFromDolarApi(): Promise<BcvRateInfo | null> {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 600 },
    })
    if (res.ok) {
      const data = await res.json()
      const rate = typeof data.promedio === 'number' ? data.promedio : parseFloat(data.promedio)
      if (rate > 0) {
        return {
          rate,
          formattedRate: rate.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }),
          currency: 'Bs/USD',
          date: data.fechaActualizacion || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          source: 'dolarapi_backup',
        }
      }
    }
  } catch {
    // Silencioso, pasará al siguiente backup
  }
  return null
}

/**
 * Backup 2: pydolarve.org
 */
async function fetchFromPyDolarVe(): Promise<BcvRateInfo | null> {
  try {
    const res = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      next: { revalidate: 600 },
    })
    if (res.ok) {
      const data = await res.json()
      const price = data.monitors?.usd?.price
      const rate = typeof price === 'number' ? price : parseFloat(price)
      if (rate > 0) {
        return {
          rate,
          formattedRate: rate.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }),
          currency: 'Bs/USD',
          date: data.datetime?.date || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          source: 'pydolarve_backup',
        }
      }
    }
  } catch {
    // Silencioso
  }
  return null
}

/**
 * Obtiene la tasa oficial del BCV con caché y múltiples niveles de respaldo
 */
export async function getBcvRate(): Promise<BcvRateInfo> {
  const now = Date.now()
  if (cachedRate && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRate
  }

  // 1. Intentar scraping directo a www.bcv.org.ve
  const directBcv = await fetchDirectFromBcv()
  if (directBcv) {
    cachedRate = directBcv
    cacheTimestamp = now
    return directBcv
  }

  // 2. Intentar backup ve.dolarapi.com
  const backup1 = await fetchFromDolarApi()
  if (backup1) {
    cachedRate = backup1
    cacheTimestamp = now
    return backup1
  }

  // 3. Intentar backup pydolarve.org
  const backup2 = await fetchFromPyDolarVe()
  if (backup2) {
    cachedRate = backup2
    cacheTimestamp = now
    return backup2
  }

  // 4. Fallback seguro si no hay internet o todos fallaron
  const fallbackRate: BcvRateInfo = {
    rate: 813.74,
    formattedRate: '813,74',
    currency: 'Bs/USD',
    date: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
  }

  cachedRate = fallbackRate
  cacheTimestamp = now
  return fallbackRate
}

/**
 * Helpers para conversión y formato monetario
 */
export function convertUsdToBs(usdAmount: number, rate: number): number {
  return Number((usdAmount * rate).toFixed(2))
}

export function formatBs(bsAmount: number): string {
  return `Bs. ${bsAmount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDualPrice(usdAmount: number, rate: number): string {
  const bsAmount = convertUsdToBs(usdAmount, rate)
  return `$${usdAmount.toFixed(2)} (${formatBs(bsAmount)})`
}
