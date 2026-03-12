import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { uploadChatFile } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { chatId } = await getValidatedRouterParams(event, z.object({
    chatId: z.string()
  }).parse)

  const userId = session.user?.id || session.id

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, chatId)
  })

  if (chat && chat.userId !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to upload files to this chat'
    })
  }

  const formData = await readMultipartFormData(event)
  const file = formData?.find(part => part.name === 'files' && part.filename)

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file found in upload request'
    })
  }

  const allowedTypes = FILE_UPLOAD_CONFIG.types as readonly string[]
  const isAllowedType = Boolean(
    file.type
    && (
      file.type.startsWith('image/')
      || allowedTypes.includes(file.type)
    )
  )

  if (!isAllowedType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported file type'
    })
  }

  const maxUploadSize = 8 * 1024 * 1024
  if (file.data.length > maxUploadSize) {
    throw createError({
      statusCode: 400,
      statusMessage: `File exceeds maximum size of ${FILE_UPLOAD_CONFIG.maxSize}`
    })
  }

  return await uploadChatFile(userId, chatId, file)
})
