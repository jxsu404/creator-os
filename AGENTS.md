# AGENTS.md

## Cursor Cloud specific instructions

Ideazo (repo `creator-os`) is a single Next.js 15 / React 19 app. All app code lives in `web/`; the repo root only holds product docs (`*.md`).

### Where to run commands
Run everything from `web/` (not the repo root). Standard scripts are in `web/package.json`:
- Dev server: `npm run dev` (serves on port 3000; `next dev`). Use `npm run dev:turbo` for Turbopack.
- Lint: `npm run lint` — Test: `npm run test` (Vitest) — Typecheck: `npm run typecheck` — Build: `npm run build`.

### Env vars / running without secrets
- No `.env.local` is required to boot the app. Setup is manual (see `web/README.md` / `DEPLOY.md`); there are no setup scripts, Docker, or a local Supabase.
- Without `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, there is no login/auth: the app runs open and persists ideas/profile in the browser `localStorage`. With those vars set, `/login` is enforced and API routes return 401 without a session.
- AI generation endpoints (`/api/generate-*`) require at least one AI provider key (`GEMINI_API_KEY`, `XAI_API_KEY`, or `GROQ_API_KEY`). Without a key the app still loads and the capture/onboarding flow works, but the "generate 3 directions / draft" steps return an error. `GET /api/ai-status` reports which providers are configured.

### Testing note
The core creative loop (idea → 3 directions → draft) needs an AI key to run end to end. The onboarding + idea-capture flow can be fully exercised with no secrets since it is localStorage-backed.
