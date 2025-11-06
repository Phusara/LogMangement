<script setup>
defineProps({
  count: {
    type: Number,
    default: 3,
  },
})
</script>

<template>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <div 
      v-for="i in count" 
      :key="i"
      class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
    >
      <div class="mb-4 flex items-center justify-between">
        <div class="h-5 w-32 animate-pulse rounded bg-slate-800"></div>
        <div class="h-10 w-10 animate-pulse rounded-xl bg-slate-800"></div>
      </div>
      <div class="space-y-3">
        <div class="h-8 w-24 animate-pulse rounded bg-slate-800"></div>
        <div class="h-4 w-40 animate-pulse rounded bg-slate-800"></div>
      </div>
    </div>
  </div>
</template>
