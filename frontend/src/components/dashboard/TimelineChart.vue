<script setup>
import { computed, watch, shallowRef } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const props = defineProps({
  title: { type: String, default: 'Event Timeline' },
  data: {
    type: Array,
    default: () => [],
  },
  // Optional dateRange prop: [startDate, endDate] where items are Date or ISO strings
  dateRange: {
    type: Array,
    default: null,
  },
})

// Use shallowRef for better performance with large datasets
const chartData = shallowRef({
  labels: [],
  datasets: [],
})

// Helper: get YYYY-MM-DD string in UTC for a bucket ISO string
const bucketDayUTC = (iso) => {
  try {
    const d = new Date(iso)
    // Use toISOString slice to get YYYY-MM-DD in UTC
    return d.toISOString().slice(0, 10)
  } catch (e) {
    return null
  }
}

// Helper: format YYYY-MM-DD (UTC) to readable like 'Nov 12, 2025'
const formatDayReadable = (yyyyMmDd) => {
  try {
    const d = new Date(yyyyMmDd + 'T00:00:00Z')
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  } catch (e) {
    return yyyyMmDd
  }
}

// Memoized chart data computation with auto-filter to today's buckets
const updateChartData = () => {
  if (!props.data?.length) {
    chartData.value = { labels: [], datasets: [] }
    return
  }

  // If timeline items include an original `bucket` ISO string, detect whether
  // the timeline spans multiple distinct days. If a dateRange is provided by
  // the UI, prefer to show buckets that fall within that range (inclusive).
  // If the timeline spans multiple distinct days and no dateRange is given,
  // show only today's data to avoid clutter. If any filtering produces an
  // empty set, fall back to full data to avoid an empty chart.
  let processed = props.data

  const hasBucket = props.data.some((it) => it && it.bucket)
  if (hasBucket) {
    const days = new Set()
    for (const it of props.data) {
      if (!it || !it.bucket) continue
      const day = bucketDayUTC(it.bucket)
      if (day) days.add(day)
    }
    // If a dateRange prop is provided and both ends exist, use it to filter
    if (props.dateRange && props.dateRange[0] && props.dateRange[1]) {
      // Accept Date objects or ISO strings for incoming dateRange values
      const start = props.dateRange[0] instanceof Date ? props.dateRange[0] : new Date(props.dateRange[0])
      const end = props.dateRange[1] instanceof Date ? props.dateRange[1] : new Date(props.dateRange[1])
      // Convert to UTC-day strings YYYY-MM-DD
      const startUTC = start.toISOString().slice(0, 10)
      const endUTC = end.toISOString().slice(0, 10)

      const inRange = props.data.filter((it) => {
        if (!it || !it.bucket) return false
        const day = bucketDayUTC(it.bucket)
        return day >= startUTC && day <= endUTC
      })
      // Respect the explicit dateRange: use the filtered slice even if empty so
      // the chart reflects the user's selection.
      processed = inRange
    } else if (days.size > 1) {
      // No explicit range: Data spans multiple days - try to pick today's UTC buckets
      const todayUTC = new Date().toISOString().slice(0, 10)
      const todaySlice = props.data.filter((it) => it && it.bucket && bucketDayUTC(it.bucket) === todayUTC)
      if (todaySlice.length > 0) {
        processed = todaySlice
      }
      // otherwise keep full data (avoid empty chart)
    }
  }

  chartData.value = {
    labels: processed.map((item) => item.time),
    datasets: [
      {
        label: 'Events',
        data: processed.map((item) => item.count),
        tension: 0.35,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.18)',
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#020617',
        borderWidth: 2,
        fill: true,
      },
    ],
  }
}

// Watch for data changes and update chart
watch(
  () => props.data,
  updateChartData,
  { immediate: true },
)

// Compute a small subtitle indicating which day or range is being shown
const displayLabel = computed(() => {
  if (!props.data || !props.data.length) return ''
  // If a dateRange prop is provided, prefer to display that range explicitly
  if (props.dateRange && props.dateRange[0] && props.dateRange[1]) {
    const start = props.dateRange[0] instanceof Date ? props.dateRange[0] : new Date(props.dateRange[0])
    const end = props.dateRange[1] instanceof Date ? props.dateRange[1] : new Date(props.dateRange[1])
    const startUTC = start.toISOString().slice(0, 10)
    const endUTC = end.toISOString().slice(0, 10)
    if (startUTC === endUTC) return formatDayReadable(startUTC)
    return `${formatDayReadable(startUTC)} — ${formatDayReadable(endUTC)}`
  }

  const hasBucket = props.data.some((it) => it && it.bucket)
  if (!hasBucket) return ''

  const days = Array.from(
    new Set(
      props.data.map((it) => (it && it.bucket ? bucketDayUTC(it.bucket) : null)).filter(Boolean),
    ),
  ).sort()

  if (!days.length) return ''
  if (days.length === 1) return formatDayReadable(days[0])

  // If multiple days, prefer to show today's date if data exists for today
  const todayUTC = new Date().toISOString().slice(0, 10)
  const todaySlice = props.data.filter((it) => it && it.bucket && bucketDayUTC(it.bucket) === todayUTC)
  if (todaySlice.length > 0) return formatDayReadable(todayUTC)

  // Otherwise show range
  return `${formatDayReadable(days[0])} — ${formatDayReadable(days[days.length - 1])}`
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#0f172a',
      borderColor: '#1e293b',
      borderWidth: 1,
      padding: 12,
      titleColor: '#e2e8f0',
      bodyColor: '#cbd5f5',
      displayColors: false,
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#94a3b8',
        font: {
          size: 12,
        },
      },
      grid: {
        color: 'rgba(30, 41, 59, 0.35)',
        drawBorder: false,
      },
    },
    y: {
      ticks: {
        color: '#94a3b8',
        font: {
          size: 12,
        },
        precision: 0,
      },
      grid: {
        color: 'rgba(30, 41, 59, 0.35)',
        drawBorder: false,
      },
      beginAtZero: true,
      suggestedMax: 10,
    },
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
    },
  },
}
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-baseline gap-3">
        <h2 class="text-lg font-semibold text-slate-100">{{ title }}</h2>
        <span v-if="displayLabel" class="text-sm text-slate-400">{{ displayLabel }}</span>
      </div>
    </div>
    <div class="h-72">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
