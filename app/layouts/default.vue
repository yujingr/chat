<script setup lang="ts">
import { LazyModalConfirm, LazyPromptFormModal } from '#components'
import type { PromptEntry } from '~/composables/usePrompts'

const route = useRoute()
const toast = useToast()
const overlay = useOverlay()
const { csrf, headerName } = useCsrf()
const { loggedIn } = useUserSession()

const open = ref(false)
const promptsSlideover = ref(false)

const deleteModal = overlay.create(LazyModalConfirm, {
  props: {
    title: 'Delete chat',
    description: 'Are you sure you want to delete this chat? This cannot be undone.'
  }
})

const deletePromptModal = overlay.create(LazyModalConfirm, {
  props: {
    title: 'Delete prompt',
    description: 'Are you sure you want to delete this prompt? Existing chats will fall back to the default assistant.'
  }
})

const { userPrompts, globalPrompts, refreshPrompts } = usePrompts()

async function openPromptForm(prompt?: PromptEntry) {
  const formModal = overlay.create(LazyPromptFormModal, {
    props: { prompt: prompt ?? null }
  })
  const instance = formModal.open()
  const saved = await instance.result
  if (saved) {
    refreshPrompts()
  }
}

async function deleteSidebarPrompt(id: string) {
  const instance = deletePromptModal.open()
  const result = await instance.result
  if (!result) return

  try {
    await $fetch(`/api/prompts/${id}`, {
      method: 'DELETE',
      headers: { [headerName]: csrf }
    })
    toast.add({ title: 'Prompt deleted', icon: 'i-lucide-trash' })
    refreshPrompts()
  } catch {
    toast.add({ title: 'Failed to delete prompt', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

const { data: chats, refresh: refreshChats } = await useFetch('/api/chats', {
  key: 'chats',
  transform: data => data.map(chat => ({
    id: chat.id,
    label: chat.title || 'Untitled',
    to: `/chat/${chat.id}`,
    icon: 'i-lucide-message-circle',
    createdAt: chat.createdAt
  }))
})

onNuxtReady(async () => {
  const first10 = (chats.value || []).slice(0, 10)
  for (const chat of first10) {
    // prefetch the chat and let the browser cache it
    await $fetch(`/api/chats/${chat.id}`)
  }
})

const { groups } = useChats(chats)

const items = computed(() => groups.value?.flatMap((group) => {
  return [{
    label: group.label,
    type: 'label' as const
  }, ...group.items.map(item => ({
    ...item,
    slot: 'chat' as const,
    icon: undefined,
    class: item.label === 'Untitled' ? 'text-muted' : ''
  }))]
}))

async function deleteChat(id: string) {
  const instance = deleteModal.open()
  const result = await instance.result
  if (!result) {
    return
  }

  await $fetch(`/api/chats/${id}`, {
    method: 'DELETE',
    headers: { [headerName]: csrf }
  })

  toast.add({
    title: 'Chat deleted',
    description: 'Your chat has been deleted',
    icon: 'i-lucide-trash'
  })

  refreshChats()

  if (route.params.id === id) {
    navigateTo('/')
  }
}

defineShortcuts({
  c: () => {
    navigateTo('/')
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="border-r-0 py-4"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-end gap-0.5">
          <Logo class="h-8 w-auto shrink-0" />
          <span v-if="!collapsed" class="text-xl font-bold text-highlighted">Chat</span>
        </NuxtLink>

        <div v-if="!collapsed" class="flex items-center gap-1.5 ms-auto">
          <UDashboardSearchButton collapsed />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5">
          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-plus' } : { label: 'New chat' }"
            variant="soft"
            block
            to="/"
            @click="open = false"
          />

          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-book-text' } : { label: 'Prompts', icon: 'i-lucide-book-text' }"
            variant="ghost"
            color="neutral"
            block
            :ui="{ base: 'justify-start' }"
            @click="promptsSlideover = true"
          />

          <template v-if="collapsed">
            <UDashboardSearchButton collapsed />
          </template>
        </div>

        <UNavigationMenu
          v-if="!collapsed"
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{ link: 'overflow-hidden' }"
        >
          <template #chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="deleteChat((item as any).id)"
              />
            </div>
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      placeholder="Search chats..."
      :groups="[{
        id: 'links',
        items: [{
          label: 'New chat',
          to: '/',
          icon: 'i-lucide-square-pen'
        }]
      }, ...groups]"
    />

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0">
      <slot />
    </div>

    <USlideover v-model:open="promptsSlideover" title="Prompts" description="Manage your custom prompts">
      <template #body>
        <div class="flex flex-col gap-4">
          <div v-if="globalPrompts.length">
            <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              Global
            </p>
            <div class="flex flex-col gap-2">
              <div
                v-for="p in globalPrompts"
                :key="p.id"
                class="flex items-center gap-3 rounded-lg border border-default p-3"
              >
                <UIcon :name="p.icon || 'i-lucide-message-square'" class="size-5 text-muted shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ p.name }}
                  </p>
                  <p v-if="p.description" class="text-xs text-muted truncate">
                    {{ p.description }}
                  </p>
                </div>
                <UIcon name="i-lucide-lock" class="size-3.5 text-dimmed shrink-0" />
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-muted uppercase tracking-wide">
                Your Prompts
              </p>
              <UButton
                v-if="loggedIn"
                icon="i-lucide-plus"
                label="New"
                size="xs"
                variant="ghost"
                @click="openPromptForm()"
              />
            </div>

            <div v-if="!loggedIn" class="text-sm text-muted py-4 text-center">
              Log in to create custom prompts.
            </div>

            <div v-else-if="userPrompts.length === 0" class="text-sm text-muted py-4 text-center">
              No custom prompts yet.
            </div>

            <div v-else class="flex flex-col gap-2">
              <div
                v-for="p in userPrompts"
                :key="p.id"
                class="group flex items-center gap-3 rounded-lg border border-default hover:border-muted p-3 transition-colors"
              >
                <UIcon :name="p.icon || 'i-lucide-message-square'" class="size-5 text-muted shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ p.name }}
                  </p>
                  <p v-if="p.description" class="text-xs text-muted truncate">
                    {{ p.description }}
                  </p>
                </div>
                <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="openPromptForm(p)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="text-muted hover:text-error"
                    @click="deleteSidebarPrompt(p.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </UDashboardGroup>
</template>
