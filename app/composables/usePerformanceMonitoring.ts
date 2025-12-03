/**
 * Real User Monitoring (RUM) Composable
 * Track frontend performance metrics
 */

import { performanceMonitor } from '@/utils/performance-monitor'

export const usePerformanceMonitoring = () => {
  const trackPageLoad = () => {
    if (process.client && window.performance) {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart
      const renderTime = perfData.domComplete - perfData.domLoading

      performanceMonitor.recordMetric('page_load_time', pageLoadTime)
      performanceMonitor.recordMetric('dom_ready_time', domReadyTime)
      performanceMonitor.recordMetric('render_time', renderTime)

      // Track to analytics if available
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'page_load',
          value: pageLoadTime,
          event_category: 'Performance'
        })
      }

      return {
        pageLoadTime,
        domReadyTime,
        renderTime
      }
    }
    return null
  }

  const trackWebVitals = async () => {
    if (process.client) {
      try {
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals')

        // Cumulative Layout Shift
        onCLS((metric) => {
          performanceMonitor.recordMetric('CLS', metric.value)
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'CLS',
              value: Math.round(metric.value * 1000)
            })
          }
        })

        // First Input Delay
        onFID((metric) => {
          performanceMonitor.recordMetric('FID', metric.value)
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(metric.value)
            })
          }
        })

        // First Contentful Paint
        onFCP((metric) => {
          performanceMonitor.recordMetric('FCP', metric.value)
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FCP',
              value: Math.round(metric.value)
            })
          }
        })

        // Largest Contentful Paint
        onLCP((metric) => {
          performanceMonitor.recordMetric('LCP', metric.value)
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(metric.value)
            })
          }
        })

        // Time to First Byte
        onTTFB((metric) => {
          performanceMonitor.recordMetric('TTFB', metric.value)
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'TTFB',
              value: Math.round(metric.value)
            })
          }
        })
      } catch (error) {
        console.warn('Web Vitals not available:', error)
      }
    }
  }

  const trackResourceTiming = () => {
    if (process.client && window.performance) {
      const resources = window.performance.getEntriesByType('resource')
      
      const slowResources = resources
        .filter((r: any) => r.duration > 1000)
        .map((r: any) => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize
        }))

      if (slowResources.length > 0) {
        console.warn('Slow resources detected:', slowResources)
      }

      return slowResources
    }
    return []
  }

  const getLighthouseScore = async () => {
    // This would typically be done in CI/CD or via Lighthouse CI
    // Here we just provide a placeholder for manual testing
    console.info('Run Lighthouse audit: npx lighthouse https://your-domain.com --view')
  }

  return {
    trackPageLoad,
    trackWebVitals,
    trackResourceTiming,
    getLighthouseScore
  }
}
