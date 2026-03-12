import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedBody(event, z.object({
    password: z.string().min(1)
  }).parse)

  if (!isValidPassword(password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  const userId = await passwordToUserId(password)

  await setUserSession(event, {
    user: {
      id: userId,
      name: 'User',
      provider: 'password'
    }
  })

  return { ok: true }
})
