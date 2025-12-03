/**
 * Analytics Plugin - Google Analytics 4 & Custom Events
 */

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const router = useRouter()

  // Initialize Google Analytics 4
  if (config.public.gaId) {
    // Load gtag script
    useHead({
      script: [
        {
          src: `https://www.googletagmanager.com/gtag/js?id=${config.public.gaId}`,
          async: true
        }
      ]
    })

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', config.public.gaId, {
      send_page_view: false // We'll send manually
    })

    // Track page views on route change
    router.afterEach((to) => {
      gtag('event', 'page_view', {
        page_path: to.fullPath,
        page_title: to.meta.title || document.title,
        page_location: window.location.href
      })
    })
  }

  // Custom analytics tracker
  const analytics = {
    // Track custom events
    trackEvent: (eventName: string, params?: Record<string, any>) => {
      if (config.public.gaId && window.gtag) {
        window.gtag('event', eventName, params)
      }
      
      // Also log to console in development
      if (process.dev) {
        }
    },

    // Track user actions
    trackAction: (action: string, category: string, label?: string, value?: number) => {
      analytics.trackEvent('user_action', {
        event_category: category,
        event_label: label,
        value
      })
    },

    // Track errors
    trackError: (error: Error, context?: Record<string, any>) => {
      analytics.trackEvent('exception', {
        description: error.message,
        fatal: false,
        ...context
      })
    },

    // Track timing
    trackTiming: (category: string, variable: string, value: number, label?: string) => {
      analytics.trackEvent('timing_complete', {
        event_category: category,
        name: variable,
        value,
        event_label: label
      })
    },

    // Track conversions
    trackConversion: (conversionId: string, value?: number, currency: string = 'VND') => {
      analytics.trackEvent('conversion', {
        send_to: conversionId,
        value,
        currency
      })
    },

    // Set user properties
    setUser: (userId: string, properties?: Record<string, any>) => {
      if (config.public.gaId && window.gtag) {
        window.gtag('config', config.public.gaId, {
          user_id: userId,
          ...properties
        })
      }
    },

    // Track page performance
    trackPerformance: () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart
        const renderTime = timing.domComplete - timing.domLoading

        analytics.trackTiming('Performance', 'Page Load', loadTime)
        analytics.trackTiming('Performance', 'DOM Ready', domReadyTime)
        analytics.trackTiming('Performance', 'Render', renderTime)
      }
    }
  }

  // Track performance on load
  if (process.client) {
    window.addEventListener('load', () => {
      setTimeout(() => analytics.trackPerformance(), 0)
    })
  }

  // Provide analytics globally
  return {
    provide: {
      analytics
    }
  }
})

// Type augmentation
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}
