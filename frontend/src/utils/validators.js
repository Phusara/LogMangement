/**
 * Form validation utilities
 * Reusable validators for form inputs
 */

/**
 * Validator functions
 */
export const validators = {
  /**
   * Required field validator
   * @param {any} value - Value to validate
   * @returns {boolean|string} True if valid, error message otherwise
   */
  required: (value) => {
    if (value === null || value === undefined) return 'This field is required'
    if (typeof value === 'string' && !value.trim()) return 'This field is required'
    if (Array.isArray(value) && value.length === 0) return 'This field is required'
    return true
  },
  
  /**
   * Minimum length validator
   * @param {number} min - Minimum length
   * @returns {Function} Validator function
   */
  minLength: (min) => (value) => {
    if (!value) return true // Skip if empty (use required separately)
    const length = typeof value === 'string' ? value.length : String(value).length
    return length >= min || `Minimum ${min} characters required`
  },
  
  /**
   * Maximum length validator
   * @param {number} max - Maximum length
   * @returns {Function} Validator function
   */
  maxLength: (max) => (value) => {
    if (!value) return true
    const length = typeof value === 'string' ? value.length : String(value).length
    return length <= max || `Maximum ${max} characters allowed`
  },
  
  /**
   * Email validator
   * @param {string} value - Email to validate
   * @returns {boolean|string}
   */
  email: (value) => {
    if (!value) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) || 'Invalid email address'
  },
  
  /**
   * URL validator
   * @param {string} value - URL to validate
   * @returns {boolean|string}
   */
  url: (value) => {
    if (!value) return true
    try {
      new URL(value)
      return true
    } catch {
      return 'Invalid URL'
    }
  },
  
  /**
   * Number validator
   * @param {any} value - Value to validate
   * @returns {boolean|string}
   */
  number: (value) => {
    if (!value) return true
    return !isNaN(Number(value)) || 'Must be a number'
  },
  
  /**
   * Pattern validator
   * @param {RegExp} pattern - Regex pattern
   * @param {string} message - Error message
   * @returns {Function} Validator function
   */
  pattern: (pattern, message = 'Invalid format') => (value) => {
    if (!value) return true
    return pattern.test(value) || message
  },
  
  /**
   * Password strength validator
   * @param {string} value - Password to validate
   * @returns {boolean|string}
   */
  strongPassword: (value) => {
    if (!value) return true
    
    const hasUpperCase = /[A-Z]/.test(value)
    const hasLowerCase = /[a-z]/.test(value)
    const hasNumber = /[0-9]/.test(value)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
    const isLongEnough = value.length >= 8
    
    if (!isLongEnough) return 'Password must be at least 8 characters'
    if (!hasUpperCase) return 'Password must contain an uppercase letter'
    if (!hasLowerCase) return 'Password must contain a lowercase letter'
    if (!hasNumber) return 'Password must contain a number'
    if (!hasSpecialChar) return 'Password must contain a special character'
    
    return true
  },
  
  /**
   * Match field validator (for password confirmation)
   * @param {any} compareValue - Value to compare against
   * @param {string} fieldName - Name of field to match
   * @returns {Function} Validator function
   */
  matches: (compareValue, fieldName = 'field') => (value) => {
    return value === compareValue || `Must match ${fieldName}`
  },
}

/**
 * Validate a value against multiple validators
 * @param {any} value - Value to validate
 * @param {Array<Function>} validatorList - Array of validator functions
 * @returns {string|null} Error message or null if valid
 */
export function validate(value, validatorList) {
  for (const validator of validatorList) {
    const result = validator(value)
    if (result !== true) {
      return result
    }
  }
  return null
}

/**
 * Validate an object against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Errors object
 */
export function validateForm(data, schema) {
  const errors = {}
  
  for (const [field, validatorList] of Object.entries(schema)) {
    const value = data[field]
    const error = validate(value, validatorList)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

/**
 * Check if form has errors
 * @param {Object} errors - Errors object
 * @returns {boolean}
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
