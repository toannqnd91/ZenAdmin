/**
 * Sentry Error Tracking Integration
 * Production-ready error monitoring
 */

import { logger } from './logger'

export interface SentryConfig {
  dsn: string
  environment?: string
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
}

class SentryErrorTracker {
  private isInitialized = false
  private sentryInstance: any = null

  /**
   * Initialize Sentry
   */
  async init(config: SentryConfig): Promise<void> {
    if (this.isInitialized || !config.dsn) return

    try {
      // Dynamic import Sentry only when needed
      const Sentry = await import('@sentry/vue')
      
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment || 'production',
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true
          })
        ],
        tracesSampleRate: config.tracesSampleRate || 0.1,
        replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1,
        replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
        beforeSend(event, hint) {
          // Filter out non-critical errors
          if (event.level === 'warning' || event.level === 'info') {
            return null
          }
          return event
        },
        ignoreErrors: [
          // Browser extensions
          'top.GLOBALS',
          // Random plugins/extensions
          'originalCreateNotification',
          'canvas.contentDocument',
          'MyApp_RemoveAllHighlights',
          // Network errors
          'NetworkError',
          'Failed to fetch'
        ]
      })

      this.sentryInstance = Sentry
      this.isInitialized = true
      logger.info('Sentry initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Sentry', { 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error | unknown, context?: Record<string, any>): void {
    if (!this.isInitialized || !this.sentryInstance) {
      logger.error('Sentry not initialized, logging error locally', { error, context })
      return
    }

    this.sentryInstance.captureException(error, {
      extra: context,
      tags: context?.tags || {}
    })
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.isInitialized || !this.sentryInstance) {
      logger[level === 'warning' ? 'warn' : level](message, context)
      return
    }

    this.sentryInstance.captureMessage(message, {
      level,
      extra: context,
      tags: context?.tags || {}
    })
  }

  /**
   * Set user context
   */
  setUser(user: { id: string | number; email?: string; username?: string } | null): void {
    if (!this.isInitialized || !this.sentryInstance) return

    this.sentryInstance.setUser(user ? {
      id: String(user.id),
      email: user.email,
      username: user.username
    } : null)
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.isInitialized || !this.sentryInstance) return

    this.sentryInstance.addBreadcrumb({
      message,
      category,
      data,
      level: 'info'
    })
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: Record<string, any>): void {
    if (!this.isInitialized || !this.sentryInstance) return

    this.sentryInstance.setContext(name, context)
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized || !this.sentryInstance) return

    this.sentryInstance.setTag(key, value)
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.sentryInstance !== null
  }
}

// Singleton instance
export const sentryTracker = new SentryErrorTracker()
