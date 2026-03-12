import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { deleteObjectsByPrefix, getChatStoragePrefix } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(eq(schema.chats.id, id as string), eq(schema.chats.userId, session.user?.id || session.id))
  })

  if (!chat) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Chat not found'
    })
  }

  const ownerId = session.user?.id || session.id
  const chatFolder = `${getChatStoragePrefix(ownerId, id as string)}/`

  try {
    await deleteObjectsByPrefix(chatFolder)
  } catch (error) {
    console.error('Failed to list/delete chat files:', error)
  }

  return await db.delete(schema.chats)
    .where(and(eq(schema.chats.id, id as string), eq(schema.chats.userId, session.user?.id || session.id)))
    .returning()
})
