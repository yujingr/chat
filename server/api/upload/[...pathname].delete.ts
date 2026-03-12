import { z } from 'zod'
import { deleteStoredObject } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const ownerId = session.user?.id || session.id

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  if (!pathname.startsWith(`${ownerId}/`)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to delete this file'
    })
  }

  await deleteStoredObject(pathname)

  return sendNoContent(event)
})
