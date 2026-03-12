import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { GLOBAL_PROMPTS } from '#shared/utils/prompts'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const globalEntries = GLOBAL_PROMPTS.map(p => ({
    ...p,
    userId: null,
    createdAt: null,
    updatedAt: null
  }))

  if (!session.user?.id) {
    return globalEntries
  }

  const userPrompts = await db.query.prompts.findMany({
    where: () => eq(schema.prompts.userId, session.user!.id),
    orderBy: (p, { desc }) => desc(p.createdAt)
  })

  const userEntries = userPrompts.map(p => ({
    ...p,
    isGlobal: false as const
  }))

  return [...globalEntries, ...userEntries]
})
