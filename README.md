# Nuxt AI Chatbot Template

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

Full-featured AI Chatbot Nuxt application with authentication, chat history, multiple pages, collapsible sidebar, keyboard shortcuts, light & dark mode, command palette and more. Built using [Nuxt UI](https://ui.nuxt.com) components and integrated with [AI SDK](https://ai-sdk.dev) for a complete chat experience.

- [Live demo](https://chat-template.nuxt.dev/)
- [Documentation](https://ui.nuxt.com/docs/getting-started/installation/nuxt)

<a href="https://chat-template.nuxt.dev/" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ui.nuxt.com/assets/templates/nuxt/chat-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://ui.nuxt.com/assets/templates/nuxt/chat-light.png">
    <img alt="Nuxt AI Chatbot Template" src="https://ui.nuxt.com/assets/templates/nuxt/chat-light.png">
  </picture>
</a>

## Features

- ⚡️ **Streaming AI messages** powered by the [AI SDK](https://ai-sdk.dev)
- 🤖 **Multiple model support** via various AI providers with built-in AI Gateway support
- 👤 **Anonymous session support** via [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (no login required)
- 💾 **Chat history persistence** using SQLite database (Turso in production) and [Drizzle ORM](https://orm.drizzle.team)
- 🚀 **Easy deploy** to Vercel with zero configuration

## Quick Start

```bash
npm create nuxt@latest -- -t ui/chat
```

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

Run database migrations:

```bash
pnpm db:migrate
```

### AI Integration

This template uses the [Vercel AI SDK](https://ai-sdk.dev/) for streaming AI responses with support for multiple providers through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).

Set your AI provider configuration in `.env`:

```bash
# AI Configuration via Vercel AI Gateway (unified API for all providers)
AI_GATEWAY_API_KEY=<your-vercel-ai-gateway-api-key>
```

> [!TIP]
> With Vercel AI Gateway, you don't need individual API keys for OpenAI, Anthropic, etc. The AI Gateway provides a unified API to access hundreds of models through a single endpoint with automatic load balancing, fallbacks, and spend monitoring.

### Session (Required)

This template keeps chat ownership scoped per visitor using [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) session IDs. No OAuth login is required.

```bash
NUXT_SESSION_PASSWORD=<your-password-minimum-32-characters>
```

### S3 Storage (Required for file uploads)

File uploads are stored in an S3-compatible bucket. Set:

```bash
NUXT_S3_ENDPOINT=<your-s3-endpoint>
NUXT_S3_REGION=auto
NUXT_S3_BUCKET=<your-bucket-name>
NUXT_S3_ACCESS_KEY_ID=<your-access-key-id>
NUXT_S3_SECRET_ACCESS_KEY=<your-secret-access-key>
```

## Development Server

Start the development server on `http://localhost:3004`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Renovate integration

Install [Renovate GitHub app](https://github.com/apps/renovate/installations/select_target) on your repository and you are good to go.
