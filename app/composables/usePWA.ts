/**
 * PWA Composable
 * Provides PWA utilities and install prompt
 */

export const usePWA = () => {
  const canInstall = ref(false)
  const isInstalled = ref(false)
  const deferredPrompt = ref<any>(null)

  // Check if already installed
  if (process.client) {
    isInstalled.value = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true
  }

  // Listen for install prompt
  onMounted(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
      }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      canInstall.value = false
      deferredPrompt.value = null
    })

    onUnmounted(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    })
  })

  // Install PWA
  const install = async () => {
    if (!deferredPrompt.value) {
      console.warn('Install prompt not available')
      return false
    }

    try {
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        isInstalled.value = true
      } else {
        }
      
      deferredPrompt.value = null
      canInstall.value = false
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA installation error:', error)
      return false
    }
  }

  // Update service worker
  const updateServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return false

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
      return true
    } catch (error) {
      console.error('Service Worker update failed:', error)
      return false
    }
  }

  // Clear cache
  const clearCache = async () => {
    if (!('serviceWorker' in navigator)) return false

    try {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({ type: 'CLEAR_CACHE' })
        return true
      }
      return false
    } catch (error) {
      console.error('Clear cache failed:', error)
      return false
    }
  }

  // Get cache size
  const getCacheSize = async () => {
    if (!('caches' in window)) return 0

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const name of cacheNames) {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        
        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        }
      }

      return totalSize
    } catch (error) {
      console.error('Get cache size failed:', error)
      return 0
    }
  }

  return {
    canInstall: readonly(canInstall),
    isInstalled: readonly(isInstalled),
    install,
    updateServiceWorker,
    clearCache,
    getCacheSize
  }
}
