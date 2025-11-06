/**
 * Async composable
 * Handles async operations with loading, error, and data states
 */

import { ref } from 'vue'

/**
 * Execute async function with state management
 * @param {Function} asyncFn - Async function to execute
 * @returns {Object} Reactive state and execute function
 */
export function useAsync(asyncFn) {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)
  
  /**
   * Execute the async function
   * @param {...any} args - Arguments to pass to asyncFn
   * @returns {Promise<any>}
   */
  const execute = async (...args) => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await asyncFn(...args)
      return data.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Reset state
   */
  const reset = () => {
    loading.value = false
    error.value = null
    data.value = null
  }
  
  return {
    loading,
    error,
    data,
    execute,
    reset,
  }
}
