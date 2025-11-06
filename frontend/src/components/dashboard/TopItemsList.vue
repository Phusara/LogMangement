<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  items: {
    type: Array,
    default: () => [],
  },
})

const maxCount = computed(() => {
  if (!props.items.length) return 1
  return Math.max(...props.items.map((item) => item.count)) || 1
})

</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <h3 class="text-lg font-semibold text-slate-100">{{ title }}</h3>
    <div class="mt-6 space-y-5">
      <div v-for="item in items" :key="item.name" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium text-slate-100">{{ item.name }}</span>
          <span class="text-slate-400">{{ item.count }}</span>
        </div>
        <div class="h-2 w-full rounded-full bg-slate-800">
          <div
            class="h-full rounded-full bg-cyan-400"
            :style="{ width: `${Math.round((item.count / maxCount) * 100)}%` }"
          />
        </div>
      </div>
      <p v-if="!items.length" class="text-sm text-slate-500">No data available.</p>
    </div>
  </div>
</template>
