import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from './auth'

export const useLogsStore = defineStore('logs', () => {
  const logs = ref([])
  const tenant = ref('all')
  const sourceType = ref('all')
  const dateRange = ref(null)
  const loading = ref(false)

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
  const sourceTypeOptions = ref([])
  const tenantOptionsCache = ref({})
  const sourceTypeOptionsCache = ref({})

  const filteredLogs = computed(() => logs.value)

  const topIPs = computed(() => topIpItems.value)
  const topUsers = computed(() => topUserItems.value)
  const topSourceTypes = computed(() => topSourceTypeItems.value)
  const timelineData = computed(() => timeline.value)

  const errorCount = computed(
    () => summary.value.errors ?? 0,
  )
  const uniqueUsers = computed(
    () => summary.value.uniqueUsers ?? 0,
  )
  const uniqueIPs = computed(
    () => summary.value.uniqueIPs ?? 0,
  )

  const errorTrend = computed(() =>
    (summary.value.totalEvents ?? 0)
      ? `${((errorCount.value / summary.value.totalEvents) * 100).toFixed(1)}% error rate`
      : '0% error rate',
  )

  const userTrend = computed(() =>
    uniqueUsers.value ? `${uniqueUsers.value} active sessions` : 'No active sessions',
  )

  const recentLogs = computed(() => logs.value.slice(0, 20))

  const normalizeFilterValue = (value) => {
    if (!value) return 'all'
    const trimmed = value.toString().trim()
    return trimmed.toLowerCase() === 'all' ? 'all' : trimmed
  }

  const setTenant = (value) => {
    tenant.value = normalizeFilterValue(value)
  }

  const setSourceType = (value) => {
    sourceType.value = normalizeFilterValue(value)
  }

  const setDateRange = (value) => {
    dateRange.value = value
  }

  const resetFilters = () => {
    tenant.value = 'all'
    sourceType.value = 'all'
    dateRange.value = null
  }

  const fetchLogs = async () => {
    loading.value = true
    const authStore = useAuthStore()
    try {
      const params = new URLSearchParams()
      // Always send tenant parameter (default to 'all')
      params.set('tenant', tenant.value || 'all')
      if (sourceType.value && sourceType.value !== 'all') params.set('source', sourceType.value)
      const [start, end] = dateRange.value ?? []
      if (start) params.set('start', new Date(start).toISOString())
      if (end) params.set('end', new Date(end).toISOString())

      const endpoint = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/dashboard`
      const headers = new Headers()
      headers.set('Accept', 'application/json')
      headers.set('Content-Type', 'application/json')
      
      if (authStore?.accessToken) {
        const token = authStore.accessToken
        // Capitalize token type (backend expects "Bearer" not "bearer")
        const scheme = authStore.tokenType 
          ? authStore.tokenType.charAt(0).toUpperCase() + authStore.tokenType.slice(1).toLowerCase()
          : 'Bearer'
        headers.set('Authorization', `${scheme} ${token}`)
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers,
      })
      if (!response.ok) throw new Error(`Failed to load logs: ${response.status}`)
      const payload = await response.json()

      console.log('DEBUG: Full API payload:', payload)

      summary.value = {
        totalEvents: payload.summary?.total_events ?? 0,
        uniqueUsers: payload.summary?.unique_users ?? 0,
        uniqueIPs: payload.summary?.unique_ips ?? 0,
        errors: payload.summary?.errors ?? 0,
      }

      console.log('DEBUG: Processed summary:', summary.value)

      timeline.value = (payload.timeline ?? []).map((entry) => {
        const bucketDate = entry.bucket ? new Date(entry.bucket) : null
        const label = bucketDate
          ? bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : entry.bucket ?? ''
        return {
          time: label,
          count: entry.count ?? 0,
        }
      })

      console.log('DEBUG: Processed timeline:', timeline.value)

      const mapTopItems = (list) =>
        (list ?? [])
          .filter(Boolean)
          .map((item) => ({
            name: item.label ?? item.name ?? 'Unknown',
            count: item.count ?? 0,
          }))

      topIpItems.value = mapTopItems(payload.top?.ip_addresses)
      console.log('DEBUG: Top IP items:', topIpItems.value)

      topUserItems.value = mapTopItems(payload.top?.users)
      console.log('DEBUG: Top user items:', topUserItems.value)

      topSourceTypeItems.value = mapTopItems(payload.top?.event_types)
      console.log('DEBUG: Top source type items:', topSourceTypeItems.value)

      logs.value = (payload.logs ?? []).map((item, idx) => {
        const destinationIp =
          item.dst_ip ??
          item.destination_ip ??
          item.dest_ip ??
          item.destinationIp ??
          item.target_ip ??
          'N/A'

        const sourceIp = item.src_ip ?? item.ip ?? 'N/A'

        // Handle severity - can be number or string
        let severity = 'info'
        if (item.severity !== null && item.severity !== undefined) {
          severity = typeof item.severity === 'number' 
            ? item.severity.toString() 
            : item.severity.toString().toLowerCase()
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

      console.log('DEBUG: Processed logs (count):', logs.value.length)
      console.log('DEBUG: First log:', logs.value[0])
      console.log('DEBUG: Last log:', logs.value[logs.value.length - 1])

      // Extract tenant options from backend
      const backendTenants = payload.tenants ?? []
      tenantOptions.value = backendTenants.length > 0 ? backendTenants : []
      
      // Fixed source type options
      sourceTypeOptions.value = ['firewall', 'network', 'api', 'crowdstrike', 'aws', 'm365', 'ad']
      
      console.log('DEBUG: Tenant options:', tenantOptions.value)
      console.log('DEBUG: Source type options:', sourceTypeOptions.value)
    } catch (error) {
      console.error('Error fetching logs', error)
    } finally {
      loading.value = false
    }
  }

  watch([tenant, sourceType, dateRange], fetchLogs, { immediate: true })

  return {
    logs,
    tenant,
    sourceType,
    dateRange,
    summary,
    filteredLogs,
    topIPs,
    topUsers,
    topSourceTypes,
    timelineData,
    tenantOptions,
    sourceTypeOptions,
    errorCount,
    uniqueUsers,
    uniqueIPs,
    errorTrend,
    userTrend,
    recentLogs,
    setTenant,
    setSourceType,
    setDateRange,
    resetFilters,
    loading,
    fetchLogs,
  }
})
