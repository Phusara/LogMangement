<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Calendar, Filter } from 'lucide-vue-next'

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
  filteredLogs,
  recentLogs,
  summary,
} = storeToRefs(logsStore)

const { setTenant, setSourceType, setDateRange, resetFilters } = logsStore

const filterSummary = computed(() => {
  const parts = []
if (tenant.value && tenant.value.toLowerCase() !== 'all') parts.push(`Tenant: ${tenant.value}`)
  if (sourceType.value && sourceType.value.toLowerCase() !== 'all') parts.push(`Source: ${sourceType.value}`)
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    parts.push('Date range applied')
  }
  return parts.length ? parts.join(' · ') : 'No filters applied'
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
              Showing {{ recentLogs.length }} of {{ summary.totalEvents }} filtered events
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
          </div>
        </div>
        <LogsTable :logs="recentLogs" />
      </div>
    </section>
  </AppShell>
</template>
