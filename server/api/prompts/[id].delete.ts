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
    throw createError({ statusCode: 403, statusMessage: 'Global prompts cannot be deleted' })
  }

  const existing = await db.query.prompts.findFirst({
    where: () => and(
      eq(schema.prompts.id, id),
      eq(schema.prompts.userId, session.user!.id)
    )
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Prompt not found' })
  }

  await db.update(schema.chats)
    .set({ promptId: null })
    .where(eq(schema.chats.promptId, id))

  await db.delete(schema.prompts).where(eq(schema.prompts.id, id))

  return { success: true }
})
