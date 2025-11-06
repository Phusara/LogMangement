<script setup>
import { toRefs } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: [Object, Function], required: true },
  trend: { type: String, default: '' },
})

const { title, value, icon, trend } = toRefs(props)
</script>

<template>
  <div
    class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-colors duration-200 hover:border-cyan-400/60"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-sm font-medium text-slate-400">{{ title }}</p>
        <p class="mt-2 text-2xl font-semibold text-slate-100">{{ value }}</p>
      </div>
      <component v-if="icon" :is="icon" class="h-6 w-6 text-cyan-400" />
    </div>
    <p v-if="trend" class="mt-4 text-xs text-slate-500">{{ trend }}</p>
  </div>
</template>
