# Deploy — Ideazo en Vercel (Web/PWA + Freemium Pro)

**Stack:** Vercel (hobby) + Next.js en `web/` + Supabase Auth + Stripe.

## Cómo funciona al entrar

1. El usuario abre tu URL → landing pública (sin sesión).
2. **Empezar / Entrar** → `/login` (Google recomendado).
3. Si `INVITE_ONLY=true`, pide código en `/invite` (seed: `IDEAZO-EARLY`).
4. Onboarding → captura → enfoques → guía.
5. Free tiene cupo mensual de IA; al agotarlo ve upgrade a Pro (`/pricing`).

Sin `NEXT_PUBLIC_SUPABASE_*`, la app deja pasar sin login (dogfood local).

Checklist operativa completa: [`LAUNCH.md`](../LAUNCH.md).

---

## 1. Código en GitHub

Repo: https://github.com/jxsu404/creator-os · branch `main`.  
**Nunca** subas `.env.local`.

## 2. Supabase (una vez)

1. Proyecto en https://supabase.com
2. **SQL Editor** → pega y Run el contenido de `web/supabase/schema.sql` (incluye billing, invites, waitlist, funnel).
3. **Authentication → Providers**
   - **Google:** ON
   - **Email:** ON (OTP) — respaldo
4. **Authentication → URL Configuration**
   - **Site URL:** dominio final (`https://ideazo.co` o `https://….vercel.app`)
   - **Redirect URLs:**
     - `http://localhost:3000/auth/callback`
     - `https://TU-DOMINIO/auth/callback`
5. **Project Settings → API** → copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (solo Vercel server)

### Google Cloud

Authorized redirect URI de Supabase:  
`https://TU-REF.supabase.co/auth/v1/callback`

## 3. Stripe (Ideazo Pro)

1. Dashboard Stripe → Product **Ideazo Pro**
2. Precios: mensual ($14) + anual ($119) — o los que elijas
3. Copia Price IDs → `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_YEARLY`
4. Developers → Webhooks → endpoint  
   `https://TU-DOMINIO/api/billing/webhook`  
   Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copia signing secret → `STRIPE_WEBHOOK_SECRET`
6. Secret key → `STRIPE_SECRET_KEY`
7. En Vercel: sin `STRIPE_*` el Free sigue funcionando; Pro muestra aviso hasta configurar Stripe + `SUPABASE_SERVICE_ROLE_KEY`.
8. Si ya corriste un schema viejo: vuelve a Run la sección billing de `schema.sql` (quita policies de write del cliente en `billing_subscriptions`).

## 4. Proyecto en Vercel

1. Importa `jxsu404/creator-os`
2. **Root Directory = `web`**
3. Framework: Next.js
4. Env (Production + Preview):

| Variable | Obligatoria |
|----------|-------------|
| `GEMINI_API_KEY` | Sí (o otra IA) |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí (cuentas) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (webhooks / billing) |
| `STRIPE_SECRET_KEY` | Sí para cobrar |
| `STRIPE_WEBHOOK_SECRET` | Sí para cobrar |
| `STRIPE_PRICE_PRO_MONTHLY` | Sí para cobrar |
| `STRIPE_PRICE_PRO_YEARLY` | Recomendada |
| `NEXT_PUBLIC_APP_URL` | Recomendada (dominio) |
| `INVITE_ONLY` | `true` en soft launch |
| `XAI_API_KEY` / `GROQ_API_KEY` | Failover |
| `YOUTUBE_API_KEY` | No |

5. Deploy.

## 5. Dominio

1. Compra candidato (`ideazo.co` / `getideazo.com` — ver `NAMING.md`)
2. Vercel → Domains → añade dominio
3. Actualiza Supabase Site URL + redirects + `NEXT_PUBLIC_APP_URL`
4. Redeploy

## 6. Probar

1. Incógnito → landing Ideazo
2. Entrar con Google
3. (Si invite-only) código `IDEAZO-EARLY`
4. Onboarding → idea → enfoques
5. `/pricing` → Checkout test mode
6. Webhook CLI local opcional: `stripe listen --forward-to localhost:3000/api/billing/webhook`

## Checklist

- [ ] Schema SQL corrido (billing + invites)
- [ ] Google OAuth + redirects
- [ ] Env Vercel: Gemini + Supabase + Stripe + service role
- [ ] Root Directory = `web`
- [ ] Landing → login → loop
- [ ] Paywall 402 → `/pricing`
- [ ] Webhook Stripe en verde

## Notas

- Preferir Google frente a email OTP.
- Hobby Vercel + free Supabase alcanzan early users; con Pro pagando, sube Gemini a plan de pago.
- Soft launch: `INVITE_ONLY=true` + waitlist en `/waitlist`.
