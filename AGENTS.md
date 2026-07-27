# AGENTS.md

## Cursor Cloud / agents

**Ideazo** (repo técnico `creator-os`) = una app Next.js 15 / React 19 en `web/`.  
El root solo tiene docs de producto (`*.md`) y config de agentes.

### Comandos (siempre desde `web/`)
| Acción | Comando |
|---|---|
| Dev | `npm run dev` (o `npm run dev:turbo`) |
| Verificar (antes de PR) | `npm run verify` → lint + typecheck + test |
| Build | `npm run build` |

Node: **20** (ver `.nvmrc`).

### Sin secretos
- Sin `.env.local` la app arranca: sin Supabase = open + `localStorage`.
- Generación IA (`/api/generate-*`) necesita al menos una key: `GEMINI_API_KEY`, `XAI_API_KEY` o `GROQ_API_KEY`.
- `GET /api/ai-status` dice qué providers hay.
- Onboarding + captura se prueban sin keys. El loop creativo completo sí necesita key.

---

## Cómo trabajar

### Regla de oro
**1 tarea = 1 agente = 1 branch = 1 PR.**

### Branch / PR
- Desde `main` fresco: `cursor/<short-kebab>-f7bf`
- PRs chicos; draft hasta `npm run verify` verde
- Nunca dejar marcadores de conflicto (`<<<<<<<` / `>>>>>>>`)
- Tras merge: esperar Vercel ✅ antes de decir “no está en prod”
- Assets estáticos: probar URL directa (ej. `/thumbs/gaming.png`)

### Prompt template
```
Objetivo: <un resultado concreto>
Área: <paths, ej. web/src/app/capture>
No tocar: <fuera de scope>
Hecho cuando: <checks de aceptación>
Base: main actualizado
Al final: commit + push + PR draft
```

### Flujo
1. **Plan** (solo lectura)
2. **Implement** (código + tests de esa tarea)
3. **Verify** (`cd web && npm run verify`)
4. **Ship** (commit, push, draft PR)

No dos agentes editando a la vez: `capture/page.tsx`, `AppShell.tsx`, `globals.css`, billing.

### Invariantes de producto (no reinventar)
- Loop: idea → 3 enfoques → guía (hook + guion + cierre) → listo para grabar
- **Sin tomas / plan de cámara / beats** en ideas nuevas (`beats: []` solo legacy)
- Copy en español natural; marca pública **Ideazo**; repo `creator-os`
- v1 no es dashboard, chat, calendario, editor de video ni analytics
- Rutas `/api/generate-*` nuevas deben llamar `gateAiGeneration`

### Docs (leer solo lo necesario)
| Doc | Para |
|---|---|
| `PRODUCT_SYSTEM.md` / `PRODUCT_VISION.md` | Loop y scope |
| `BRAND_VOICE.md` / `NAMING.md` | Copy + marca |
| `TECH.md` / `DEPLOY.md` | Stack, env, deploy |
| `LAUNCH.md` / `GO_TO_MARKET.md` | Launch / GTM |
| `VALIDATION_USER1.md` | Dogfood |

### Coste / IA
- No quemar quota: preferir assets fijos / cache
- Thumbs de categoría = `web/public/thumbs/` (no Gemini en capture)
- No pegarle a `/api/generate-*` salvo que la aceptación lo exija
- Free 15 / Pro 500 generaciones al mes — no inventar límites distintos

### CI
`.github/workflows/ci.yml`: `verify` + scan de conflict markers. Arreglar CI antes de pedir merge.
