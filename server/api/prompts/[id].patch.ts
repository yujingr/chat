import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Login required' })
  }

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  if (id.startsWith('global-')) {
    throw createError({ statusCode: 403, statusMessage: 'Global prompts cannot be modified' })
  }

  const body = await readValidatedBody(event, z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    content: z.string().min(1).max(10000).optional(),
    icon: z.string().max(100).nullable().optional()
  }).parse)

  const existing = await db.query.prompts.findFirst({
    where: () => and(
      eq(schema.prompts.id, id),
      eq(schema.prompts.userId, session.user!.id)
    )
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Prompt not found' })
  }

  const [updated] = await db.update(schema.prompts)
    .set({
      ...body,
      updatedAt: new Date()
    })
    .where(eq(schema.prompts.id, id))
    .returning()

  return updated
})
