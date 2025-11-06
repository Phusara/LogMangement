/**
 * Logger utility
 * Centralized logging with environment-aware output
 */

import { env } from '@/config/env'

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

const currentLevel = env.isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 * @returns {Array}
 */
function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level}]`
  
  if (data !== undefined) {
    return [prefix, message, data]
  }
  return [prefix, message]
}

/**
 * Logger object
 */
export const logger = {
  /**
   * Log debug message
   * @param {string} message - Message
   * @param {any} data - Additional data
   */
  debug(message, data) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(...formatMessage('DEBUG', message, data))
    }
  },
  
  /**
   * Log info message
   * @param {string} message - Message
   * @param {any} data - Additional data
   */
  info(message, data) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info(...formatMessage('INFO', message, data))
    }
  },
  
  /**
   * Log warning message
   * @param {string} message - Message
   * @param {any} data - Additional data
   */
  warn(message, data) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(...formatMessage('WARN', message, data))
    }
  },
  
  /**
   * Log error message
   * @param {string} message - Message
   * @param {any} data - Additional data
   */
  error(message, data) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(...formatMessage('ERROR', message, data))
    }
  },
}
