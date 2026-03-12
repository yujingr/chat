import { MODELS } from '#shared/utils/models'

export function useModels() {
  const model = useCookie<string>('model', { default: () => 'anthropic/claude-opus-4.6' })

  return {
    models: MODELS,
    model
  }
}
