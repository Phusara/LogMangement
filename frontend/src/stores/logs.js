import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { get } from '@/api/client'
import { buildURL } from '@/config/api'
import { logger } from '@/utils/logger'
import { useDebounceFn } from '@/composables/useDebounce'

const AUTO_REFRESH_MS = 15_000

/**
 * Normalize filter value
 * @param {any} value - Filter value
 * @returns {string}
 */
const normalizeFilterValue = (value) => {
  if (!value) return 'all'
  const trimmed = value.toString().trim()
  return trimmed.toLowerCase() === 'all' ? 'all' : trimmed
}

export const useLogsStore = defineStore('logs', () => {
  // State
  const logs = ref([])
  const tenant = ref('all')
  const sourceType = ref('all')
  const dateRange = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastFetchedAt = ref(null)
  const isFetching = ref(false)

  const page = ref(1)
  const pageSize = ref(20)

  const summary = ref({
    totalEvents: 0,
    uniqueUsers: 0,
    uniqueIPs: 0,
    errors: 0,
  })
  
  const timeline = ref([])
  const topIpItems = ref([])
  const topUserItems = ref([])
  const topSourceTypeItems = ref([])
  const tenantOptions = ref([])
  const sourceTypeOptions = ref([
    'firewall', 
    'network', 
    'api', 
    'crowdstrike', 
    'aws', 
    'm365', 
    'ad'
  ])

  // Computed
  const filteredLogs = computed(() => logs.value)
  const totalLogCount = computed(() => filteredLogs.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(totalLogCount.value / pageSize.value)))
  const pageStartIndex = computed(() => (totalLogCount.value ? (page.value - 1) * pageSize.value + 1 : 0))
  const pageEndIndex = computed(() => (totalLogCount.value ? Math.min(page.value * pageSize.value, totalLogCount.value) : 0))
  const paginatedLogs = computed(() => {
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredLogs.value.slice(start, end)
  })
  const topIPs = computed(() => topIpItems.value)
  const topUsers = computed(() => topUserItems.value)
  const topSourceTypes = computed(() => topSourceTypeItems.value)
  const timelineData = computed(() => timeline.value)

  const errorCount = computed(() => summary.value.errors ?? 0)
  const uniqueUsers = computed(() => summary.value.uniqueUsers ?? 0)
  const uniqueIPs = computed(() => summary.value.uniqueIPs ?? 0)

  const errorTrend = computed(() =>
    (summary.value.totalEvents ?? 0)
      ? `${((errorCount.value / summary.value.totalEvents) * 100).toFixed(1)}% error rate`
      : '0% error rate',
  )

  const userTrend = computed(() =>
    uniqueUsers.value ? `${uniqueUsers.value} active sessions` : 'No active sessions',
  )

  const logPagination = computed(() => logs.value.slice(0, pageSize.value))
  const recentLogs = computed(() => logs.value)
  const autoRefreshInterval = computed(() => AUTO_REFRESH_MS)

  /**
   * Set tenant filter
   * @param {string} value - Tenant value
   */
  const setTenant = (value) => {
    tenant.value = normalizeFilterValue(value)
  }

  /**
   * Set source type filter
   * @param {string} value - Source type value
   */
  const setSourceType = (value) => {
    sourceType.value = normalizeFilterValue(value)
  }

  /**
   * Set date range filter
   * @param {Array|null} value - Date range [start, end]
   */
  const setDateRange = (value) => {
    dateRange.value = value
  }

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    tenant.value = 'all'
    sourceType.value = 'all'
    dateRange.value = null
  }

  /**
   * Map top items from API response
   * @param {Array} list - List of items
   * @returns {Array}
   */
  const mapTopItems = (list) =>
    (list ?? [])
      .filter(Boolean)
      .map((item) => ({
        name: item.label ?? item.name ?? 'Unknown',
        count: item.count ?? 0,
      }))

  /**
   * Fetch logs from API
   * @param {Object} options - Fetch options
   * @param {boolean} options.silent - Silent mode (no loading state)
   */
  const fetchLogs = async ({ silent = false } = {}) => {
    if (isFetching.value) return
    isFetching.value = true

    if (!silent) {
      loading.value = true
    }

    error.value = null
    
    try {
      // Build query parameters
      const params = {
        tenant: tenant.value || 'all',
      }
      
      if (sourceType.value && sourceType.value !== 'all') {
        params.source = sourceType.value
      }
      
      const [start, end] = dateRange.value ?? []
      if (start) params.start = new Date(start).toISOString()
      if (end) params.end = new Date(end).toISOString()

      // Make API request
      const payload = await get(buildURL('/dashboard', params))

      // Process summary
      summary.value = {
        totalEvents: payload.summary?.total_events ?? 0,
        uniqueUsers: payload.summary?.unique_users ?? 0,
        uniqueIPs: payload.summary?.unique_ips ?? 0,
        errors: payload.summary?.errors ?? 0,
      }

      logger.debug('Dashboard summary loaded', summary.value)

      // Process timeline
      // Render timeline labels in UTC so dashboard shows server timestamps unchanged
      timeline.value = (payload.timeline ?? []).map((entry) => {
        const bucketDate = entry.bucket ? new Date(entry.bucket) : null
        const label = bucketDate
          ? bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
          : entry.bucket ?? ''
        return {
          time: label,
          count: entry.count ?? 0,
        }
      })

      // Process top items
      topIpItems.value = mapTopItems(payload.top?.ip_addresses)
      topUserItems.value = mapTopItems(payload.top?.users)
      topSourceTypeItems.value = mapTopItems(payload.top?.event_types)

      // Process logs
      logs.value = (payload.logs ?? []).map((item, idx) => {
        const destinationIp =
          item.dst_ip ??
          item.destination_ip ??
          item.dest_ip ??
          item.destinationIp ??
          item.target_ip ??
          'N/A'

        const sourceIp = item.src_ip ?? item.ip ?? 'N/A'

        // Handle severity - normalize to numeric (fallback 0)
        let severity = 0
        if (item.severity !== null && item.severity !== undefined) {
          if (typeof item.severity === 'number') {
            severity = item.severity
          } else {
            // try to coerce string-like severities ("8" -> 8)
            const parsed = Number(item.severity)
            severity = Number.isFinite(parsed) ? parsed : 0
          }
        }

        return {
          id: item.id ?? idx,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          severity,
          user: item.user ?? 'N/A',
          ip: sourceIp,
          destinationIp,
          sourceType: item.source ?? 'Unknown',
          tenant: item.tenant ?? 'Unknown',
          host: item.host ?? 'N/A',
          message: item.action ?? item.event_type ?? 'No details provided',
          raw: item.raw ?? item,
        }
      })

      // Extract tenant options from backend
      const backendTenants = payload.tenants ?? []
      tenantOptions.value = backendTenants.length > 0 ? backendTenants : []
      
      logger.debug('Logs fetched', { 
        count: logs.value.length,
        tenantOptions: tenantOptions.value.length 
      })

      lastFetchedAt.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load logs'
      logger.error('Error fetching logs', err)
      
      // Reset data on error
      logs.value = []
      summary.value = { totalEvents: 0, uniqueUsers: 0, uniqueIPs: 0, errors: 0 }
      timeline.value = []
      topIpItems.value = []
      topUserItems.value = []
      topSourceTypeItems.value = []
    } finally {
      if (!silent) {
        loading.value = false
      }
      isFetching.value = false
    }
  }

  // Debounced fetch with 300ms delay
  const debouncedFetch = useDebounceFn(fetchLogs, 300)

  // Watch filters and fetch on change
  watch([tenant, sourceType, dateRange], () => {
    page.value = 1
    debouncedFetch()
  }, { immediate: true })

  watch([logs, pageSize], () => {
    const maxPage = pageCount.value
    if (page.value > maxPage) {
      page.value = maxPage
    }
  })

  const setPage = (value) => {
    const numeric = Number(value)
    const target = Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : 1
    page.value = target
  }

  const setPageSize = (value) => {
    const numeric = Number(value)
    const nextSize = Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : 20
    if (nextSize === pageSize.value) return
    pageSize.value = nextSize
    page.value = 1
  }

  const nextPage = () => {
    if (page.value >= pageCount.value) return
    page.value += 1
  }

  const previousPage = () => {
    if (page.value <= 1) return
    page.value -= 1
  }

  const goToFirstPage = () => {
    if (page.value === 1) return
    page.value = 1
  }

  const goToLastPage = () => {
    if (page.value === pageCount.value) return
    page.value = pageCount.value
  }

  let refreshTimer = null
  let refreshSubscribers = 0

  const startAutoRefresh = () => {
    refreshSubscribers += 1
    if (refreshSubscribers > 1) return

    fetchLogs({ silent: true }).catch(() => {})
    refreshTimer = setInterval(() => {
      fetchLogs({ silent: true }).catch(() => {})
    }, AUTO_REFRESH_MS)
  }

  const stopAutoRefresh = () => {
    if (refreshSubscribers === 0) return
    refreshSubscribers -= 1
    if (refreshSubscribers === 0 && refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  const manualRefresh = () => fetchLogs()

  return {
    // State
    logs,
    tenant,
    sourceType,
    dateRange,
    loading,
    error,
    summary,
    tenantOptions,
    sourceTypeOptions,
    page,
    pageSize,
    lastFetchedAt,
    // Computed
    filteredLogs,
    paginatedLogs,
    totalLogCount,
    pageCount,
    pageStartIndex,
    pageEndIndex,
    topIPs,
    topUsers,
    topSourceTypes,
    timelineData,
    errorCount,
    uniqueUsers,
    uniqueIPs,
    errorTrend,
    userTrend,
    recentLogs,
    autoRefreshInterval,
    logPagination,
    // Actions
    setTenant,
    setSourceType,
    setDateRange,
    resetFilters,
    fetchLogs,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    startAutoRefresh,
    stopAutoRefresh,
    manualRefresh,
  }
})
