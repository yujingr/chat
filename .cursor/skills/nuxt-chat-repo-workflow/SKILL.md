---
name: nuxt-chat-repo-workflow
description: Guides development in this Nuxt AI chatbot repository, including AI SDK streaming routes, shared model catalog updates, tool wiring, Drizzle schema and migrations, GitHub OAuth session flows, and NuxtHub blob upload logic. Use when changing chat APIs, adding tools/models, updating database schema, auth, uploads, or running verification for this project.
---

# Nuxt Chat Repo Workflow

## Quick Start

Use this checklist first:

- [ ] Confirm required env values from `.env.example`
- [ ] Run `pnpm install`
- [ ] Run `pnpm dev` (project uses port 3004)
- [ ] After edits, run `pnpm lint`
- [ ] Run `pnpm typecheck`
- [ ] If schema changed, run `pnpm db:generate` and `pnpm db:migrate`

## Repo Map

- `app/`: pages, layouts, composables, UI components
- `server/api/`: chat and upload endpoints
- `server/routes/auth/`: GitHub OAuth callbacks
- `server/db/`: Drizzle schema and SQL migrations
- `shared/utils/`: shared model list, file config, tool definitions
- `shared/types/`: shared type augmentation for auth/db

## Project Guardrails

1. Keep model values centralized in `shared/utils/models.ts` and reuse that list in both UI and server validation.
2. Validate request params and bodies with zod in all server endpoints.
3. Preserve ownership checks in chat and upload flows (`session.id` for anonymous, `session.user.id` for authenticated).
4. Keep CSRF handling on client-side mutating API calls.
5. For schema updates, modify `server/db/schema.ts` first, then generate/apply migrations.

## Change Playbooks

## 1) Add or Update Models

1. Update model entries in `shared/utils/models.ts`.
2. Ensure UI selectors/composables still consume the shared list.
3. Keep route validation aligned in `server/api/chats/[id].post.ts`.
4. Verify provider options remain compatible with changed models.

## 2) Add a New AI Tool

1. Add the tool implementation in `shared/utils/tools/`.
2. Export it from `shared/utils/index.ts` if needed.
3. Register it in `server/api/chats/[id].post.ts` under `tools`.
4. Add or update frontend renderer(s) in `app/components/tool/`.
5. Verify tool output shape is serializable and stable.

## 3) Update Chat Streaming Behavior

1. Edit `server/api/chats/[id].post.ts`.
2. Keep `createUIMessageStream` and `onFinish` persistence behavior consistent.
3. Preserve chat ownership checks before streaming.
4. Confirm title generation and message insert flow still work for first and later messages.

## 4) Update Database Schema

1. Edit `server/db/schema.ts`.
2. Run `pnpm db:generate`.
3. Run `pnpm db:migrate`.
4. Review generated SQL in `server/db/migrations/sqlite/`.
5. Validate impacted API and shared types.

## 5) Update Auth or Session Logic

1. Adjust `server/routes/auth/github.get.ts` for OAuth behavior.
2. Maintain anonymous-to-auth chat migration expectations.
3. Keep user-session shape compatible with current UI usage.
4. Validate login, callback success, and logout flows manually.

## 6) Update Upload Flow

1. Modify `server/api/upload/[chatId].put.ts` and delete route as needed.
2. Keep file constraints aligned with `shared/utils/file.ts`.
3. Preserve permission checks and `blob` prefix conventions.
4. Validate upload and delete from authenticated UI paths.

## Verification Checklist

Run:

```bash
pnpm lint
pnpm typecheck
```

If DB changed:

```bash
pnpm db:generate
pnpm db:migrate
```

Manual smoke checks:

- Create a chat and send messages
- Reload and confirm chat history persists
- Switch models and confirm server accepts selection
- Upload and delete a file in a chat
- Login with GitHub and verify prior anonymous chats remain visible

## Response Format For Task Completion

When finishing work in this repo, report:

1. Files changed
2. Why each change was needed
3. Commands run and outcomes
4. Manual checks performed (or pending)

## Additional Reference

- See [reference.md](reference.md) for trigger phrases and repo-specific gotchas.
