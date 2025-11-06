<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated, registerPending } = storeToRefs(authStore)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'tenant',
})

const errorMessage = ref(null)
const successMessage = ref(null)

const roleOptions = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'admin', label: 'Admin' },
]

const canSubmit = computed(() =>
  Boolean(form.username?.trim()) &&
  Boolean(form.password) &&
  Boolean(form.confirmPassword) &&
  form.password === form.confirmPassword,
)

watch(
  isAuthenticated,
  (isLoggedIn) => {
    if (isLoggedIn) router.replace({ name: 'dashboard' })
  },
  { immediate: true },
)

const resetFeedback = () => {
  errorMessage.value = null
  successMessage.value = null
}

const submit = async () => {
  if (!canSubmit.value || registerPending.value) return
  resetFeedback()

  if (form.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long.'
    return
  }

  try {
    const payload = await authStore.register({
      username: form.username.trim(),
      password: form.password,
      role: form.role,
    })

    successMessage.value = `Account for ${payload.username ?? form.username} registered successfully. Redirecting to sign in…`

    setTimeout(() => {
      router.replace({
        name: 'login',
        query: { username: payload.username ?? form.username },
      })
    }, 1500)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed.'
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-950 text-slate-100">
    <div class="flex flex-1 items-center justify-center px-4 py-12">
      <div class="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <header class="mb-8 space-y-2 text-center">
          <p class="text-sm uppercase tracking-[0.35em] text-cyan-400">LogMonitor</p>
          <h1 class="text-3xl font-bold">Create your account</h1>
          <p class="text-sm text-slate-400">Provision a new LogMonitor user with the appropriate role.</p>
        </header>

        <form class="space-y-6" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <label for="role" class="text-sm font-medium text-slate-300">Role</label>
              <select
                id="role"
                v-model="form.role"
                name="role"
                class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <label for="password" class="text-sm font-medium text-slate-300">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                name="password"
                autocomplete="new-password"
                required
                class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="At least 8 characters"
              >
            </div>

            <div class="space-y-2">
              <label for="confirmPassword" class="text-sm font-medium text-slate-300">Confirm Password</label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                name="confirmPassword"
                autocomplete="new-password"
                required
                class="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="Repeat password"
              >
            </div>
          </div>

          <p v-if="errorMessage" class="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {{ errorMessage }}
          </p>

          <p v-if="successMessage" class="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {{ successMessage }}
          </p>

          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="!canSubmit || registerPending"
          >
            <span v-if="!registerPending">Register</span>
            <span v-else>Registering…</span>
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-400">
          Already have access?
          <RouterLink to="/login" class="font-semibold text-cyan-400 hover:text-cyan-300">Sign in instead</RouterLink>
        </p>
      </div>
    </div>

    <footer class="pb-8 text-center text-xs text-slate-600">
      © {{ new Date().getFullYear() }} LogMonitor Inc.
    </footer>
  </div>
</template>
