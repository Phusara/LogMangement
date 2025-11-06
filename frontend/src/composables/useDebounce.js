/**
 * Debounce composable
 * Debounces function calls
 */

import { ref } from 'vue'

/**
 * Debounce a function call
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounceFn(fn, delay = 300) {
  let timeoutId = null
  
  const debouncedFn = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
  
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return debouncedFn
}

/**
 * Debounce a ref value
 * @param {import('vue').Ref} value - Ref to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {import('vue').Ref} Debounced ref
 */
export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value)
  let timeoutId = null
  
  const updateDebouncedValue = (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
      timeoutId = null
    }, delay)
  }
  
  // Watch for changes
  const stop = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return {
    debouncedValue,
    updateDebouncedValue,
    stop,
  }
}
