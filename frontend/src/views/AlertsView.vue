<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  BellRing,
  Search,
  RefreshCw,
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Clock,
} from 'lucide-vue-next'

import AppShell from '@/components/layout/AppShell.vue'
import { useAlertsStore } from '@/stores/alerts'

const alertsStore = useAlertsStore()

const {
  alerts,
  totalAlerts,
  page,
  pageSize,
  pageCount,
  pageStartIndex,
  pageEndIndex,
  loading,
  error,
  lastFetchedAt,
  searchTerm,
  autoRefreshInterval,
} = storeToRefs(alertsStore)

const {
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
} = alertsStore

const formattedLastUpdated = computed(() => {
  if (!lastFetchedAt.value) return 'Never'
  return lastFetchedAt.value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const showingLabel = computed(() => {
  if (!totalAlerts.value) return 'No alerts to display'
  return `Showing ${pageStartIndex.value} – ${pageEndIndex.value} of ${totalAlerts.value} alerts`
})

const autoRefreshSeconds = computed(() => Math.round(autoRefreshInterval.value / 1000))

const isFirstPage = computed(() => page.value <= 1)
const isLastPage = computed(() => page.value >= pageCount.value)

const severityStyles = {
  critical: 'bg-rose-500/15 text-rose-200 border border-rose-500/40',
  high: 'bg-orange-500/15 text-orange-200 border border-orange-500/40',
  medium: 'bg-amber-500/15 text-amber-200 border border-amber-500/40',
  low: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
  info: 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40',
}

const severityBadgeClass = (severity) => severityStyles[severity] ?? severityStyles.info

const formatTimestamp = (alert) => {
  if (alert.occurredAt instanceof Date && !Number.isNaN(alert.occurredAt.getTime())) {
    return alert.occurredAt.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (alert.occurredAtRaw) {
    const parsed = new Date(alert.occurredAtRaw)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return alert.occurredAtRaw
  }
  return 'Unknown'
}

const handlePageSizeChange = (event) => {
  setPageSize(Number(event.target.value))
}

const handleSearchInput = (event) => {
  setSearch(event.target.value)
}

const handlePageInput = (event) => {
  const value = Number(event.target.value)
  if (!Number.isNaN(value)) setPage(value)
}

onMounted(() => {
  fetchAlerts()
  startAutoRefresh()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<template>
  <AppShell>
    <header class="space-y-1">
      <p class="text-sm uppercase tracking-widest text-cyan-400">LogMonitor</p>
      <h1 class="text-3xl font-bold text-slate-100">Alert Center</h1>
      <p class="text-slate-400">Track automated notifications and triage emerging incidents in real time.</p>
    </header>

    <section class="space-y-6">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <BellRing class="h-6 w-6" />
            </div>
            <div class="space-y-1">
              <p class="text-lg font-semibold text-slate-100">Automated alerting enabled</p>
              <p class="text-sm text-slate-400">
                Alerts refresh every {{ autoRefreshSeconds }}s. Last synced at
                <span class="font-medium text-slate-200">{{ formattedLastUpdated }}</span>.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2">
              <Clock class="h-4 w-4 text-cyan-300" />
              <span class="text-slate-200">{{ formattedLastUpdated }}</span>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2">
              <span class="text-slate-200">Total alerts:</span>
              <span class="font-semibold text-cyan-300">{{ totalAlerts }}</span>
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/20"
              @click="manualRefresh"
            >
              <RefreshCw class="h-4 w-4" />
              Refresh now
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div class="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative flex w-full items-center lg:max-w-sm">
            <Search class="pointer-events-none absolute left-4 h-4 w-4 text-slate-500" />
            <input
              :value="searchTerm"
              type="search"
              placeholder="Search alerts..."
              class="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              @input="handleSearchInput"
            >
          </div>
          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span class="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1">
              Auto-refresh {{ autoRefreshSeconds }}s
            </span>
            <span class="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1">
              Page {{ page }} of {{ pageCount }}
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
            <thead class="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th scope="col" class="px-6 py-4">
                  <button type="button" class="flex items-center gap-2" @click="setSort('category')">
                    Category
                  </button>
                </th>
                <th scope="col" class="px-6 py-4">
                  <button type="button" class="flex items-center gap-2" @click="setSort('message')">
                    Message
                  </button>
                </th>
                <th scope="col" class="px-6 py-4">
                  <button type="button" class="flex items-center gap-2" @click="setSort('ip_address')">
                    IP Address
                  </button>
                </th>
                <th scope="col" class="px-6 py-4">Tenant</th>
                <th scope="col" class="px-6 py-4">
                  <button type="button" class="flex items-center gap-2" @click="setSort('created_at')">
                    Timestamp
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-if="loading" class="bg-slate-900/40">
                <td colspan="5" class="px-6 py-12">
                  <div class="flex items-center justify-center gap-3 text-sm text-slate-400">
                    <Loader2 class="h-5 w-5 animate-spin text-cyan-300" />
                    Loading alerts…
                  </div>
                </td>
              </tr>
              <tr v-else-if="error" class="bg-rose-950/40">
                <td colspan="5" class="px-6 py-12 text-center text-sm text-rose-300">
                  {{ error }}
                </td>
              </tr>
              <tr v-else-if="!alerts.length">
                <td colspan="5" class="px-6 py-12 text-center text-sm text-slate-500">
                  No alerts match the current filters.
                </td>
              </tr>
              <tr
                v-for="alert in alerts"
                v-else
                :key="alert.id"
                class="transition-colors hover:bg-slate-800/40"
              >
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-2">
                    <span :class="['rounded-full px-3 py-1 text-xs font-semibold capitalize', severityBadgeClass(alert.severity)]">
                      {{ alert.category }}
                    </span>
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-300">
                  {{ alert.message }}
                </td>
                <td class="px-6 py-4 font-mono text-xs text-slate-300">{{ alert.ipAddress }}</td>
                <td class="px-6 py-4 text-slate-400">{{ alert.tenant ?? '—' }}</td>
                <td class="px-6 py-4 text-slate-300">{{ formatTimestamp(alert) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-4 border-t border-slate-800 px-6 py-5 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <p>{{ showingLabel }}</p>
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isFirstPage"
                @click="goToFirstPage"
              >
                <ChevronsLeft class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isFirstPage"
                @click="previousPage"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <input
                :value="page"
                type="number"
                min="1"
                :max="pageCount"
                class="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-center text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
                @change="handlePageInput"
              >
              <span class="px-1 text-xs text-slate-500">of {{ pageCount }}</span>
              <button
                type="button"
                class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isLastPage"
                @click="nextPage"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isLastPage"
                @click="goToLastPage"
              >
                <ChevronsRight class="h-4 w-4" />
              </button>
            </div>

            <label class="flex items-center gap-2 text-xs text-slate-400">
              <span>Rows per page</span>
              <select
                :value="pageSize"
                class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
                @change="handlePageSizeChange"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
