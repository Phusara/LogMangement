/**
 * API Client
 * Unified HTTP client with authentication, error handling, and request cancellation
 */

import { useAuthStore } from '@/stores/auth'
import { API_CONFIG } from '@/config/api'
import { logger } from '@/utils/logger'

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Make an authenticated API request
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<any>} Response data
 * @throws {ApiError} If request fails
 */
export async function apiRequest(url, options = {}) {
  const authStore = useAuthStore()
  
  // Build headers
  const headers = new Headers({
    ...API_CONFIG.headers,
    ...options.headers,
  })
  
  // Add authentication if available
  if (authStore.accessToken) {
    headers.set('Authorization', `Bearer ${authStore.accessToken}`)
  }
  
  // Merge options
  const requestOptions = {
    ...options,
    headers,
  }
  
  logger.debug('API Request', { url, method: options.method || 'GET' })
  
  try {
    const response = await fetch(url, requestOptions)
    
    // Parse response
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()
    
    // Handle error responses
    if (!response.ok) {
      const message = typeof data === 'string' 
        ? data 
        : data?.detail || data?.message || `HTTP ${response.status}`
      
      logger.error('API Error', { url, status: response.status, message })
      throw new ApiError(message, response.status, data)
    }
    
    logger.debug('API Response', { url, status: response.status })
    return data
  } catch (error) {
    // Handle network errors
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle abort errors
    if (error.name === 'AbortError') {
      logger.debug('Request cancelled', { url })
      throw error
    }
    
    // Handle other errors
    logger.error('Network Error', { url, error: error.message })
    throw new ApiError(
      error.message || 'Network request failed',
      0,
      null
    )
  }
}

/**
 * Make a GET request
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function get(url, options = {}) {
  return apiRequest(url, { ...options, method: 'GET' })
}

/**
 * Make a POST request
 * @param {string} url - Request URL
 * @param {any} data - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function post(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Make a PUT request
 * @param {string} url - Request URL
 * @param {any} data - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function put(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Make a DELETE request
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function del(url, options = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' })
}

/**
 * Make a PATCH request
 * @param {string} url - Request URL
 * @param {any} data - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function patch(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
