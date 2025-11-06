<script setup>
import { storeToRefs } from 'pinia'
import { Activity, Users, Server, AlertTriangle } from 'lucide-vue-next'

import AppShell from '@/components/layout/AppShell.vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import TimelineChart from '@/components/dashboard/TimelineChart.vue'
import TopItemsList from '@/components/dashboard/TopItemsList.vue'
import FilterPanel from '@/components/dashboard/FilterPanel.vue'
import { useLogsStore } from '@/stores/logs'

const logsStore = useLogsStore()

const {
  tenant,
  sourceType,
  dateRange,
  filteredLogs,
  summary,
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
} = storeToRefs(logsStore)

const { setTenant, setSourceType, setDateRange, resetFilters } = logsStore
</script>

<template>
  <AppShell>
    <header class="space-y-1">
      <p class="text-sm uppercase tracking-widest text-cyan-400">LogMonitor</p>
      <h1 class="text-3xl font-bold text-slate-100">Log Management Dashboard</h1>
      <p class="text-slate-400">Monitor and analyze system logs in real-time.</p>
    </header>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Events"
        :value="summary.totalEvents"
        :icon="Activity"
        trend="+12.5% from last hour"
      />
      <StatsCard
        title="Unique Users"
        :value="uniqueUsers"
        :icon="Users"
        :trend="userTrend"
      />
      <StatsCard
        title="Unique IPs"
        :value="uniqueIPs"
        :icon="Server"
        trend="Across monitored tenants"
      />
      <StatsCard
        title="Errors"
        :value="errorCount"
        :icon="AlertTriangle"
        :trend="errorTrend"
      />
    </section>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div class="space-y-6 xl:col-span-3">
        <TimelineChart :data="timelineData" />

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <TopItemsList title="Top IP Addresses" :items="topIPs" />
          <TopItemsList title="Top Users" :items="topUsers" />
          <TopItemsList title="Top Event Types" :items="topSourceTypes" />
        </div>
      </div>

      <FilterPanel
        :tenant="tenant"
        :tenant-options="tenantOptions"
        :source-type="sourceType"
        :source-type-options="sourceTypeOptions"
        :date-range="dateRange"
        @update:tenant="setTenant"
        @update:sourceType="setSourceType"
        @update:dateRange="setDateRange"
        @reset="resetFilters"
      />
    </section>
  </AppShell>
</template>
