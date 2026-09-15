const CACHE_NAME = 'bites-app-v1'
const STATIC_ASSETS = [
  '/bites-app-web/',
  '/bites-app-web/pos',
  '/bites-app-web/kitchen',
  '/bites-app-web/manifest.json'
]

// Instalación: Cachear App Shell estático
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Fallo al precachear algunos assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activación: Limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Estrategia Network-First con Fallback a Cache para navegación y offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Omitir peticiones no GET o externas de analítica
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return // Las APIs se manejan con IndexedDB en offline

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar respuesta en caché si es válida
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback a caché cuando no hay red
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // Si es una navegación HTML, devolver la shell principal
          if (event.request.mode === 'navigate') {
            return caches.match('/bites-app-web/')
          }
        })
      })
  )
})
