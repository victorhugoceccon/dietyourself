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
  // Ignorar requisições de API e outras que não devem ser cacheadas
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível, senão buscar da rede
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          // Verificar se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clonar a resposta
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
      .catch(() => {
        // Se falhar, retornar página offline (se disponível)
        return caches.match('/index.html')
      })
  )
})
