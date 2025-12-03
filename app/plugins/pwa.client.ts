/**
 * PWA Plugin - Service Worker registration
 */

export default defineNuxtPlugin(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw-advanced.js', {
          scope: '/',
          updateViaCache: 'none'
        })

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                // Show update notification
                if (window.confirm('Có phiên bản mới! Bạn có muốn cập nhật không?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                }
              }
            })
          }
        })

        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    })
  }

  // Install prompt
  let deferredPrompt: any = null

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    
    // Show install button/banner
    })

  // Provide install method
  return {
    provide: {
      pwa: {
        install: async () => {
          if (!deferredPrompt) {
            return false
          }

          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          
          if (outcome === 'accepted') {
            }
          
          deferredPrompt = null
          return outcome === 'accepted'
        },
        canInstall: () => !!deferredPrompt
      }
    }
  }
})
