import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get } from '@/api/client'
import { buildURL } from '@/config/api'
import { logger } from '@/utils/logger'
import { useDebounceFn } from '@/composables/useDebounce'

const AUTO_REFRESH_MS = 10_000
const SEARCH_DEBOUNCE_MS = 350

/**
 * Normalize alert data from API response
 * @param {Object} item - Alert item
 * @param {number} index - Item index
 * @param {number} activePage - Current page number
 * @returns {Object} Normalized alert
 */
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
  // State
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

  let refreshTimer = null

  // Computed
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

  const autoRefreshInterval = computed(() => AUTO_REFRESH_MS)

  /**
   * Fetch alerts from API
   * @param {Object} options - Fetch options
   * @param {boolean} options.silent - Silent mode (no loading state)
   */
  const fetchAlerts = async ({ silent = false } = {}) => {
    if (isFetching.value) return
    isFetching.value = true

    if (!silent) {
      loading.value = true
      error.value = null
    }

    try {
      // Build query parameters
      const params = {
        page: String(page.value),
        per_page: String(pageSize.value),
      }
      
      if (searchTerm.value.trim()) {
        params.search = searchTerm.value.trim()
      }
      
      if (sortKey.value) {
        params.sort = sortKey.value
        params.order = sortDirection.value
      }

      // Make API request
      const payload = await get(buildURL('/alerts', params))

      // Extract alerts array from response
      const rawItems = payload?.alerts ?? payload?.data ?? payload?.items ?? []
      
      // Store user info from response
      currentUser.value = payload?.user ?? null
      currentRole.value = payload?.role ?? null
      
      // Get total count
      totalAlerts.value = payload?.total_alerts ?? payload?.total ?? rawItems.length

      // Normalize each alert
      alerts.value = rawItems.map((item, idx) => normalizeAlert(item, idx, page.value))
      
      lastFetchedAt.value = new Date()
      
      logger.debug('Alerts fetched', { 
        count: alerts.value.length,
        total: totalAlerts.value 
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      logger.error('Failed to fetch alerts', err)
      
      alerts.value = []
      totalAlerts.value = 0
    } finally {
      loading.value = false
      isFetching.value = false
    }
  }

  /**
   * Set current page
   * @param {number} value - Page number
   */
  const setPage = (value) => {
    const numeric = Number(value)
    const target = Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : 1
    if (target === page.value) return
    page.value = target
    fetchAlerts()
  }

  /**
   * Navigate to next page
   */
  const nextPage = () => {
    if (page.value >= pageCount.value) return
    page.value += 1
    fetchAlerts()
  }

  /**
   * Navigate to previous page
   */
  const previousPage = () => {
    if (page.value <= 1) return
    page.value -= 1
    fetchAlerts()
  }

  /**
   * Navigate to first page
   */
  const goToFirstPage = () => {
    if (page.value === 1) return
    page.value = 1
    fetchAlerts()
  }

  /**
   * Navigate to last page
   */
  const goToLastPage = () => {
    if (page.value === pageCount.value) return
    page.value = pageCount.value
    fetchAlerts()
  }

  /**
   * Set page size
   * @param {number} value - Items per page
   */
  const setPageSize = (value) => {
    const numeric = Number(value)
    const size = Number.isFinite(numeric) ? numeric : 10
    if (size === pageSize.value) return
    pageSize.value = size
    page.value = 1
    fetchAlerts()
  }

  /**
   * Set sort column and direction
   * @param {string} key - Column key
   */
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

  // Debounced search handler
  const debouncedSearch = useDebounceFn(() => {
    page.value = 1
    fetchAlerts()
  }, SEARCH_DEBOUNCE_MS)

  /**
   * Set search term
   * @param {string} value - Search query
   */
  const setSearch = (value) => {
    searchTerm.value = value
    debouncedSearch()
  }

  /**
   * Start auto-refresh timer
   */
  const startAutoRefresh = () => {
    if (refreshTimer) return
    refreshTimer = setInterval(() => {
      fetchAlerts({ silent: true })
    }, AUTO_REFRESH_MS)
  }

  /**
   * Stop auto-refresh timer
   */
  const stopAutoRefresh = () => {
    if (!refreshTimer) return
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  /**
   * Manual refresh
   */
  const manualRefresh = () => fetchAlerts()

  return {
    // State
    alerts,
    totalAlerts,
    page,
    pageSize,
    searchTerm,
    sortKey,
    sortDirection,
    loading,
    error,
    lastFetchedAt,
    currentUser,
    currentRole,
    // Computed
    pageCount,
    pageStartIndex,
    pageEndIndex,
    autoRefreshInterval,
    // Actions
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
