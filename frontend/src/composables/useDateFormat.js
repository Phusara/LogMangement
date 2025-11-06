/**
 * Date formatting composable
 * Provides consistent date formatting across the application
 */

import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns'

/**
 * Date formatting utilities
 * @returns {Object} Formatting functions
 */
export function useDateFormat() {
  /**
   * Parse date string or Date object
   * @param {string|Date} date - Date to parse
   * @returns {Date|null}
   */
  const parseDate = (date) => {
    if (!date) return null
    
    if (date instanceof Date) {
      return isValid(date) ? date : null
    }
    
    if (typeof date === 'string') {
      const parsed = parseISO(date)
      return isValid(parsed) ? parsed : null
    }
    
    return null
  }
  
  /**
   * Format date and time
   * @param {string|Date} date - Date to format
   * @param {string} formatString - Format string (default: 'MMM dd, yyyy HH:mm:ss')
   * @returns {string}
   */
  const formatDateTime = (date, formatString = 'MMM dd, yyyy HH:mm:ss') => {
    const parsed = parseDate(date)
    if (!parsed) return 'Unknown'
    
    try {
      return format(parsed, formatString)
    } catch (error) {
      console.warn('Date format error:', error)
      return 'Invalid date'
    }
  }
  
  /**
   * Format date only
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatDate = (date) => {
    return formatDateTime(date, 'MMM dd, yyyy')
  }
  
  /**
   * Format time only
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatTime = (date) => {
    return formatDateTime(date, 'HH:mm:ss')
  }
  
  /**
   * Format time with short format
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatTimeShort = (date) => {
    return formatDateTime(date, 'HH:mm')
  }
  
  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatRelativeTime = (date) => {
    const parsed = parseDate(date)
    if (!parsed) return 'Unknown'
    
    try {
      return formatDistance(parsed, new Date(), { addSuffix: true })
    } catch (error) {
      console.warn('Relative date format error:', error)
      return 'Invalid date'
    }
  }
  
  /**
   * Format relative with context (e.g., "yesterday at 3:54 PM")
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatRelativeWithContext = (date) => {
    const parsed = parseDate(date)
    if (!parsed) return 'Unknown'
    
    try {
      return formatRelative(parsed, new Date())
    } catch (error) {
      console.warn('Relative context format error:', error)
      return 'Invalid date'
    }
  }
  
  /**
   * Format timestamp for logs
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatLogTimestamp = (date) => {
    return formatDateTime(date, 'MMM dd, HH:mm:ss')
  }
  
  /**
   * Format full datetime for alerts
   * @param {string|Date} date - Date to format
   * @returns {string}
   */
  const formatAlertTimestamp = (date) => {
    return formatDateTime(date, 'yyyy-MM-dd HH:mm:ss')
  }
  
  return {
    parseDate,
    formatDateTime,
    formatDate,
    formatTime,
    formatTimeShort,
    formatRelativeTime,
    formatRelativeWithContext,
    formatLogTimestamp,
    formatAlertTimestamp,
  }
}
