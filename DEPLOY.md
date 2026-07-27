# Deploy — Ideazo en Vercel (con cuenta)

**Recomendación:** Vercel (hobby) + Next.js en `web/` + **Supabase Auth** (login obligatorio).

## Cómo funciona al entrar

1. El usuario abre tu URL → si no hay sesión, va a **`/login`**.
2. Entra con **Google** (recomendado) o email + código.
3. Sus ideas/perfil se sincronizan en Supabase (celular ↔ PC).
4. La IA usa tus API keys en Vercel (cuota compartida entre usuarios).

Sin las vars `NEXT_PUBLIC_SUPABASE_*`, la app deja pasar sin login. **Para exigir cuenta, esas dos vars deben estar en Vercel.**

---

## 1. Código en GitHub

Repo: https://github.com/jxsu404/creator-os · branch `main`.  
**Nunca** subas `.env.local`.

## 2. Supabase (una vez)

1. Proyecto en https://supabase.com (el tuyo ya existe si usabas sync local).
2. **SQL Editor** → pega y Run el contenido de `web/supabase/schema.sql`.
3. **Authentication → Providers**
   - **Google:** ON (Client ID / Secret de Google Cloud).
   - **Email:** ON (OTP / magic link) — útil de respaldo; puede rate-limitar.
4. **Authentication → URL Configuration**
   - **Site URL:** `https://TU-APP.vercel.app` (después del primer deploy; mientras tanto puedes poner `http://localhost:3000`).
   - **Redirect URLs** (todas las que uses):
     - `http://localhost:3000/auth/callback`
     - `https://TU-APP.vercel.app/auth/callback`
     - `https://TU-APP.vercel.app/auth/callback?**` (si el panel lo permite; si no, la exacta basta)
5. **Project Settings → API** → copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Google Cloud (para “Continuar con Google”)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. OAuth Client ID (Web).
3. Authorized redirect URIs debe incluir la de Supabase, tipo:  
   `https://TU-REF.supabase.co/auth/v1/callback`  
   (está en Supabase → Auth → Providers → Google).
4. Pega Client ID y Secret en Supabase → Google provider.

## 3. Proyecto en Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → importa `jxsu404/creator-os`.
2. **Root Directory = `web`** (Edit → `web`).
3. Framework: Next.js.
4. **Environment Variables** (Production + Preview + Development):

| Variable | ¿Obligatoria? |
|----------|----------------|
| `GEMINI_API_KEY` | Sí (o otra IA) |
| `GEMINI_MODEL` | No (`gemini-2.5-flash`) |
| `NEXT_PUBLIC_SUPABASE_URL` | **Sí** (para exigir cuenta) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Sí** (para exigir cuenta) |
| `XAI_API_KEY` / `GROQ_API_KEY` | No (failover) |
| `YOUTUBE_API_KEY` | No |

Puedes **importar tu `.env.local`** en el panel de Vercel (copiar valores). Incluye las dos de Supabase **sin** el `#`.

5. Deploy.

## 4. Después del primer deploy

1. Copia la URL `https://….vercel.app`.
2. En Supabase → URL Configuration: Site URL + Redirect con ese dominio (Paso 2.4).
3. Si cambiaste URLs o env: Vercel → Redeploy.

## 5. Probar

1. Abre la URL en incógnito → debe mandarte a **`/login`**.
2. **Continuar con Google** (preferido).
3. Onboarding → capturar idea → enfoques.

## Local

En `web/.env.local` las dos `NEXT_PUBLIC_SUPABASE_*` deben estar **descomentadas**. Reinicia `npm run dev`.

## Checklist

- [ ] Schema SQL corrido
- [ ] Google provider ON + redirect de Google Cloud correcto
- [ ] Redirect URLs localhost + Vercel
- [ ] Env en Vercel: Gemini + Supabase URL + anon key
- [ ] Root Directory = `web`
- [ ] Incógnito → `/login` → Google → app

## Notas

- Preferir **Google** frente a email OTP (menos rate limits).
- Si ves “rate limit” en email: espera o usa Google.
- Hobby Vercel + free Supabase alcanzan para early users.
