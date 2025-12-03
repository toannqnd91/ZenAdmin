/**
 * Advanced Service Worker with Workbox-like strategies
 * Best practices for PWA offline support
 */

const VERSION = '2.0.0'
const CACHE_NAME = `zen-admin-v${VERSION}`
const RUNTIME_CACHE = `zen-admin-runtime-v${VERSION}`
const IMAGE_CACHE = `zen-admin-images-v${VERSION}`
const API_CACHE = `zen-admin-api-v${VERSION}`

// Cache configuration
const CACHE_CONFIG = {
  maxEntries: 50,
  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
}

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', VERSION)
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Precache failed:', err))
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', VERSION)
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => {
              return name.startsWith('zen-admin-') && 
                     name !== CACHE_NAME && 
                     name !== RUNTIME_CACHE &&
                     name !== IMAGE_CACHE &&
                     name !== API_CACHE
            })
            .map(name => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests - Network First with timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 3000))
    return
  }

  // Images - Cache First
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE))
    return
  }

  // Static assets - Cache First with network fallback
  if (/\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE))
    return
  }

  // HTML pages - Network First with cache fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE, 2000))
    return
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE, 3000))
})

/**
 * Network First Strategy with timeout
 * Try network first, fallback to cache if network fails or times out
 */
async function networkFirstStrategy(request, cacheName, timeout = 3000) {
  try {
    // Race between network and timeout
    const networkPromise = fetch(request)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )

    const response = await Promise.race([networkPromise, timeoutPromise])

    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    
    // Try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback to offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }

    // Return error response
    return new Response('Network error', {
      status: 408,
      statusText: 'Network timeout'
    })
  }
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network if not found
 */
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    // Fetch from network
    const response = await fetch(request)

    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName)
      
      // Implement cache size limit
      await limitCacheSize(cacheName, CACHE_CONFIG.maxEntries)
      
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.error('[SW] Cache and network failed:', request.url)
    
    // Return offline response
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Limit cache size (LRU eviction)
 */
async function limitCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxEntries) {
    // Remove oldest entries
    const toDelete = keys.slice(0, keys.length - maxEntries)
    await Promise.all(toDelete.map(key => cache.delete(key)))
  }
}

/**
 * Background Sync
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  try {
    // Implement your sync logic here
    console.log('[SW] Syncing data...')
    
    // Example: sync pending requests from IndexedDB
    // const pendingRequests = await getPendingRequests()
    // await Promise.all(pendingRequests.map(req => fetch(req)))
    
    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Sync failed:', error)
    return Promise.reject(error)
  }
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('Zen Admin', options)
  )
})

/**
 * Notification Click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/')
  )
})

/**
 * Message handler
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('zen-admin-'))
            .map(name => caches.delete(name))
        )
      })
    )
  }
})

console.log('[SW] Service Worker loaded, version:', VERSION)
