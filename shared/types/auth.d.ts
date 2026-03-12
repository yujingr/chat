declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    provider: 'password'
  }
}

export {}
