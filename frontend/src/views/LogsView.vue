<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-vue-next'

import AppShell from '@/components/layout/AppShell.vue'
import FilterPanel from '@/components/dashboard/FilterPanel.vue'
import LogsTable from '@/components/dashboard/LogsTable.vue'
import { useLogsStore } from '@/stores/logs'

const logsStore = useLogsStore()

const {
  tenant,
  sourceType,
  dateRange,
  tenantOptions,
  sourceTypeOptions,
  paginatedLogs,
  summary,
  page,
  pageSize,
  pageCount,
  pageStartIndex,
  pageEndIndex,
  totalLogCount,
  loading,
  error,
  lastFetchedAt,
  autoRefreshInterval,
} = storeToRefs(logsStore)

const {
  setTenant,
  setSourceType,
  setDateRange,
  resetFilters,
  setPage,
  setPageSize,
  nextPage,
  previousPage,
  goToFirstPage,
  goToLastPage,
  startAutoRefresh,
  stopAutoRefresh,
  manualRefresh,
} = logsStore

const filterSummary = computed(() => {
  const parts = []
  if (tenant.value && tenant.value.toLowerCase() !== 'all') parts.push(`Tenant: ${tenant.value}`)
  if (sourceType.value && sourceType.value.toLowerCase() !== 'all') parts.push(`Source: ${sourceType.value}`)
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    parts.push('Date range applied')
  }
  return parts.length ? parts.join(' · ') : 'No filters applied'
})

const showingLabel = computed(() => {
  if (!totalLogCount.value) return 'No logs to display'
  return `Showing ${pageStartIndex.value} – ${pageEndIndex.value} of ${totalLogCount.value} filtered events`
})

const formattedLastUpdated = computed(() => {
  if (!lastFetchedAt.value) return 'Never'
  return lastFetchedAt.value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

const autoRefreshSeconds = computed(() => Math.round(autoRefreshInterval.value / 1000))
const isFirstPage = computed(() => page.value <= 1)
const isLastPage = computed(() => page.value >= pageCount.value)

const handlePageSizeChange = (event) => {
  setPageSize(Number(event.target.value))
}

const handlePageInput = (event) => {
  const value = Number(event.target.value)
  if (!Number.isNaN(value)) setPage(value)
}

onMounted(() => {
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
      <h1 class="text-3xl font-bold text-slate-100">Recent Logs</h1>
      <p class="text-slate-400">Inspect the latest events with the same filters used on the dashboard.</p>
    </header>

    <section class="space-y-6">
      <FilterPanel
        :tenant="tenant"
        :tenant-options="tenantOptions"
        :source-type="sourceType"
        :source-type-options="sourceTypeOptions"
        :date-range="dateRange"
        layout="horizontal"
        @update:tenant="setTenant"
        @update:sourceType="setSourceType"
        @update:dateRange="setDateRange"
        @reset="resetFilters"
      />

      <div class="space-y-5">
        <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-200">Latest Activity</p>
            <p class="text-xs text-slate-500">
              {{ showingLabel }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span class="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1">
              <Filter class="h-3.5 w-3.5 text-cyan-400" />
              {{ filterSummary }}
            </span>
            <span
              v-if="dateRange && dateRange[0] && dateRange[1]"
              class="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1"
            >
              <Calendar class="h-3.5 w-3.5 text-cyan-400" />
              {{ dateRange[0].toLocaleDateString() }} – {{ dateRange[1].toLocaleDateString() }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1">
              <Clock class="h-3.5 w-3.5 text-cyan-400" />
              {{ formattedLastUpdated }}
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/20"
              @click="manualRefresh"
            >
              <RefreshCw class="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
        <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div class="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Auto-refresh every {{ autoRefreshSeconds }}s.</span>
            <span>
              Page {{ page }} of {{ pageCount }} · Rows per page {{ pageSize }}
            </span>
          </div>
          <div v-if="loading" class="flex items-center justify-center gap-3 px-6 py-10 text-sm text-slate-400">
            <RefreshCw class="h-4 w-4 animate-spin text-cyan-300" />
            Loading logs…
          </div>
          <div v-else-if="error" class="px-6 py-10 text-center text-sm text-rose-300">
            {{ error }}
          </div>
          <LogsTable v-else :logs="paginatedLogs" />
          <div class="flex flex-col gap-4 border-t border-slate-800 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{{ showingLabel }}</p>
            <div class="flex flex-wrap items-center gap-2">
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
                <span class="px-1 text-slate-500">of {{ pageCount }}</span>
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
              <label class="flex items-center gap-2 text-slate-400">
                Rows per page
                <select
                  :value="pageSize"
                  class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
                  @change="handlePageSizeChange"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
