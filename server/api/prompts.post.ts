import { db, schema } from 'hub:db'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Login required to create prompts' })
  }

  const body = await readValidatedBody(event, z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    content: z.string().min(1).max(10000),
    icon: z.string().max(100).optional()
  }).parse)

  const [prompt] = await db.insert(schema.prompts).values({
    name: body.name,
    description: body.description ?? null,
    content: body.content,
    icon: body.icon ?? null,
    userId: session.user.id
  }).returning()

  if (!prompt) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create prompt' })
  }

  return prompt
})
