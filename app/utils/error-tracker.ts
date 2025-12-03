/**
 * Error tracking and monitoring utility
 * Integrates with Sentry or other error tracking services
 */

import { logger } from './logger'

export interface ErrorContext {
  [key: string]: unknown
  userId?: string | number
  userEmail?: string
  component?: string
  action?: string
  url?: string
  tags?: Record<string, string>
}

class ErrorTracker {
  private isInitialized = false
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  /**
   * Initialize error tracking service (e.g., Sentry)
   * Call this in a plugin
   */
  init(config?: { dsn?: string, environment?: string }): void {
    if (this.isInitialized) return

    // TODO: Initialize Sentry or other error tracking service
    // Example:
    // if (config?.dsn && !this.isDevelopment) {
    //   Sentry.init({
    //     dsn: config.dsn,
    //     environment: config.environment || 'production',
    //     tracesSampleRate: 1.0,
    //   })
    // }

    this.isInitialized = true
    logger.info('Error tracker initialized', { environment: config?.environment })
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: ErrorContext) {
    console.error('Error captured:', error, context)
    
    if (this.sentryInstance) {
      this.sentryInstance.captureException(error, { 
        extra: context,
        tags: {
          component: context?.component as string,
          userId: context?.userId as string
        }
      })
      // Sentry.captureException(error, {
      //   contexts: { custom: context },
      //   tags: context?.tags,
      //   user: context?.userId ? { id: String(context.userId), email: context?.userEmail } : undefined
      // })
    }
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    logger[level === 'warning' ? 'warn' : level](message, context)

    if (!this.isDevelopment && this.isInitialized) {
      // TODO: Send to Sentry
      // Sentry.captureMessage(message, {
      //   level,
      //   contexts: { custom: context },
      //   tags: context?.tags
      // })
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string | number, email?: string, username?: string } | null): void {
    if (!this.isDevelopment && this.isInitialized) {
      // TODO: Set user in Sentry
      // Sentry.setUser(user ? {
      //   id: String(user.id),
      //   email: user.email,
      //   username: user.username
      // } : null)
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.isDevelopment && this.isInitialized) {
      // TODO: Add breadcrumb to Sentry
      // Sentry.addBreadcrumb({
      //   message,
      //   category,
      //   data,
      //   level: 'info'
      // })
    }
  }

  /**
   * Handle API errors specifically
   */
  captureApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | unknown,
    context?: ErrorContext
  ): void {
    this.captureException(error, {
      ...context,
      component: 'API',
      action: `${method} ${endpoint}`,
      tags: {
        endpoint,
        method,
        statusCode: String(statusCode),
        ...context?.tags
      }
    })
  }

  /**
   * Handle Vue component errors
   */
  captureComponentError(
    error: Error | unknown,
    component: string,
    action: string,
    context?: ErrorContext
  ): void {
    this.captureException(error, {
      ...context,
      component,
      action,
      tags: {
        component,
        action,
        ...context?.tags
      }
    })
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker()
