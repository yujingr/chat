export function getValidPasswords(): string[] {
  const raw = process.env.USERPASSWORDS || ''
  return raw.split(',').map(p => p.trim()).filter(Boolean)
}

export function isValidPassword(password: string): boolean {
  return getValidPasswords().includes(password)
}

export async function passwordToUserId(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`pwd:${password}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
