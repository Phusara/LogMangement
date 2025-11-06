/**
 * API configuration
 * Centralized API endpoints and settings
 */

import { env } from './env'

/**
 * API configuration object
 */
export const API_CONFIG = {
  baseURL: env.apiBaseUrl,
  timeout: 30000, // 30 seconds
  
  endpoints: {
    // Auth endpoints
    login: '/login',
    register: '/register',
    logout: '/logout',
    refreshToken: '/refresh',
    
    // Dashboard endpoints
    dashboard: '/dashboard',
    
    // Alerts endpoints
    alerts: '/alerts',
    
    // Logs endpoints
    logs: '/logs',

    // Data retention endpoints
    retention: {
      deleteOldData: '/retention/delete-old-data/',
      logsStorage: '/retention/logs-storage/',
      alertsStorage: '/retention/alerts-storage/',
    },
  },
  
  // Default headers
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
}

/**
 * Build full endpoint URL
 * @param {string} endpoint - Endpoint path
 * @returns {string} Full URL
 */
export function buildEndpoint(endpoint) {
  return `${API_CONFIG.baseURL}${endpoint}`
}

/**
 * Build URL with query parameters
 * @param {string} endpoint - Endpoint path
 * @param {Object} params - Query parameters
 * @returns {string} Full URL with query string
 */
export function buildURL(endpoint, params = {}) {
  const url = buildEndpoint(endpoint)
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}
