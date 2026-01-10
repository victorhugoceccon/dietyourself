// Service Worker para LifeFit PWA
const CACHE_NAME = 'lifefit-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('Erro ao fazer cache:', error)
      })
  )
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // Ignorar esquemas não http/https (ex.: chrome-extension) para evitar erro no Cache.put
  if (!url.startsWith('http')) {
    return
  }

  // Ignorar requisições de API, scripts locais de dev e fontes externas específicas
  if (url.includes('/api/') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com') ||
      url.includes('/src/')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse
          }

          const responseToCache = networkResponse.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
            .catch((err) => console.error('Erro ao armazenar no cache:', err))

          return networkResponse
        })
      })
      .catch(() => caches.match('/index.html'))
  )
})
