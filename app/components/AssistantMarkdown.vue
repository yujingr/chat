<script setup lang="ts">
import type { DefineComponent } from 'vue'

const props = defineProps<{
  value: string
  cacheKey: string
  class?: string
  components?: Record<string, DefineComponent>
  parserOptions?: Record<string, unknown>
}>()

const { data: parsed } = await useAsyncData(
  () => `assistant-md:${props.cacheKey}`,
  async () => {
    const v = props.value
    if (!v?.trim()) {
      return null
    }
    return await parseMarkdown(v, {
      ...props.parserOptions,
      toc: false,
      contentHeading: false
    })
  },
  {
    watch: [() => props.value],
    dedupe: 'cancel'
  }
)

const body = computed(() => parsed.value?.body)
</script>

<template>
  <MDCRenderer
    v-if="body?.children?.length"
    :class="props.class"
    :body="body"
    :data="parsed?.data"
    :components="props.components ?? {}"
  />
  <p v-else-if="value.trim()" class="whitespace-pre-wrap">
    {{ value }}
  </p>
</template>
