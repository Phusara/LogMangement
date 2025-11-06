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
})

// Use shallowRef for better performance with large datasets
const chartData = shallowRef({
  labels: [],
  datasets: [],
})

// Memoized chart data computation
const updateChartData = () => {
  if (!props.data?.length) {
    chartData.value = { labels: [], datasets: [] }
    return
  }

  chartData.value = {
    labels: props.data.map((item) => item.time),
    datasets: [
      {
        label: 'Events',
        data: props.data.map((item) => item.count),
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
watch(() => props.data, updateChartData, { immediate: true })

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
      <h2 class="text-lg font-semibold text-slate-100">{{ title }}</h2>
    </div>
    <div class="h-72">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
