import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest, get } from '@/api/client'
import { API_CONFIG, buildEndpoint, buildURL } from '@/config/api'
import { logger } from '@/utils/logger'

export const LOG_RETENTION_DAYS = 7
export const ALERT_RETENTION_DAYS = 30

export const useRetentionStore = defineStore('retention', () => {
  const logsStorage = ref(null)
  const alertsStorage = ref(null)
  const storageLoading = ref(false)
  const storageError = ref(null)

  const cleanupLoading = ref(false)
  const cleanupMessage = ref(null)
  const cleanupError = ref(null)

  const hasStorageData = computed(() => logsStorage.value !== null || alertsStorage.value !== null)

  const fetchStorage = async () => {
    storageLoading.value = true
    storageError.value = null

    try {
      const { retention } = API_CONFIG.endpoints

      const [logsResponse, alertsResponse] = await Promise.all([
        get(buildEndpoint(retention.logsStorage)),
        get(buildEndpoint(retention.alertsStorage)),
      ])

      logsStorage.value = logsResponse?.total_storage ?? null
      alertsStorage.value = alertsResponse?.total_storage ?? null

      logger.debug('Retention storage fetched', {
        logsStorage: logsStorage.value,
        alertsStorage: alertsStorage.value,
      })
    } catch (error) {
      storageError.value = error instanceof Error ? error.message : 'Unable to load storage metrics'
      logsStorage.value = null
      alertsStorage.value = null
      logger.error('Failed to fetch retention storage', error)
    } finally {
      storageLoading.value = false
    }
  }

  const triggerCleanup = async (days) => {
    cleanupLoading.value = true
    cleanupError.value = null
    cleanupMessage.value = null

    try {
  const { retention } = API_CONFIG.endpoints
      const query = Number.isFinite(days) && days > 0 ? { days } : {}
  const url = buildURL(retention.deleteOldData, query)

      const response = await apiRequest(url, { method: 'POST' })

      cleanupMessage.value = response?.message ?? 'Cleanup completed successfully.'
      logger.debug('Retention cleanup triggered', { days, message: cleanupMessage.value })

      await fetchStorage()
    } catch (error) {
      cleanupError.value = error instanceof Error ? error.message : 'Cleanup request failed'
      logger.error('Retention cleanup failed', error)
    } finally {
      cleanupLoading.value = false
    }
  }

  return {
    logsStorage,
    alertsStorage,
    storageLoading,
    storageError,
    cleanupLoading,
    cleanupMessage,
    cleanupError,
    hasStorageData,
    fetchStorage,
    triggerCleanup,
    LOG_RETENTION_DAYS,
    ALERT_RETENTION_DAYS,
  }
})
