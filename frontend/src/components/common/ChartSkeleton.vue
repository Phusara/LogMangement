<script setup>
defineProps({
  height: {
    type: String,
    default: '18rem',
  },
})
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <div class="mb-4 flex items-center justify-between">
      <div class="h-6 w-32 animate-pulse rounded bg-slate-800"></div>
    </div>
    <div class="animate-pulse" :style="{ height }">
      <div class="flex h-full items-end gap-2">
        <div 
          v-for="i in 12" 
          :key="i" 
          class="flex-1 rounded-t bg-slate-800"
          :style="{ height: `${30 + Math.random() * 70}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
