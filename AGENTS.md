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

---

## How to work in this repo (agents + humans)

### Golden rule
**1 task = 1 agent = 1 branch = 1 PR.**  
Do not mix branding, capture UI, billing, and home redesign in the same run.

### Branch / PR hygiene
- Branch from latest `main`: `cursor/<short-kebab>-f7bf`
- Keep PRs small and reviewable
- Never leave Git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in committed files
- Prefer draft PRs until lint/test/typecheck are green
- After merge: wait for Vercel ✅ before claiming “it doesn’t show in prod”
- To verify static assets: hit the URL directly (e.g. `/thumbs/gaming.png`)

### Prompt template (copy/paste)
```
Objetivo: <one concrete outcome>
Área: <paths, e.g. web/src/app/capture>
No tocar: <out of scope>
Hecho cuando: <acceptance checks>
Base: main actualizado
Al final: commit + push + PR draft (usar el template)
```

### Recommended agent flow
1. **Plan** (read-only): files, risks, steps — no code
2. **Implement**: code + tests only for that task
3. **Verify**: `npm run lint && npm run typecheck && npm run test` in `web/`
4. **Ship**: commit, push, draft PR; merge only when CI + Vercel are green

Do not run two agents that edit the same hot files at once (`capture/page.tsx`, `AppShell.tsx`, `globals.css`, billing routes).

### Product docs (read before inventing)
| Doc | Use for |
|---|---|
| `PRODUCT_SYSTEM.md` / `PRODUCT_VISION.md` | Idea → directions → draft loop |
| `BRAND_VOICE.md` / `NAMING.md` | Copy + brand (Ideazo) |
| `TECH.md` / `DEPLOY.md` | Stack, env, deploy |
| `LAUNCH.md` / `GO_TO_MARKET.md` | Launch / GTM |
| `VALIDATION_USER1.md` | Dogfooding checklist |

### Cost / AI hygiene
- Prefer fixed assets or cached results over burning provider quota
- Category thumbnails are stock under `web/public/thumbs/` — do not auto-generate with Gemini on capture
- User-requested AI thumbnail can later set `idea.thumbnailUrl` and override stock

### CI
GitHub Actions (`.github/workflows/ci.yml`) runs on PRs to `main`:
`lint` → `typecheck` → `test` → conflict-marker scan.
Fix CI before asking for merge.
