<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Database, Clock, Trash2, BellRing, RefreshCw } from 'lucide-vue-next'

import AppShell from '@/components/layout/AppShell.vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import { useLogsStore } from '@/stores/logs'
import { useAlertsStore } from '@/stores/alerts'
import { useRetentionStore, LOG_RETENTION_DAYS, ALERT_RETENTION_DAYS } from '@/stores/retention'
import { useAuthStore } from '@/stores/auth'

const logsStore = useLogsStore()
const alertsStore = useAlertsStore()
const retentionStore = useRetentionStore()
const authStore = useAuthStore()
const { manualRefresh: refreshStorage } = retentionStore

const { summary, recentLogs } = storeToRefs(logsStore)
const { totalAlerts } = storeToRefs(alertsStore)
const {
  logsStorage,
  alertsStorage,
  storageLoading,
  storageError,
  cleanupLoading,
  cleanupMessage,
  cleanupError,
  hasStorageData,
  lastFetchedAt,
  autoRefreshInterval,
} = storeToRefs(retentionStore)
const { user } = storeToRefs(authStore)

const cleanupDays = ref(LOG_RETENTION_DAYS)

const recentLogCount = computed(() => recentLogs.value.length)
const totalLogCount = computed(() => summary.value.totalEvents ?? 0)
const oldLogCount = computed(() => Math.max(totalLogCount.value - recentLogCount.value, 0))
const mergedCleanupMessage = computed(() => cleanupError.value ?? cleanupMessage.value)
const isCleanupError = computed(() => Boolean(cleanupError.value))
const canManageCleanup = computed(() => (user.value?.role ?? '').toString().toLowerCase() === 'admin')
const autoRefreshSeconds = computed(() => Math.round(autoRefreshInterval.value / 1000))
const storageLastUpdated = computed(() => {
  if (!lastFetchedAt.value) return 'Never'
  return lastFetchedAt.value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const handleCleanup = async () => {
  const parsed = Number.parseInt(cleanupDays.value, 10)
  const normalizedDays = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  await retentionStore.triggerCleanup(normalizedDays)
}

onMounted(() => {
  retentionStore.fetchStorage().catch(() => {})
  retentionStore.startAutoRefresh()

  logsStore.startAutoRefresh()
  if (!totalLogCount.value) {
    logsStore.fetchLogs({ silent: true }).catch(() => {})
  }

  alertsStore.startAutoRefresh()
  if (!alertsStore.alerts.length && !totalAlerts.value) {
    alertsStore.fetchAlerts({ silent: true }).catch(() => {})
  }
})

onBeforeUnmount(() => {
  logsStore.stopAutoRefresh()
  alertsStore.stopAutoRefresh()
  retentionStore.stopAutoRefresh()
})
</script>

<template>
  <AppShell>
    <header class="space-y-1">
      <p class="text-sm uppercase tracking-widest text-cyan-400">System Policies</p>
      <h1 class="text-3xl font-bold text-slate-100">Data Retention Controls</h1>
      <p class="text-slate-400">
        Review storage usage and manually trigger cleanup for stale log and alert data.
      </p>
    </header>

    <section class="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-sm text-slate-300">
      <div class="flex flex-wrap items-center gap-6">
        <div>
          <p class="text-xs uppercase tracking-wide text-cyan-300">Logs Retention</p>
          <p class="text-lg font-semibold text-slate-100">{{ LOG_RETENTION_DAYS }} days</p>
        </div>
        <div class="hidden h-10 w-px bg-cyan-500/30 sm:block" aria-hidden="true" />
        <div>
          <p class="text-xs uppercase tracking-wide text-cyan-300">Alerts Retention</p>
          <p class="text-lg font-semibold text-slate-100">{{ ALERT_RETENTION_DAYS }} days</p>
        </div>
        <div class="hidden h-10 w-px bg-cyan-500/30 sm:block" aria-hidden="true" />
        <p class="max-w-xl text-xs text-slate-400">
          The platform enforces automatic cleanup using the schedules above. Use the manual cleanup
          controls below to accelerate deletion of stale records when needed.
        </p>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Logs"
        :value="totalLogCount"
        :icon="Database"
        trend="Indexed events tracked"
      />
      <StatsCard
        title="Recent Logs"
        :value="recentLogCount"
        :icon="Clock"
        :trend="`Most recent ${LOG_RETENTION_DAYS} days`"
      />
      <StatsCard
        title="Old Logs"
        :value="oldLogCount"
        :icon="Trash2"
        trend="Eligible for cleanup"
      />
      <StatsCard
        title="Total Alerts"
        :value="totalAlerts"
        :icon="BellRing"
        trend="Aggregated across tenants"
      />
    </section>

    <section class="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <header>
        <h2 class="text-lg font-semibold text-slate-100">Data Footprint</h2>
        <p class="text-sm text-slate-400">
          Track how much storage logs and alerts currently consume. Auto-refreshes every {{ autoRefreshSeconds }}s
          (last updated {{ storageLastUpdated }}).
        </p>
      </header>

      <div v-if="storageError" class="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
        {{ storageError }}
      </div>

      <div v-else-if="storageLoading && !hasStorageData" class="flex items-center gap-3 text-sm text-slate-400">
        <svg class="h-4 w-4 animate-spin text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle class="opacity-20" cx="12" cy="12" r="10" stroke-width="4" />
          <path d="M4 12a8 8 0 018-8" stroke-width="4" stroke-linecap="round" class="text-cyan-400" />
        </svg>
        Loading storage metrics...
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-slate-800">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-6 py-4 text-xs text-slate-400">
          <span>Last updated {{ storageLastUpdated }} · Auto-refresh {{ autoRefreshSeconds }}s</span>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="storageLoading"
            @click="refreshStorage()"
          >
            <RefreshCw class="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
        <table class="min-w-full divide-y divide-slate-800 text-sm">
          <thead class="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th scope="col" class="px-6 py-3 text-left font-medium">Table</th>
              <th scope="col" class="px-6 py-3 text-right font-medium">Size</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 bg-slate-900/40 text-slate-200">
            <tr>
              <td class="px-6 py-4">logs</td>
              <td class="px-6 py-4 text-right font-mono text-sm">{{ logsStorage ?? '--' }}</td>
            </tr>
            <tr>
              <td class="px-6 py-4">alerts</td>
              <td class="px-6 py-4 text-right font-mono text-sm">{{ alertsStorage ?? '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div
        v-if="canManageCleanup"
        class="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
      >
        <header>
          <h2 class="text-lg font-semibold text-slate-100">Manual Cleanup</h2>
          <p class="text-sm text-slate-400">
            Delete logs and alerts older than the specified retention window immediately.
          </p>
        </header>

        <div class="flex flex-col gap-4 md:flex-row md:items-end">
          <label class="flex-1 text-sm text-slate-300">
            <span class="mb-2 block text-xs uppercase tracking-wide text-slate-500">Retention Window (days)</span>
            <input
              v-model.number="cleanupDays"
              type="number"
              min="1"
              step="1"
              class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none"
              placeholder="e.g. 7"
            />
          </label>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="cleanupLoading"
            @click="handleCleanup"
          >
            <svg
              v-if="cleanupLoading"
              class="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4" />
              <path class="opacity-75" stroke-width="4" stroke-linecap="round" d="M4 12a8 8 0 018-8" />
            </svg>
            Trigger Cleanup
          </button>
        </div>

        <p class="text-xs text-slate-500">
          Logs older than {{ LOG_RETENTION_DAYS }} days and alerts older than {{ ALERT_RETENTION_DAYS }} days are removed
          automatically. Manual cleanup is intended for administrators who need to purge data sooner.
        </p>

        <div
          v-if="mergedCleanupMessage"
          :class="[
            'rounded-xl border px-4 py-3 text-sm',
            isCleanupError ? 'border-rose-500/40 bg-rose-500/10 text-rose-100' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
          ]"
        >
          {{ mergedCleanupMessage }}
        </div>
      </div>

      <div
        v-else
        class="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300"
      >
        <h2 class="text-lg font-semibold text-slate-100">Manual Cleanup</h2>
        <p>
          Manual cleanup tools are available to administrator accounts only. Contact an administrator if you need to
          expedite log or alert retention policies.
        </p>
      </div>

      <aside class="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-sm text-amber-100">
        <h3 class="mb-3 text-base font-semibold text-amber-50">Additional Notes</h3>
        <ul class="list-disc space-y-2 pl-5">
          <li>Automatic cleanup runs every 30 minutes.</li>
          <li>Logs older than {{ LOG_RETENTION_DAYS }} days are purged during scheduled runs.</li>
          <li>Alerts expire after {{ ALERT_RETENTION_DAYS }} days unless escalated.</li>
          <li>Manual cleanup operations are restricted to administrator roles.</li>
        </ul>
      </aside>
    </section>
  </AppShell>
</template>
