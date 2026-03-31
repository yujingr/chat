<script setup lang="ts">
import type { DefineComponent } from 'vue'

const props = defineProps<{
  value: string
  cacheKey: string
  class?: string
  components?: Record<string, DefineComponent>
  parserOptions?: Record<string, unknown>
}>()

const body = shallowRef<any>(null)
const parsedData = shallowRef<any>(null)

let parser: ((value: string) => Promise<any>) | null = null

async function parseValue(value: string) {
  if (!value?.trim()) {
    body.value = null
    parsedData.value = null
    return
  }

  try {
    if (!parser) {
      const { createCachedParser } = await import('@nuxtjs/mdc/runtime')
      parser = createCachedParser({
        ...props.parserOptions,
        toc: false,
        contentHeading: false
      })
    }

    const result = await parser(value)
    if (result?.body) {
      body.value = result.body
      parsedData.value = result.data
    }
  } catch {
    // Parsing failed — plain text fallback remains visible
  }
}

parseValue(props.value)
watch(() => props.value, val => parseValue(val))
</script>

<template>
  <MDCRenderer
    v-if="body?.children?.length"
    :class="props.class"
    :body="body"
    :data="parsedData"
    :components="props.components ?? {}"
  />
  <p v-else-if="value.trim()" class="whitespace-pre-wrap">
    {{ value }}
  </p>
</template>
