<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated, loginPending } = storeToRefs(authStore)

const form = reactive({
  username: '',
  password: '',
})

if (typeof route.query.username === 'string') {
  form.username = route.query.username
}

const errorMessage = ref(null)

const canSubmit = computed(() => Boolean(form.username?.trim()) && Boolean(form.password))

const redirectToDashboard = () => {
  const redirectParam = route.query.redirect
  if (
    typeof redirectParam === 'string' &&
    redirectParam &&
    redirectParam.startsWith('/') &&
    redirectParam !== route.path
  ) {
    router.replace(redirectParam)
    return
  }
  router.replace({ name: 'dashboard' })
}

watch(
  isAuthenticated,
  (isLoggedIn) => {
    if (isLoggedIn) redirectToDashboard()
  },
  { immediate: true },
)

const submit = async () => {
  if (!canSubmit.value || loginPending.value) return
  errorMessage.value = null
  try {
    await authStore.login({
      username: form.username.trim(),
      password: form.password,
    })
    redirectToDashboard()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to sign in right now.'
  }
}

const handleKey = (event) => {
  if (event.key === 'Enter') submit()
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-950 text-slate-100">
    <div class="flex flex-1 items-center justify-center px-4 py-12">
      <div class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <header class="mb-8 space-y-2 text-center">
          <p class="text-sm uppercase tracking-[0.35em] text-cyan-400">LogMonitor</p>
          <h1 class="text-3xl font-bold">Sign in to your account</h1>
          <p class="text-sm text-slate-400">Use the credentials provided by your administrator.</p>
        </header>

        <form class="space-y-6" @submit.prevent="submit">
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium text-slate-300">Username</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              name="username"
              autocomplete="username"
              required
              class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="demo_user"
            >
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="password" class="text-sm font-medium text-slate-300">Password</label>
            </div>
            <input
              id="password"
              v-model="form.password"
              type="password"
              name="password"
              autocomplete="current-password"
              required
              class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="••••••••"
              @keydown="handleKey"
            >
          </div>

          <p v-if="errorMessage" class="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="!canSubmit || loginPending"
          >
            <span v-if="!loginPending">Sign In</span>
            <span v-else>Signing in…</span>
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-400">
          Don't have an account?
          <RouterLink to="/register" class="font-semibold text-cyan-400 hover:text-cyan-300">Register now</RouterLink>
        </p>
      </div>
    </div>

    <footer class="pb-8 text-center text-xs text-slate-600">
      © {{ new Date().getFullYear() }} LogMonitor Inc.
    </footer>
  </div>
</template>
