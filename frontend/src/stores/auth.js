import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'logmonitor-auth'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const isBrowser = typeof window !== 'undefined'

const readPersistedState = () => {
  if (!isBrowser) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Failed to parse auth state from storage', error)
    return null
  }
}

const writePersistedState = (state) => {
  if (!isBrowser) return
  try {
    if (!state) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to persist auth state', error)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(null)
  const tokenType = ref(null)
  const user = ref(null)
  const loginPending = ref(false)
  const registerPending = ref(false)
  const lastError = ref(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  const hydrate = () => {
    const persisted = readPersistedState()
    if (!persisted) return
    accessToken.value = persisted.accessToken ?? null
    tokenType.value = persisted.tokenType ?? null
    user.value = persisted.user ?? null
  }

  const resetState = () => {
    accessToken.value = null
    tokenType.value = null
    user.value = null
    writePersistedState(null)
  }

  const setAuthState = (payload) => {
    accessToken.value = payload.accessToken
    tokenType.value = payload.tokenType ?? 'Bearer'
    user.value = payload.user ?? null
    writePersistedState({
      accessToken: accessToken.value,
      tokenType: tokenType.value,
      user: user.value,
    })
  }

  const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const payload = isJson ? await response.json() : await response.text()
    if (!response.ok) {
      const message =
        typeof payload === 'string'
          ? payload || response.statusText
          : payload?.detail ?? payload?.message ?? response.statusText ?? 'Request failed'
      throw new Error(message)
    }
    return payload
  }

  const login = async ({ username, password }) => {
    if (!username || !password) throw new Error('Username and password are required')

    loginPending.value = true
    lastError.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const payload = await handleResponse(response)

      setAuthState({
        accessToken: payload.access_token,
        tokenType: payload.token_type ?? 'Bearer',
        user: {
          username,
          role: payload.role ?? null,
        },
      })

      return payload
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
      throw error
    } finally {
      loginPending.value = false
    }
  }

  const register = async ({ username, password, role }) => {
    if (!username || !password || !role) throw new Error('Username, password, and role are required')

    registerPending.value = true
    lastError.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      })

      const payload = await handleResponse(response)
      return payload
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
      throw error
    } finally {
      registerPending.value = false
    }
  }

  const logout = () => {
    resetState()
  }

  hydrate()

  return {
    // state
    accessToken,
    tokenType,
    user,
    isAuthenticated,
    loginPending,
    registerPending,
    lastError,
    // actions
    login,
    register,
    logout,
  }
})
