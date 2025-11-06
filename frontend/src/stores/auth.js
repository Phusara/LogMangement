import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { buildEndpoint } from '@/config/api'
import { logger } from '@/utils/logger'
import { 
  isTokenExpired, 
  getTokenExpiration, 
  shouldRefreshToken,
  normalizeTokenType 
} from '@/utils/token'

const STORAGE_KEY = 'logmonitor-auth'
const isBrowser = typeof window !== 'undefined'

/**
 * Read persisted auth state from localStorage
 * @returns {Object|null}
 */
const readPersistedState = () => {
  if (!isBrowser) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const state = raw ? JSON.parse(raw) : null
    
    // Validate token expiration on hydration
    if (state?.accessToken && isTokenExpired(state.accessToken)) {
      logger.warn('Stored token is expired, clearing state')
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    return state
  } catch (error) {
    logger.warn('Failed to parse auth state from storage', error)
    return null
  }
}

/**
 * Write auth state to localStorage
 * @param {Object|null} state - State to persist
 */
const writePersistedState = (state) => {
  if (!isBrowser) return
  try {
    if (!state) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    logger.error('Failed to persist auth state', error)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(null)
  const tokenType = ref('bearer')
  const tokenExpiration = ref(null)
  const user = ref(null)
  const loginPending = ref(false)
  const registerPending = ref(false)
  const lastError = ref(null)

  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false
    // Check if token is expired
    return !isTokenExpired(accessToken.value)
  })
  
  const tokenExpiresAt = computed(() => {
    if (!accessToken.value) return null
    return getTokenExpiration(accessToken.value)
  })
  
  const needsRefresh = computed(() => {
    if (!accessToken.value) return false
    return shouldRefreshToken(accessToken.value)
  })

  /**
   * Hydrate auth state from localStorage
   */
  const hydrate = () => {
    const persisted = readPersistedState()
    if (!persisted) return
    
    accessToken.value = persisted.accessToken ?? null
    tokenType.value = persisted.tokenType ?? 'bearer'
    user.value = persisted.user ?? null
    
    if (accessToken.value) {
      tokenExpiration.value = getTokenExpiration(accessToken.value)
    }
  }

  /**
   * Reset auth state
   */
  const resetState = () => {
    accessToken.value = null
    tokenType.value = 'bearer'
    tokenExpiration.value = null
    user.value = null
    writePersistedState(null)
  }

  /**
   * Set auth state and persist
   * @param {Object} payload - Auth payload
   */
  const setAuthState = (payload) => {
    accessToken.value = payload.accessToken
    tokenType.value = normalizeTokenType(payload.tokenType ?? 'bearer')
    user.value = payload.user ?? null
    
    if (accessToken.value) {
      tokenExpiration.value = getTokenExpiration(accessToken.value)
    }
    
    writePersistedState({
      accessToken: accessToken.value,
      tokenType: tokenType.value,
      user: user.value,
    })
  }

  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>}
   */
  const login = async ({ username, password }) => {
    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    loginPending.value = true
    lastError.value = null
    
    try {
      // Send as JSON with string values
      const response = await fetch(buildEndpoint('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: String(username),
          password: String(password),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || error.message || `HTTP ${response.status}`)
      }

      const payload = await response.json()

      setAuthState({
        accessToken: payload.access_token,
        tokenType: payload.token_type ?? 'bearer',
        user: {
          username,
          role: payload.role ?? null,
        },
      })

      logger.info('User logged in', { username })
      return payload
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
      logger.error('Login failed', { username, error: lastError.value })
      throw error
    } finally {
      loginPending.value = false
    }
  }

  /**
   * Register new user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @param {string} credentials.role - User role
   * @returns {Promise<Object>}
   */
  const register = async ({ username, password, role }) => {
    if (!username || !password || !role) {
      throw new Error('Username, password, and role are required')
    }

    registerPending.value = true
    lastError.value = null
    
    try {
      const response = await fetch(buildEndpoint('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: String(username),
          password: String(password),
          role: String(role),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || error.message || `HTTP ${response.status}`)
      }

      const payload = await response.json()
      logger.info('User registered', { username })
      return payload
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
      logger.error('Registration failed', { username, error: lastError.value })
      throw error
    } finally {
      registerPending.value = false
    }
  }

  /**
   * Logout user
   */
  const logout = () => {
    logger.info('User logged out')
    resetState()
  }

  // Hydrate on store initialization
  hydrate()

  return {
    // State
    accessToken,
    tokenType,
    tokenExpiration,
    tokenExpiresAt,
    user,
    isAuthenticated,
    needsRefresh,
    loginPending,
    registerPending,
    lastError,
    // Actions
    login,
    register,
    logout,
  }
})
