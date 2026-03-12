<script setup lang="ts">
import { LazyPromptFormModal, LazyModalConfirm } from '#components'
import type { PromptEntry } from '~/composables/usePrompts'

const input = ref('')
const loading = ref(false)
const chatId = crypto.randomUUID()

const {
  dropzoneRef,
  isDragging,
  open,
  files,
  isUploading,
  uploadedFiles,
  removeFile,
  clearFiles
} = useFileUploadWithStatus(chatId)

const { csrf, headerName } = useCsrf()
const overlay = useOverlay()
const toast = useToast()

const { prompts, selectedPromptId, selectPrompt, refreshPrompts } = usePrompts()

const deleteModal = overlay.create(LazyModalConfirm, {
  props: {
    title: 'Delete prompt',
    description: 'Are you sure you want to delete this prompt? Existing chats using it will fall back to the default assistant.'
  }
})

async function createChat(prompt: string) {
  input.value = prompt
  loading.value = true

  const parts: Array<{ type: string, text?: string, mediaType?: string, url?: string }> = [{ type: 'text', text: prompt }]

  if (uploadedFiles.value.length > 0) {
    parts.push(...uploadedFiles.value)
  }

  const chat = await $fetch('/api/chats', {
    method: 'POST',
    headers: { [headerName]: csrf },
    body: {
      id: chatId,
      message: {
        role: 'user',
        parts
      },
      promptId: selectedPromptId.value
    }
  })

  refreshNuxtData('chats')
  navigateTo(`/chat/${chat?.id}`)
}

async function onSubmit() {
  await createChat(input.value)
  clearFiles()
}

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

async function deletePrompt(id: string) {
  const instance = deleteModal.open()
  const result = await instance.result
  if (!result) return

  try {
    await $fetch(`/api/prompts/${id}`, {
      method: 'DELETE',
      headers: { [headerName]: csrf }
    })
    toast.add({ title: 'Prompt deleted', icon: 'i-lucide-trash' })
    if (selectedPromptId.value === id) {
      selectedPromptId.value = null
    }
    refreshPrompts()
  } catch {
    toast.add({ title: 'Failed to delete prompt', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

const quickChats = [
  {
    label: 'Why use Nuxt UI?',
    icon: 'i-logos-nuxt-icon'
  },
  {
    label: 'Help me create a Vue composable',
    icon: 'i-logos-vue'
  },
  {
    label: 'Tell me more about UnJS',
    icon: 'i-logos-unjs'
  },
  {
    label: 'Why should I consider VueUse?',
    icon: 'i-logos-vueuse'
  },
  {
    label: 'Tailwind CSS best practices',
    icon: 'i-logos-tailwindcss-icon'
  },
  {
    label: 'What is the weather in Bordeaux?',
    icon: 'i-lucide-sun'
  },
  {
    label: 'Show me a chart of sales data',
    icon: 'i-lucide-line-chart'
  }
]
</script>

<template>
  <UDashboardPanel
    id="home"
    class="min-h-0"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <div ref="dropzoneRef" class="flex flex-1">
        <DragDropOverlay :show="isDragging" />

        <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
          <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
            How can I help you today?
          </h1>

          <div v-if="prompts.length" class="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-thin">
            <PromptCard
              v-for="p in prompts"
              :key="p.id"
              :prompt="p"
              :selected="selectedPromptId === p.id"
              @select="selectPrompt(p.id)"
              @edit="openPromptForm(p)"
              @delete="deletePrompt(p.id)"
            />

            <button
              class="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-default hover:border-muted hover:bg-elevated/50 p-3 min-w-[180px] max-w-[220px] shrink-0 transition-all cursor-pointer"
              @click="openPromptForm()"
            >
              <UIcon name="i-lucide-plus" class="size-5 text-muted" />
              <span class="text-sm text-muted">Create Prompt</span>
            </button>
          </div>

          <div v-if="selectedPromptId" class="flex items-center gap-2">
            <UBadge
              :label="prompts.find(p => p.id === selectedPromptId)?.name"
              :icon="prompts.find(p => p.id === selectedPromptId)?.icon || 'i-lucide-message-square'"
              color="primary"
              variant="subtle"
              size="sm"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              class="text-muted"
              @click="selectedPromptId = null"
            />
          </div>

          <UChatPrompt
            v-model="input"
            :status="loading ? 'streaming' : 'ready'"
            :disabled="isUploading"
            class="[view-transition-name:chat-prompt]"
            variant="subtle"
            :ui="{ base: 'px-1.5' }"
            @submit="onSubmit"
          >
            <template v-if="files.length > 0" #header>
              <div class="flex flex-wrap gap-2">
                <FileAvatar
                  v-for="fileWithStatus in files"
                  :key="fileWithStatus.id"
                  :name="fileWithStatus.file.name"
                  :type="fileWithStatus.file.type"
                  :preview-url="fileWithStatus.previewUrl"
                  :status="fileWithStatus.status"
                  :error="fileWithStatus.error"
                  removable
                  @remove="removeFile(fileWithStatus.id)"
                />
              </div>
            </template>

            <template #footer>
              <div class="flex items-center gap-1">
                <FileUploadButton :open="open" />

                <ModelSelect />
              </div>

              <UChatPromptSubmit color="neutral" size="sm" :disabled="isUploading" />
            </template>
          </UChatPrompt>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="quickChat in quickChats"
              :key="quickChat.label"
              :icon="quickChat.icon"
              :label="quickChat.label"
              size="sm"
              color="neutral"
              variant="outline"
              class="rounded-full"
              @click="createChat(quickChat.label)"
            />
          </div>
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>
</template>
