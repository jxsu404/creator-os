# Changelog

## Unreleased

- Docs: decisión de viabilidad — chat asistente + YouTube Analytics OAuth quedan en visión; memoria ligera priorizada; alineado a cupo free + donación PayPal (`BRAND_AND_ROADMAP.md` §6.1)
- CI en GitHub Actions (`lint` / `typecheck` / `test` + scan de conflict markers)
- Template de PR + reglas de agentes en `AGENTS.md`
- Plan Free endurecido (snapshot seguro + RLS billing); Validación Usuario 1 fuera de Perfil (diferida)
- Checkout Pro exige `SUPABASE_SERVICE_ROLE_KEY` (el cliente ya no puede auto-asignarse Pro)
- Medidor de plan por **usuario**: % gastado del cupo mensual, se actualiza al generar (y en Perfil)

## 1.6.0 — 2026-07-27

- Lanzamiento Ideazo: landing pública, `/pricing`, `/waitlist`, `/invite`
- Freemium: límites mensuales de IA + Ideazo Pro (Stripe Checkout/Portal/webhooks)
- Soft launch: `INVITE_ONLY`, códigos, waitlist, eventos de funnel
- Legal: `/terms` y `/privacy`
- Gate Usuario 1 in-app: Perfil → Validación (`/profile/validacion`)
- Docs: `LAUNCH.md`, `DEPLOY.md` actualizado

## Unreleased (previo)

- Marca pública: **Ideazo** (repo técnico sigue `creator-os`)
- Tagline de trabajo: *De idea a listo para grabar.*
- Ícono / favicon Ideazo + wordmark en login y header
- Ideas en Home/Ideas con **miniatura por categoría** (stock fijo; IA solo si el usuario la pide después)

## 0.1.1 — 2026-07-26

- IA: OpenAI → **Gemini** (stack gratis / AI Studio)
- Fix: “Marcar lista para grabar” redirige al Home
- Roadmap: n8n como posibilidad de automatización
- Mensajes de error de cuota Gemini más claros

## 0.1.0 — 2026-07-26

Primera versión pública (entonces llamada Creator OS; marca actual: Ideazo).

- Visión de producto, sistema, voz de marca, UX brief y roadmap
- App web (`web/`): onboarding de nicho → captura → 3 enfoques → borrador → lista para grabar
- Persistencia local (localStorage) + generación con API OpenAI-compatible
- Nombre de proyecto técnico: creator-os
