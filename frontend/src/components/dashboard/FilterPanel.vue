<script setup>
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const props = defineProps({
  tenant: { type: String, default: 'all' },
  tenantOptions: {
    type: Array,
    default: () => [],
  },
  sourceType: { type: String, default: 'all' },
  sourceTypeOptions: {
    type: Array,
    default: () => [],
  },
  dateRange: {
    type: Array,
    default: () => null,
  },
  layout: {
    type: String,
    default: 'vertical',
    validator: (value) => ['vertical', 'horizontal'].includes(value),
  },
})

const emit = defineEmits(['update:tenant', 'update:sourceType', 'update:dateRange', 'reset'])

const rangeModel = computed({
  get: () => props.dateRange,
  set: (value) => emit('update:dateRange', value),
})

const isHorizontal = computed(() => props.layout === 'horizontal')

const fieldWrapperClass = computed(() =>
  isHorizontal.value
    ? 'mt-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(3,minmax(220px,1fr))]'
    : 'mt-6 space-y-5',
)

const resetButtonClass = computed(() =>
  isHorizontal.value
    ? 'mt-4 w-full sm:w-auto md:self-end md:ml-auto'
    : 'mt-8 w-full',
)

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <div
    class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
    :class="props.layout === 'horizontal' ? 'md:p-7' : ''"
  >
    <h3 class="text-lg font-semibold text-slate-100">Filters</h3>
    <div :class="fieldWrapperClass">
      <label class="block text-sm font-medium text-slate-400">
        <span class="mb-2 block">Tenant</span>
        <select
          :value="tenant"
          class="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          @change="emit('update:tenant', $event.target.value)"
        >
          <option value="all">All</option>
          <option v-for="option in tenantOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="block text-sm font-medium text-slate-400">
        <span class="mb-2 block">Source Type</span>
        <select
          :value="sourceType"
          class="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          @change="emit('update:sourceType', $event.target.value)"
        >
          <option value="all">All</option>
          <option v-for="option in sourceTypeOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>

      <div class="text-sm font-medium text-slate-400">
        <span class="mb-2 block">Date Range</span>
        <VueDatePicker
          v-model="rangeModel"
          range
          :enable-time-picker="false"
          :multi-calendars="true"
          :teleport="false"
          placeholder="Pick a date range"
          dark
          input-class="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          menu-class-name="dp-dark"
        />
      </div>
    </div>

    <button
      type="button"
      class="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
      :class="resetButtonClass"
      @click="handleReset"
    >
      Reset Filters
    </button>
  </div>
</template>
