/**
 * Sentry Plugin - Initialize error tracking
 */

import { sentryTracker } from '@/utils/error-tracker-sentry'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()

  // Initialize Sentry if DSN is provided
  if (config.public.sentryDsn) {
    await sentryTracker.init({
      dsn: config.public.sentryDsn,
      environment: config.public.sentryEnvironment || 'production',
      tracesSampleRate: Number(config.public.sentryTracesSampleRate) || 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0
    })

    // Set up Vue error handler
    nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
      console.error('Vue error:', error, info)
      sentryTracker.captureException(error, {
        component: instance?.$options.name || 'Unknown',
        info
      })
    }

    // Set up global error handler
    if (process.client) {
      window.addEventListener('error', (event) => {
        sentryTracker.captureException(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        sentryTracker.captureException(event.reason, {
          type: 'unhandledrejection'
        })
      })
    }
  }

  return {
    provide: {
      sentry: sentryTracker
    }
  }
})
