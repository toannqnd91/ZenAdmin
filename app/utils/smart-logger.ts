/**
 * Smart Logger - Auto-disable console.log in production
 * Replaces all console.log with structured logging
 */

import { logger } from './logger'

/**
 * Smart console wrapper that auto-disables in production
 */
export const smartConsole = {
  log: (...args: any[]) => {
    if (process.dev) {
      console.log(...args)
    } else {
      logger.debug('Console log', { args })
    }
  },
  
  error: (...args: any[]) => {
    if (process.dev) {
      console.error(...args)
    } else {
      logger.error('Console error', { args })
    }
  },
  
  warn: (...args: any[]) => {
    if (process.dev) {
      console.warn(...args)
    } else {
      logger.warn('Console warn', { args })
    }
  },
  
  info: (...args: any[]) => {
    if (process.dev) {
      console.info(...args)
    } else {
      logger.info('Console info', { args })
    }
  },
  
  debug: (...args: any[]) => {
    if (process.dev) {
      console.debug(...args)
    }
    // Don't log debug in production
  }
}

/**
 * Disable native console in production
 */
if (!process.dev && process.client) {
  const noop = () => {}
  window.console.log = noop
  window.console.debug = noop
  // Keep error and warn for critical issues
}

/**
 * Global error handler
 */
if (process.client) {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason
    })
  })
}
