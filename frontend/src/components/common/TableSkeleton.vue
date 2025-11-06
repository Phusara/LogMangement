<script setup>
defineProps({
  rows: {
    type: Number,
    default: 5,
  },
  columns: {
    type: Number,
    default: 10,
  },
})
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
    <table class="min-w-full divide-y divide-slate-800">
      <thead class="bg-slate-900/80">
        <tr class="text-left text-xs uppercase tracking-wide text-slate-400">
          <th 
            v-for="col in columns" 
            :key="`header-${col}`" 
            scope="col" 
            class="px-6 py-4 font-medium"
          >
            <div class="h-4 w-24 animate-pulse rounded bg-slate-800"></div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800">
        <tr 
          v-for="row in rows" 
          :key="`row-${row}`"
          class="animate-pulse"
        >
          <td 
            v-for="col in columns" 
            :key="`cell-${row}-${col}`" 
            class="px-6 py-4"
          >
            <div class="h-4 rounded bg-slate-800" :style="{ width: `${60 + Math.random() * 40}%` }"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
