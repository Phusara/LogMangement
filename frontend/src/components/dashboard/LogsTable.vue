<script setup>
import { format } from 'date-fns'

const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
})


const getSeverityStyle = (severity) => {
  const level = Number(severity)
  
  if (level >= 8) {
    return 'bg-rose-500/15 text-rose-200 border border-rose-500/30'
  } else if (level >= 5) {
    return 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
  } else if (level >= 3) {
    return 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30'
  } else {
    return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
  }
}


const formatRaw = (entry) => {
  if (!entry) return ''
  if (typeof entry === 'string') return entry

  const formatValue = (value, depth = 0) => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) {
      if (!value.length) return '[]'
      const inner = value.map((item) => formatValue(item, depth + 1)).join(', ')
      return `[${inner}]`
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value)
      if (!entries.length) return '{}'
      const inner = entries.map(([key, val]) => `${key}:${formatValue(val, depth + 1)}`).join(', ')
      return `{${inner}}`
    }
    return String(value)
  }

  try {
    const entries = Object.entries(entry)
    if (!entries.length) return '{}'
    const inner = entries.map(([key, val]) => `${key}:${formatValue(val)}`).join(', ')
    return `{${inner}}`
  } catch (error) {
    console.warn('Failed to format log payload inline', error)
    try {
      return JSON.stringify(entry)
    } catch (fallbackError) {
      console.warn('Unable to stringify log payload', fallbackError)
      return String(entry)
    }
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
    <table class="min-w-full divide-y divide-slate-800">
      <thead class="bg-slate-900/80">
        <tr class="text-left text-xs uppercase tracking-wide text-slate-400">
          <th scope="col" class="px-6 py-4 font-medium">Timestamp</th>
          <th scope="col" class="px-6 py-4 font-medium">Severity</th>
          <th scope="col" class="px-6 py-4 font-medium">User</th>
          <th scope="col" class="px-6 py-4 font-medium">Source IP</th>
          <th scope="col" class="px-6 py-4 font-medium">Destination IP</th>
          <th scope="col" class="px-6 py-4 font-medium">Source Type</th>
          <th scope="col" class="px-6 py-4 font-medium">Tenant</th>
          <th scope="col" class="px-6 py-4 font-medium">Host</th>
          <th scope="col" class="px-6 py-4 font-medium">Message</th>
          <th scope="col" class="px-6 py-4 font-medium">Raw</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800 text-sm">
        <tr
          v-for="log in props.logs"
          :key="log.id"
          class="transition-colors hover:bg-slate-800/40"
        >
          <td class="px-6 py-4 font-mono text-xs text-slate-300">
            {{ format(log.timestamp, 'MMM dd, HH:mm:ss') }}
          </td>
          <td class="px-6 py-4">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              :class="getSeverityStyle(log.severity)"
            >
              {{ log.severity }}
            </span>
          </td>
          <td class="px-6 py-4 text-slate-200">{{ log.user }}</td>
          <td class="px-6 py-4 font-mono text-xs text-slate-300">{{ log.ip }}</td>
          <td class="px-6 py-4 font-mono text-xs text-slate-300">{{ log.destinationIp }}</td>
          <td class="px-6 py-4 text-slate-200">{{ log.sourceType }}</td>
          <td class="px-6 py-4 text-slate-400">{{ log.tenant }}</td>
          <td class="px-6 py-4 text-slate-400">{{ log.host }}</td>
          <td class="px-6 py-4 text-slate-300">{{ log.message }}</td>
          <td class="px-6 py-4 align-top ">
            <div class="h-20 w-30 overflow-auto">{{ formatRaw(log.raw) }}</div>
          </td>
        </tr>
        <tr v-if="!props.logs.length">
          <td colspan="9" class="px-6 py-12 text-center text-sm text-slate-500">
            No logs match the current filters.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
