import type { GlobalPrompt } from '#shared/utils/prompts'

export interface PromptEntry {
  id: string
  name: string
  description: string | null
  content: string
  icon: string | null
  isGlobal: boolean
  userId: string | null
  createdAt: string | null
  updatedAt: string | null
}

export function usePrompts() {
  const { data: prompts, refresh: refreshPrompts } = useFetch<PromptEntry[]>('/api/prompts', {
    key: 'prompts',
    default: () => []
  })

  const globalPrompts = computed(() =>
    prompts.value.filter(p => p.isGlobal)
  )

  const userPrompts = computed(() =>
    prompts.value.filter(p => !p.isGlobal)
  )

  const selectedPromptId = useState<string | null>('selectedPromptId', () => null)

  const selectedPrompt = computed(() =>
    prompts.value.find(p => p.id === selectedPromptId.value) ?? null
  )

  function selectPrompt(id: string | null) {
    selectedPromptId.value = selectedPromptId.value === id ? null : id
  }

  function findPromptById(id: string | null): PromptEntry | GlobalPrompt | null {
    if (!id) return null
    return prompts.value.find(p => p.id === id) ?? null
  }

  return {
    prompts,
    globalPrompts,
    userPrompts,
    selectedPromptId,
    selectedPrompt,
    selectPrompt,
    findPromptById,
    refreshPrompts
  }
}
