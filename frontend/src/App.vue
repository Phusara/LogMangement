<script setup>
import { RouterView } from 'vue-router'
import { onErrorCaptured, ref } from 'vue'
import { logger } from '@/utils/logger'

const error = ref(null)

/**
 * Global error handler
 * Catches errors from child components
 */
onErrorCaptured((err, instance, info) => {
  logger.error('Component error caught', { 
    error: err.message, 
    component: instance?.$options?.name,
    info 
  })
  
  error.value = {
    message: err.message || 'An unexpected error occurred',
    stack: err.stack,
    info,
  }
  
  // Prevent error from propagating
  return false
})

/**
 * Clear error and reload
 */
const handleReload = () => {
  error.value = null
  window.location.reload()
}

/**
 * Clear error and go back
 */
const handleGoBack = () => {
  error.value = null
  window.history.back()
}
</script>

<template>
	<!-- Error Boundary -->
	<div v-if="error" class="flex min-h-screen items-center justify-center bg-slate-950 p-4">
		<div class="w-full max-w-2xl rounded-2xl border border-red-500/30 bg-slate-900/80 p-8 shadow-2xl">
			<div class="mb-6 flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
					<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-bold text-slate-100">Application Error</h1>
					<p class="text-sm text-slate-400">Something went wrong</p>
				</div>
			</div>
			
			<div class="mb-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
				<p class="mb-2 text-sm font-medium text-red-300">Error Message:</p>
				<p class="font-mono text-sm text-slate-300">{{ error.message }}</p>
			</div>
			
			<div class="flex flex-wrap gap-3">
				<button
					type="button"
					class="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
					@click="handleReload"
				>
					Reload Page
				</button>
				<button
					type="button"
					class="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
					@click="handleGoBack"
				>
					Go Back
				</button>
			</div>
			
			<details v-if="error.stack" class="mt-6">
				<summary class="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
					Show technical details
				</summary>
				<pre class="mt-2 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-400">{{ error.stack }}</pre>
			</details>
		</div>
	</div>
	
	<!-- Normal App -->
	<RouterView v-else />
</template>
