<script setup lang="ts">
import type { PromptEntry } from '~/composables/usePrompts'

defineProps<{
  prompt: PromptEntry
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
  edit: []
  delete: []
}>()
</script>

<template>
  <button
    class="group relative flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all cursor-pointer min-w-[180px] max-w-[220px] shrink-0"
    :class="[
      selected
        ? 'border-primary bg-primary/5 ring-1 ring-primary'
        : 'border-default hover:border-muted hover:bg-elevated/50'
    ]"
    @click="emit('select')"
  >
    <div class="flex items-start justify-between gap-2">
      <UIcon
        :name="prompt.icon || 'i-lucide-message-square'"
        class="size-5 shrink-0"
        :class="selected ? 'text-primary' : 'text-muted'"
      />

      <div v-if="!prompt.isGlobal" class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          class="text-muted hover:text-primary"
          @click.stop="emit('edit')"
        />
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="xs"
          class="text-muted hover:text-error"
          @click.stop="emit('delete')"
        />
      </div>

      <UIcon
        v-if="prompt.isGlobal"
        name="i-lucide-lock"
        class="size-3.5 text-dimmed shrink-0"
      />
    </div>

    <span class="text-sm font-medium text-highlighted truncate w-full">{{ prompt.name }}</span>
    <span v-if="prompt.description" class="text-xs text-muted line-clamp-2 leading-relaxed">{{ prompt.description }}</span>
  </button>
</template>
