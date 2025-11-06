<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  ScrollText,
  LineChart,
  Settings,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const navItems = computed(() => [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Logs', icon: ScrollText, path: '/logs' },
  { label: 'Alerts', icon: LineChart, path: '/alerts' },
  { label: 'Data retention', icon: Settings, path: null },
])

const navigate = (item) => {
  if (!item.path) return
  router.push(item.path)
}

const isActive = (item) => item.path && route.path === item.path

const userLabel = computed(() => authStore.user?.username ?? 'Authenticated user')
const roleLabel = computed(() => authStore.user?.role)

const triggerLogout = () => {
  authStore.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-950 text-slate-100">
    <aside class="hidden w-64 border-r border-slate-900/80 bg-slate-950/80 px-6 py-8 lg:flex lg:flex-col">
      <div class="mb-10">
        <p class="text-xl font-semibold text-cyan-400">LogMonitor</p>
      </div>
      <nav class="flex flex-1 flex-col gap-2">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          class="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          :class="isActive(item)
            ? 'bg-cyan-500/10 text-cyan-300'
            : item.path
              ? 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100'
              : 'cursor-not-allowed text-slate-600'
          "
          @click="navigate(item)"
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="mt-12 text-xs text-slate-600">
        © {{ new Date().getFullYear() }} LogMonitor Inc.
      </div>
    </aside>
    <main class="flex-1 overflow-x-hidden">
      <div class="flex items-center justify-between border-b border-slate-900/70 bg-slate-950/80 px-6 py-4 text-sm text-slate-400">
        <div>
          <span class="font-semibold text-slate-100">{{ userLabel }}</span>
          <span v-if="roleLabel" class="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">{{ roleLabel }}</span>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-slate-900"
          @click="triggerLogout"
        >
          Logout
        </button>
      </div>
      <div class="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <slot />
      </div>
    </main>
  </div>
</template>
