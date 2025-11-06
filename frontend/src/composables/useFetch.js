/**
 * Fetch composable with request cancellation
 * Automatically cancels requests on component unmount
 */

import { ref, onBeforeUnmount } from 'vue'
import { apiRequest } from '@/api/client'

/**
 * Fetch data with automatic cancellation
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Object} Reactive state and fetch function
 */
export function useFetch(url, options = {}) {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)
  let controller = null
  
  /**
   * Execute fetch request
   * @param {Object} fetchOptions - Additional fetch options
   * @returns {Promise<any>}
   */
  const execute = async (fetchOptions = {}) => {
    // Cancel previous request
    if (controller) {
      controller.abort()
    }
    
    // Create new controller
    controller = new AbortController()
    
    loading.value = true
    error.value = null
    
    try {
      const mergedOptions = {
        ...options,
        ...fetchOptions,
        signal: controller.signal,
      }
      
      data.value = await apiRequest(url, mergedOptions)
      return data.value
    } catch (err) {
      // Don't set error for cancelled requests
      if (err.name !== 'AbortError') {
        error.value = err instanceof Error ? err.message : String(err)
        throw err
      }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Cancel ongoing request
   */
  const cancel = () => {
    if (controller) {
      controller.abort()
      controller = null
    }
  }
  
  /**
   * Reset state
   */
  const reset = () => {
    cancel()
    loading.value = false
    error.value = null
    data.value = null
  }
  
  // Cancel on unmount
  onBeforeUnmount(() => {
    cancel()
  })
  
  return {
    loading,
    error,
    data,
    execute,
    cancel,
    reset,
  }
}
