# Tech — Ideazo (v1)

**Fecha:** 27 de julio de 2026  
**Nombre de marca:** Ideazo  
**Repo técnico:** creator-os  
**Versión:** **0.1.1**  
**Fase:** App pública en Vercel (cuentas por usuario)

---

## Stack v1 (decisión)

| Capa | Elección | Por qué |
|---|---|---|
| App | **Next.js** (App Router) + TypeScript | Web móvil-first rápida de iterar; una sola codebase |
| UI | React + CSS modules / CSS variables | Simple, sin design system pesado |
| Datos | **localStorage** + sync opcional Supabase | Empieza simple; migrable |
| IA | **Google Gemini** (+ failover) | Cuota compartida del plan; vigilar límites |
| Auth | Supabase (Google / email) cuando está configurado | Cada cuenta con su workspace |
| Deploy | **Vercel** — ver `DEPLOY.md` | HTTPS + URL pública; Root Directory = `web/` |

### Principio de coste

> Stack base = **gratis**: localStorage (o Supabase free), Next.js / Vercel hobby, Gemini free tier.  
> Los free tiers tienen límites de ritmo; en producción **todos los visitantes comparten** las API keys del proyecto — vigila cuotas.

### Principios técnicos alineados al producto

1. El modelo de dominio refleja `PRODUCT_SYSTEM.md`: Idea, estados, direcciones, borrador, perfil.
2. La capa de storage es **interfaz** — hoy localStorage (+ sync opcional Supabase), migrable.
3. Prompts viven en servidor; el cliente no habla de “OS” ni de stack.
4. Voz, memoria de videos, YouTube largo, miniaturas: **hooks/extensiones previstas**, no el núcleo del loop.

## App

Código en **`web/`** (Next.js).

```bash
cd web
npm install
cp .env.example .env.local   # añade GEMINI_API_KEY (gratis en aistudio.google.com)
npm run dev
```

**Producción:** `DEPLOY.md` (Vercel, Root Directory `web`, env vars).

### Fuera de v1 tech (pero no descartado)

Ver `BRAND_AND_ROADMAP.md`: voz, memoria de piezas, YT largo, miniaturas, agente async, analytics, multi-red, **n8n como capa de automatización** (self-host / webhooks; no UI del loop creativo).

**Decisión:** n8n **no** entra en v0.1. Posibilidad fuerte para pipelines post–listo-para-grabar y orquestación futura.

---

*Actualizar este doc solo cuando cambie una decisión de stack consciente.*
