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
const enhancing = ref(false)
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

async function enhancePrompt() {
  if (!form.content.trim() || enhancing.value) return
  enhancing.value = true

  try {
    const { content } = await $fetch('/api/prompts/enhance', {
      method: 'POST',
      headers: { [headerName]: csrf },
      body: { content: form.content.trim() }
    })
    form.content = content
    toast.add({ title: 'Prompt enhanced', icon: 'i-lucide-sparkles' })
  } catch {
    toast.add({
      title: 'Failed to enhance prompt',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    enhancing.value = false
  }
}

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
    :title="isEdit ? '编辑提示词' : '创建提示词'"
    :description="isEdit ? '修改你的自定义提示词。' : '创建一个可重复使用的系统提示词用于你的对话。'"
    :ui="{ footer: 'flex-row-reverse justify-start' }"
    :close="false"
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="名称" required>
          <UInput
            v-model="form.name"
            placeholder="例如：我的健康专家"
            class="w-full"
            :disabled="enhancing"
            autofocus
          />
        </UFormField>

        <UFormField label="Description">
          <UInput
            v-model="form.description"
            placeholder="简要描述这个提示词的作用"
            class="w-full"
            :disabled="enhancing"
          />
        </UFormField>

        <UFormField label="图标">
          <USelectMenu
            v-model="form.icon"
            :items="ICON_OPTIONS"
            value-key="value"
            :icon="form.icon"
            class="w-full"
            :disabled="enhancing"
          />
        </UFormField>

        <UFormField label="系统提示词" required>
          <template #hint>
            <UTooltip text="使用AI增强" :delay-duration="200">
              <UButton
                icon="i-lucide-sparkles"
                size="xs"
                variant="ghost"
                color="primary"
                :loading="enhancing"
                :disabled="!form.content.trim() || enhancing"
                @click="enhancePrompt"
              />
            </UTooltip>
          </template>
          <UTextarea
            v-model="form.content"
            placeholder="你是一个专家..."
            :rows="6"
            class="w-full"
            autoresize
            :disabled="enhancing"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton
        :label="isEdit ? '保存' : '创建'"
        :loading="saving"
        :disabled="!isValid || enhancing"
        @click="save"
      />
      <UButton
        color="neutral"
        variant="ghost"
        label="取消"
        :disabled="enhancing"
        @click="emit('close', false)"
      />
    </template>
  </UModal>
</template>
