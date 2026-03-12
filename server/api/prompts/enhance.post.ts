import { generateText } from 'ai'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Login required' })
  }

  const { content } = await readValidatedBody(event, z.object({
    content: z.string().min(1).max(10000)
  }).parse)

  const { text } = await generateText({
    model: 'google/gemini-3.1-flash-lite-preview',
    system: `You are a prompt engineering expert. Transform the user's raw, unstructured input into a well-crafted system prompt.

Guidelines:
- Preserve the original intent, language, and domain
- Add a clear role definition (e.g., "You are a...")
- Structure with logical sections if the prompt is complex
- Add behavioral guidelines, constraints, and formatting rules where appropriate
- Make instructions specific and actionable
- Output ONLY the improved system prompt text — no explanations, commentary, or wrapping
- Do not use markdown code blocks around the output
- Match the language of the input (Chinese input → Chinese output, English → English)`,
    prompt: content
  })

  return { content: text }
})
