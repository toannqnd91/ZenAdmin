/**
 * Enterprise-grade structured logging system
 * Supports different log levels and structured data
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogContext {
  [key: string]: unknown
  userId?: string | number
  requestId?: string
  service?: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  error?: Error | unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  stack?: string
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    // Add stack trace for errors
    if (context?.error instanceof Error) {
      entry.stack = context.error.stack
    }

    return entry
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print in development
      const color = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.FATAL]: '\x1b[35m'  // Magenta
      }[entry.level]
      const reset = '\x1b[0m'

      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`)
      if (entry.context) {
        // Format body/request/response as single-line JSON
        const contextCopy = { ...entry.context }
        if (contextCopy.requestBody) {
          console.log('Request Body:', JSON.stringify(contextCopy.requestBody))
          delete contextCopy.requestBody
        }
        if (contextCopy.body) {
          console.log('Response Body:', JSON.stringify(contextCopy.body))
          delete contextCopy.body
        }
        // Show remaining context
        if (Object.keys(contextCopy).length > 0) {
          console.log('Context:', contextCopy)
        }
      }
      if (entry.stack) {
        console.log('Stack:', entry.stack)
      }
    } else {
      // JSON format for production (easy to parse by log aggregators)
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    this.output(this.formatLog(LogLevel.DEBUG, message, context))
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    this.output(this.formatLog(LogLevel.INFO, message, context))
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    this.output(this.formatLog(LogLevel.WARN, message, context))
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return
    this.output(this.formatLog(LogLevel.ERROR, message, context))
  }

  fatal(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.FATAL)) return
    this.output(this.formatLog(LogLevel.FATAL, message, context))
  }

  // HTTP request logging helper
  logRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.output(this.formatLog(
      level,
      `${method} ${url} ${statusCode}`,
      {
        ...context,
        method,
        url,
        statusCode,
        duration
      }
    ))
  }

  // API call logging helper
  logApiCall(endpoint: string, method: string, success: boolean, duration: number, context?: LogContext): void {
    const message = `API ${method} ${endpoint} ${success ? 'succeeded' : 'failed'}`
    this.output(this.formatLog(
      success ? LogLevel.INFO : LogLevel.ERROR,
      message,
      {
        ...context,
        endpoint,
        method,
        success,
        duration
      }
    ))
  }
}

// Singleton instance
export const logger = new Logger()
