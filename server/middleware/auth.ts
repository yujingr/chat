export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/') || path.startsWith('/api/auth/') || path.startsWith('/api/_')) {
    return
  }

  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
