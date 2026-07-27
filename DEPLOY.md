# Deploy — Creator OS en Vercel

**Recomendación:** Vercel (gratis hobby) + Next.js en `web/`. Encaja con el stack y da HTTPS + dominio `*.vercel.app`.

## Qué consigue cualquiera al entrar

- Puede usar la app en el navegador (móvil o PC).
- Sus ideas/perfil viven en **su** navegador (`localStorage`), salvo que más adelante actives Supabase (cuenta + sync).
- La IA corre en el servidor con **tus** API keys (configuradas en Vercel). Todos los usuarios comparten esa cuota — vigila límites del free tier de Gemini/Groq.

## 1. Sube el código a GitHub

El repo ya es `https://github.com/jxsu404/creator-os`. Asegúrate de que `main` tiene el código actual (carpeta `web/` incluida). **Nunca** subas `.env.local`.

## 2. Crea el proyecto en Vercel

1. Entra en [vercel.com](https://vercel.com) → **Add New… → Project**.
2. Importa `jxsu404/creator-os`.
3. **Root Directory:** pulsa *Edit* → elige **`web`** (importante: la app no está en la raíz del repo).
4. Framework: Next.js (auto).
5. Build Command: `npm run build` · Output: default Next.js.
6. **Environment Variables** (Production + Preview):

| Variable | Obligatoria | Notas |
|----------|-------------|--------|
| `GEMINI_API_KEY` | Sí (o otra IA) | [AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | No | Default `gemini-2.5-flash` |
| `XAI_API_KEY` | No | Failover Grok |
| `GROQ_API_KEY` | No | Failover Groq |
| `YOUTUBE_API_KEY` | No | Solo si usas YouTube en la app |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Solo si quieres cuentas |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Solo si quieres cuentas |

**Primera versión pública recomendada:** solo `GEMINI_API_KEY` (y opcional failover). **Sin** Supabase → cualquiera entra sin login.

7. Deploy.

## 3. URL pública

Tras el deploy tendrás algo como `https://creator-os-xxx.vercel.app`.  
Opcional: Domains → dominio propio.

## 4. Si más adelante activas Supabase (cuentas)

En Supabase → Authentication → URL Configuration:

- **Site URL:** `https://tu-dominio.vercel.app`
- **Redirect URLs:** `https://tu-dominio.vercel.app/auth/callback`

Y añade las dos `NEXT_PUBLIC_SUPABASE_*` en Vercel → Redeploy.

Con Supabase configurado, la app **exige login** (Google/email). Sin esas vars, funciona en modo invitado.

## 5. CLI (alternativa)

Desde la carpeta `web/`:

```bash
npm i -g vercel
vercel login
vercel          # preview
vercel --prod   # producción
```

La primera vez, cuando pregunte Root Directory / dónde está el proyecto, apunta a `web` o ejecuta los comandos ya dentro de `web/`.

## Checklist pre-deploy

- [ ] `cd web && npm run build` pasa en local
- [ ] Keys solo en Vercel Env, no en el repo
- [ ] Root Directory = `web`
- [ ] Prueba el loop: onboarding → capturar → enfoques → guía en la URL de Vercel

## Límites a tener en cuenta

- Cuota compartida de IA entre todos los visitantes.
- Sin Supabase: si el usuario limpia datos del navegador, pierde ideas.
- Hobby de Vercel tiene límites de serverless; para dogfood / early users suele bastar.
