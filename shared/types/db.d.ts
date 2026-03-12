import type { chats, messages, prompts } from 'hub:db:schema'

export type Chat = typeof chats.$inferSelect
export type Message = typeof messages.$inferSelect
export type Prompt = typeof prompts.$inferSelect
