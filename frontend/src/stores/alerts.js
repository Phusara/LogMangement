import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const AUTO_REFRESH_MS = 10_000
const SEARCH_DEBOUNCE_MS = 350

const normalizeAlert = (item, index, activePage) => {
  const severity = (item.severity ?? item.log?.severity ?? item.level ?? 'info').toString().toLowerCase()
  const category = item.category ?? item.type ?? item.alert_type ?? item.log?.event_type ?? 'general'
  const ipAddress =
    item.ip_address ??
    item.ip ??
    item.source_ip ??
    item.src_ip ??
    item.log?.src_ip ??
    'N/A'

  const occurredAtRaw =
    item.occurred_at ??
    item.created_at ??
    item.timestamp ??
    item.time ??
    item.detected_at ??
    item.log?.timestamp ??
    null

  let occurredAt = null
  if (occurredAtRaw) {
    const parsed = new Date(occurredAtRaw)
    occurredAt = Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return {
    id: item.alert_id ?? item.id ?? `${activePage}-${index}`,
    category,
    message: item.alert ?? item.message ?? item.description ?? item.details ?? 'No message provided',
    ipAddress,
    tenant: item.tenant ?? item.account ?? item.customer ?? null,
    severity,
    occurredAt,
    occurredAtRaw,
    tags: item.tags ?? item.log?.tags ?? [],
    log: item.log ?? null,
    raw: item,
  }
}

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref([])
  const totalAlerts = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const searchTerm = ref('')
  const sortKey = ref('created_at')
  const sortDirection = ref('desc')
  const loading = ref(false)
  const error = ref(null)
  const lastFetchedAt = ref(null)
  const isFetching = ref(false)
  const currentUser = ref(null)
  const currentRole = ref(null)

  let searchTimer = null
  let refreshTimer = null

  const pageCount = computed(() => {
    if (!totalAlerts.value) return 1
    return Math.max(1, Math.ceil(totalAlerts.value / pageSize.value))
  })

  const pageStartIndex = computed(() => {
    if (!totalAlerts.value) return 0
    return (page.value - 1) * pageSize.value + 1
  })

  const pageEndIndex = computed(() => {
    if (!totalAlerts.value) return 0
    return Math.min(page.value * pageSize.value, totalAlerts.value)
  })

  const authStore = useAuthStore()

  const buildHeaders = () => {
    const headers = new Headers()
    headers.set('Accept', 'application/json')
    headers.set('Content-Type', 'application/json')
    
    if (authStore?.accessToken) {
      const token = typeof authStore.accessToken === 'object' && authStore.accessToken.value 
        ? authStore.accessToken.value 
        : authStore.accessToken
      headers.set('Authorization', `Bearer ${token}`)
    }
    
    return headers
  }

  const fetchAlerts = async ({ silent = false } = {}) => {
    if (isFetching.value) return
    isFetching.value = true

    if (!silent) {
      loading.value = true
      error.value = null
    }

    try {
      const params = new URLSearchParams()
      params.set('page', String(page.value))
      params.set('per_page', String(pageSize.value))
      
      if (searchTerm.value.trim()) {
        params.set('search', searchTerm.value.trim())
      }
      
      if (sortKey.value) {
        params.set('sort', sortKey.value)
        params.set('order', sortDirection.value)
      }

      const response = await fetch(`${API_BASE_URL}/alerts?${params.toString()}`, {
        headers: buildHeaders(),
      })

      const contentType = response.headers.get('content-type') ?? ''
      const isJson = contentType.includes('application/json')
      const payload = isJson ? await response.json() : await response.text()

      if (!response.ok) {
        const message = typeof payload === 'string' 
          ? payload 
          : payload?.detail ?? payload?.message ?? `Failed to fetch alerts (${response.status})`
        throw new Error(message)
      }

      // Extract alerts array from response
      const rawItems = payload?.alerts ?? payload?.data ?? payload?.items ?? []
      
      // Store user info from response
      currentUser.value = payload?.user ?? null
      currentRole.value = payload?.role ?? null
      
      // Get total count
      totalAlerts.value = payload?.total_alerts ?? payload?.total ?? rawItems.length

      // Normalize each alert
      const normalized = rawItems.map((item, idx) => normalizeAlert(item, idx, page.value))

      alerts.value = normalized
      lastFetchedAt.value = new Date()

    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      alerts.value = []
      totalAlerts.value = 0
    } finally {
      loading.value = false
      isFetching.value = false
    }
  }

  const setPage = (value) => {
    const numeric = Number(value)
    const target = Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : 1
    if (target === page.value) return
    page.value = target
    fetchAlerts()
  }

  const nextPage = () => {
    if (page.value >= pageCount.value) return
    page.value += 1
    fetchAlerts()
  }

  const previousPage = () => {
    if (page.value <= 1) return
    page.value -= 1
    fetchAlerts()
  }

  const goToFirstPage = () => {
    if (page.value === 1) return
    page.value = 1
    fetchAlerts()
  }

  const goToLastPage = () => {
    if (page.value === pageCount.value) return
    page.value = pageCount.value
    fetchAlerts()
  }

  const setPageSize = (value) => {
    const numeric = Number(value)
    const size = Number.isFinite(numeric) ? numeric : 10
    if (size === pageSize.value) return
    pageSize.value = size
    page.value = 1
    fetchAlerts()
  }

  const setSort = (key) => {
    if (!key) return
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDirection.value = 'desc'
    }
    fetchAlerts()
  }

  const setSearch = (value) => {
    searchTerm.value = value
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      page.value = 1
      fetchAlerts()
    }, SEARCH_DEBOUNCE_MS)
  }

  const startAutoRefresh = () => {
    if (refreshTimer) return
    refreshTimer = setInterval(() => {
      fetchAlerts({ silent: true })
    }, AUTO_REFRESH_MS)
  }

  const stopAutoRefresh = () => {
    if (!refreshTimer) return
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  const manualRefresh = () => fetchAlerts()

  const autoRefreshInterval = computed(() => AUTO_REFRESH_MS)

  return {
    // state
    alerts,
    totalAlerts,
    page,
    pageSize,
    searchTerm,
    sortKey,
    sortDirection,
    pageCount,
    pageStartIndex,
    pageEndIndex,
    loading,
    error,
    lastFetchedAt,
    autoRefreshInterval,
    currentUser,
    currentRole,
    // actions
    fetchAlerts,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setSort,
    setSearch,
    startAutoRefresh,
    stopAutoRefresh,
    manualRefresh,
  }
})
