<script setup lang="ts">
import type { PromptEntry } from '~/composables/usePrompts'

const props = defineProps<{
  prompt?: PromptEntry | null
}>()

const emit = defineEmits<{
  close: [saved: boolean]
}>()

const isEdit = computed(() => !!props.prompt)

const form = reactive({
  name: props.prompt?.name ?? '',
  description: props.prompt?.description ?? '',
  content: props.prompt?.content ?? '',
  icon: props.prompt?.icon ?? 'i-lucide-message-square'
})

const saving = ref(false)
const toast = useToast()
const { csrf, headerName } = useCsrf()

const ICON_OPTIONS = [
  { value: 'i-lucide-message-square', label: 'Chat' },
  { value: 'i-lucide-bot', label: 'Bot' },
  { value: 'i-lucide-code', label: 'Code' },
  { value: 'i-lucide-pen-line', label: 'Writing' },
  { value: 'i-lucide-chart-no-axes-combined', label: 'Analysis' },
  { value: 'i-lucide-graduation-cap', label: 'Education' },
  { value: 'i-lucide-briefcase', label: 'Business' },
  { value: 'i-lucide-heart', label: 'Health' },
  { value: 'i-lucide-palette', label: 'Creative' },
  { value: 'i-lucide-globe', label: 'Language' },
  { value: 'i-lucide-lightbulb', label: 'Ideas' },
  { value: 'i-lucide-shield', label: 'Security' }
]

const isValid = computed(() =>
  form.name.trim().length > 0 && form.content.trim().length > 0
)

async function save() {
  if (!isValid.value) return
  saving.value = true

  try {
    if (isEdit.value && props.prompt) {
      await $fetch(`/api/prompts/${props.prompt.id}`, {
        method: 'PATCH',
        headers: { [headerName]: csrf },
        body: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          content: form.content.trim(),
          icon: form.icon
        }
      })
      toast.add({ title: 'Prompt updated', icon: 'i-lucide-check' })
    } else {
      await $fetch('/api/prompts', {
        method: 'POST',
        headers: { [headerName]: csrf },
        body: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          content: form.content.trim(),
          icon: form.icon
        }
      })
      toast.add({ title: 'Prompt created', icon: 'i-lucide-check' })
    }

    emit('close', true)
  } catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message || 'Failed to save prompt'
    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="isEdit ? 'Edit Prompt' : 'Create Prompt'"
    :description="isEdit ? 'Modify your custom prompt.' : 'Create a reusable system prompt for your chats.'"
    :ui="{ footer: 'flex-row-reverse justify-start' }"
    :close="false"
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Name" required>
          <UInput
            v-model="form.name"
            placeholder="e.g. My SQL Expert"
            autofocus
          />
        </UFormField>

        <UFormField label="Description">
          <UInput
            v-model="form.description"
            placeholder="Brief description of what this prompt does"
          />
        </UFormField>

        <UFormField label="Icon">
          <USelectMenu
            v-model="form.icon"
            :items="ICON_OPTIONS"
            value-key="value"
            :icon="form.icon"
            size="sm"
          />
        </UFormField>

        <UFormField label="System Prompt" required>
          <UTextarea
            v-model="form.content"
            placeholder="You are an expert..."
            :rows="6"
            autoresize
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton
        :label="isEdit ? 'Save' : 'Create'"
        :loading="saving"
        :disabled="!isValid"
        @click="save"
      />
      <UButton
        color="neutral"
        variant="ghost"
        label="Cancel"
        @click="emit('close', false)"
      />
    </template>
  </UModal>
</template>
