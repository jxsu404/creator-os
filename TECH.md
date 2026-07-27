# Tech — Ideazo (v1)

**Fecha:** 27 de julio de 2026  
**Nombre de marca:** Ideazo  
**Repo técnico:** creator-os  
**Versión:** **1.6.0**  
**Fase:** Lanzamiento Web/PWA + freemium Pro

---

## Stack v1 (decisión)

| Capa | Elección | Por qué |
|---|---|---|
| App | **Next.js** (App Router) + TypeScript | Web móvil-first / PWA; una sola codebase |
| UI | React + CSS modules / CSS variables | Simple, sin design system pesado |
| Datos | **Supabase** (auth + sync) + localStorage abstraído | Cuenta + celular ↔ PC |
| IA | **Google Gemini** (+ failover Grok/Groq) | Dogfood barato; keys de pago al monetizar |
| Billing | **Stripe** Checkout + Portal + webhooks | Free (15 gen/mes) / Pro |
| Deploy | **Vercel** — Root Directory `web/` | Ver `DEPLOY.md` + `LAUNCH.md` |

### Principio de coste

> Dogfooding gratis → con Pro pagando, API keys de pago + límites por usuario (no solo cuota compartida).

### Principios técnicos alineados al producto

1. Dominio refleja `PRODUCT_SYSTEM.md`.
2. Storage es interfaz migrable.
3. Prompts en servidor; cupos de IA enforced en API (`gateAiGeneration`).
4. Soft launch: `INVITE_ONLY` + `invite_codes`.

## App

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

**Producción:** `DEPLOY.md`. Checklist go-to-market: `LAUNCH.md` · `GO_TO_MARKET.md`.

---

*Actualizar este doc solo cuando cambie una decisión de stack consciente.*
