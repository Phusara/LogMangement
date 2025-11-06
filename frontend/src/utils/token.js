/**
 * Token utilities
 * JWT token parsing and validation
 */

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Parsed token payload
 */
export function parseJWT(token) {
  if (!token || typeof token !== 'string') return null
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch (error) {
    console.warn('Failed to parse JWT token:', error)
    return null
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export function isTokenExpired(token) {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return true
  
  const expirationTime = payload.exp * 1000 // Convert to milliseconds
  const currentTime = Date.now()
  
  return currentTime >= expirationTime
}

/**
 * Get token expiration date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date
 */
export function getTokenExpiration(token) {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return null
  
  return new Date(payload.exp * 1000)
}

/**
 * Get time until token expires (in milliseconds)
 * @param {string} token - JWT token
 * @returns {number} Milliseconds until expiration, or 0 if expired
 */
export function getTokenTimeToExpire(token) {
  const expirationDate = getTokenExpiration(token)
  if (!expirationDate) return 0
  
  const timeRemaining = expirationDate.getTime() - Date.now()
  return Math.max(0, timeRemaining)
}

/**
 * Check if token needs refresh (less than 5 minutes until expiration)
 * @param {string} token - JWT token
 * @param {number} threshold - Threshold in milliseconds (default: 5 minutes)
 * @returns {boolean} True if token should be refreshed
 */
export function shouldRefreshToken(token, threshold = 5 * 60 * 1000) {
  const timeRemaining = getTokenTimeToExpire(token)
  return timeRemaining > 0 && timeRemaining < threshold
}

/**
 * Normalize token type (capitalize first letter)
 * @param {string} tokenType - Token type (e.g., 'bearer', 'Bearer')
 * @returns {string} Normalized token type
 */
export function normalizeTokenType(tokenType) {
  if (!tokenType || typeof tokenType !== 'string') return 'Bearer'
  
  const trimmed = tokenType.trim()
  if (!trimmed) return 'Bearer'
  
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}
