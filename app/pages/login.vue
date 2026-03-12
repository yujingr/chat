<script setup lang="ts">
definePageMeta({ layout: false })

const password = ref('')
const error = ref('')
const loading = ref(false)
const { csrf, headerName } = useCsrf()
const { fetch: refreshSession } = useUserSession()

async function login() {
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      headers: { [headerName]: csrf },
      body: { password: password.value }
    })
    await refreshSession()
    navigateTo('/')
  } catch {
    error.value = 'Invalid password'
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center bg-default px-4">
    <div class="w-full max-w-xs flex flex-col items-center gap-8">
      <div class="flex items-end gap-1">
        <Logo class="h-9 w-auto" />
        <span class="text-2xl font-bold text-highlighted">Chat</span>
      </div>

      <form class="w-full flex flex-col gap-4" @submit.prevent="login">
        <UInput
          v-model="password"
          type="password"
          placeholder="Password"
          size="lg"
          autofocus
          :color="error ? 'error' : undefined"
        />

        <p v-if="error" class="text-sm text-error text-center">
          {{ error }}
        </p>

        <UButton
          type="submit"
          label="Log in"
          block
          size="lg"
          :loading="loading"
          :disabled="!password.trim()"
        />
      </form>
    </div>
  </div>
</template>
