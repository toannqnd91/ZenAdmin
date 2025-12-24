/**
 * Offline Mode Composable
 * Detects and handles offline/online state
 */

export const useOffline = () => {
  const isOnline = ref(true)
  const wasOffline = ref(false)

  // Check initial state
  if (process.client) {
    isOnline.value = navigator.onLine
  }

  // Listen for online/offline events
  onMounted(() => {
    const handleOnline = () => {
      isOnline.value = true
      
      if (wasOffline.value) {
        wasOffline.value = false
        
        // Show notification
        showNotification('Đã kết nối lại internet', 'success')
        
        // Trigger sync if needed
        if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
          navigator.serviceWorker.ready.then(registration => {
            return (registration as any).sync.register('sync-data')
          })
        }
      }
    }

    const handleOffline = () => {
      isOnline.value = false
      wasOffline.value = true
      
      // Show notification
      showNotification('Mất kết nối internet - Đang ở chế độ offline', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
  })

  // Check connection quality
  const connectionQuality = computed(() => {
    if (!process.client || !(navigator as any).connection) return 'unknown'
    
    const connection = (navigator as any).connection
    const effectiveType = connection.effectiveType
    
    if (effectiveType === '4g') return 'excellent'
    if (effectiveType === '3g') return 'good'
    if (effectiveType === '2g') return 'poor'
    return 'slow'
  })

  // Show notification helper  
  const showNotification = (message: string, type: 'success' | 'warning' | 'error' = 'warning') => {
    // Implement your notification system here
    // For now, just log to console in dev mode
    if (process.dev) {
    }
  }

  // Check if service worker is active
  const isServiceWorkerActive = ref(false)
  
  if (process.client && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      isServiceWorkerActive.value = true
    })
  }

  return {
    isOnline: readonly(isOnline),
    isOffline: computed(() => !isOnline.value),
    wasOffline: readonly(wasOffline),
    connectionQuality,
    isServiceWorkerActive: readonly(isServiceWorkerActive)
  }
}
