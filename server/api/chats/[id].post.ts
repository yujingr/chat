import type { ToolSet, UIMessage } from 'ai'
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, generateText, smoothStream, stepCountIs, streamText } from 'ai'
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { anthropic, type AnthropicLanguageModelOptions } from '@ai-sdk/anthropic'
import { google, type GoogleLanguageModelOptions } from '@ai-sdk/google'
import { openai, type OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai'
import { MODELS } from '#shared/utils/models'
import { findGlobalPrompt } from '#shared/utils/prompts'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { model, messages } = await readValidatedBody(event, z.object({
    model: z.string().refine(value => MODELS.some(m => m.value === value), {
      message: 'Invalid model'
    }),
    messages: z.array(z.custom<UIMessage>())
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id as string),
      eq(schema.chats.userId, session.user?.id || session.id)
    ),
    with: {
      messages: true
    }
  })
  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  if (!chat.title) {
    const { text: title } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are a title generator for a chat:
          - Generate a short title based on the first user's message
          - The title should be less than 30 characters long
          - The title should be a summary of the user's message
          - Do not use quotes (' or ") or colons (:) or any other punctuation
          - Do not use markdown, just plain text`,
      prompt: JSON.stringify(messages[0])
    })

    await db.update(schema.chats).set({ title }).where(eq(schema.chats.id, id as string))
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user' && messages.length > 1) {
    await db.insert(schema.messages).values({
      chatId: id as string,
      role: 'user',
      parts: lastMessage.parts
    })
  }

  const chineseLanguageRule = `\n\n**语言规则（最高优先级，不可违反）：**\n你必须始终使用中文回复，无论用户使用什么语言提问。即使用户用英文、日文或其他语言发消息，你的回答也必须全部使用中文。唯一的例外是：代码、专有名词、品牌名称可以保留原文。这条规则优先于所有其他指令。`

  const defaultSystem = `你是一个博学且乐于助人的AI助手。你的目标是提供清晰、准确、结构合理的回答。用户的名字是玥玥，请在对话中自然地称呼她。

**格式规则（必须遵守）：**
- 绝对不要使用Markdown标题：不要用 #、##、###、####、#####、######
- 不要使用 === 或 --- 样式的标题
- 用**粗体文字**来强调和标注段落标签
- 所有回答直接以内容开始，不要以标题开头

**回答质量：**
- 简洁但全面
- 适当时使用例子说明
- 将复杂话题拆分为易于理解的部分
- 保持友好、专业的语气`

  let systemPrompt = defaultSystem
  if (chat.promptId) {
    const global = findGlobalPrompt(chat.promptId)
    if (global) {
      systemPrompt = global.content
    } else {
      const userPrompt = await db.query.prompts.findFirst({
        where: () => eq(schema.prompts.id, chat.promptId!)
      })
      if (userPrompt) {
        systemPrompt = userPrompt.content
      }
    }
  }

  const userContext = session.user?.name ? `\n用户的名字是玥玥。` : ''
  systemPrompt += chineseLanguageRule

  const provider = model.split('/')[0]

  const tools: ToolSet = { weather: weatherTool, chart: chartTool }
  if (provider === 'anthropic') {
    tools.web_search = anthropic.tools.webSearch_20250305()
  } else if (provider === 'openai') {
    tools.web_search = openai.tools.webSearch({})
  } else if (provider === 'google') {
    tools.google_search = google.tools.googleSearch({})
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model,
        system: systemPrompt + userContext,
        messages: await convertToModelMessages(messages),
        providerOptions: {
          anthropic: {
            thinking: {
              type: 'enabled',
              budgetTokens: 6144
            }
          } satisfies AnthropicLanguageModelOptions,
          google: {
            thinkingConfig: {
              includeThoughts: true,
              thinkingLevel: 'high'
            }
          } satisfies GoogleLanguageModelOptions,
          openai: {
            reasoningEffort: 'high',
            reasoningSummary: 'detailed'
          } satisfies OpenAILanguageModelResponsesOptions
        },
        stopWhen: stepCountIs(5),
        experimental_transform: smoothStream({ chunking: 'word' }),
        tools
      })

      if (!chat.title) {
        writer.write({
          type: 'data-chat-title',
          data: { message: 'Generating title...' },
          transient: true
        })
      }

      writer.merge(result.toUIMessageStream({
        sendReasoning: true
      }))
    },
    onFinish: async ({ messages }) => {
      await db.insert(schema.messages).values(messages.map(message => ({
        chatId: chat.id,
        role: message.role as 'user' | 'assistant',
        parts: message.parts
      })))
    }
  })

  return createUIMessageStreamResponse({
    stream
  })
})
