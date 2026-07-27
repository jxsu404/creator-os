# Ideazo (`creator-os`)

Public product: **Ideazo** — from a vague idea to ready-to-record (short-form, Spanish-first).  
Technical repo name stays `creator-os`. The Next.js app lives in [`web/`](web/).

## Quick start

```bash
cd web
npm install
cp .env.example .env.local   # optional; app boots without it
npm run dev                  # http://localhost:3000
```

Without Supabase env vars the app runs open and stores ideas in `localStorage`.  
AI steps need at least one of `GEMINI_API_KEY`, `XAI_API_KEY`, `GROQ_API_KEY`.

## Verify before PR

```bash
cd web && npm run verify   # lint + typecheck + test
```

Node **20** (see `.nvmrc`).

## For agents (Cursor)

Start with [`AGENTS.md`](AGENTS.md). Product invariants also live in [`.cursor/rules/`](.cursor/rules/).

Key docs:

| Doc | Use |
|---|---|
| [`PRODUCT_SYSTEM.md`](PRODUCT_SYSTEM.md) | Loop + states |
| [`BRAND_VOICE.md`](BRAND_VOICE.md) / [`NAMING.md`](NAMING.md) | Copy + brand |
| [`TECH.md`](TECH.md) / [`DEPLOY.md`](DEPLOY.md) | Stack + Vercel/Supabase/Stripe |
| [`LAUNCH.md`](LAUNCH.md) | Go / no-go |

## Rule of thumb

**1 task = 1 branch = 1 PR.** Keep changes small; prefer draft until CI is green.
