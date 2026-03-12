# Reference

## Trigger Phrases

Use this skill when the request includes phrases like:

- "update chat stream route"
- "add a new AI tool"
- "change supported models"
- "Drizzle migration" or "schema update"
- "fix upload permissions" or "blob path"
- "GitHub OAuth/session issue"
- "NuxtHub db/blob config"
- "chat sidebar grouping/search"
- "add CSRF header for mutation"

## Important Repo Facts

- `pnpm dev` and `pnpm preview` run on port `3004` via `package.json`.
- README says development server is `http://localhost:3000`; treat scripts as source of truth.
- `hub.db` is configured for sqlite in `nuxt.config.ts`.
- `.env.example` includes `DATABASE_URL`; verify runtime target before making DB assumptions.

## Common Pitfalls

1. Updating model values in one place only.
2. Missing zod validation on new API parameters or request bodies.
3. Forgetting CSRF headers on mutating client requests.
4. Breaking ownership checks between anonymous and authenticated sessions.
5. Editing schema without generating/applying migrations.

## High-Value Files

- `server/api/chats/[id].post.ts`
- `server/api/chats.post.ts`
- `server/api/upload/[chatId].put.ts`
- `server/routes/auth/github.get.ts`
- `server/db/schema.ts`
- `shared/utils/models.ts`
- `shared/utils/tools/`
- `app/composables/useFileUpload.ts`
- `app/composables/useChats.ts`
