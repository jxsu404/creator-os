# Lanzamiento — Ideazo (Web/PWA)

**Fecha:** 27 de julio de 2026  
**Canal:** Web / PWA móvil-first  
**Monetización:** Free (límites IA) + donaciones PayPal (sin suscripción)

Este doc es la checklist operativa de go/no-go. El detalle de dogfooding vive en `VALIDATION_USER1.md`.

---

## Fase 0 — Gate Usuario 1

Rellenar aquí (la UI in-app de Validación está diferida):

| Criterio | Sí / No |
|---|---|
| 1 Capturé ideas en contexto real varias veces | |
| 2 Las 3 direcciones aceleran la decisión vs chat en blanco | |
| 3 ≥3 videos salieron de un borrador de Ideazo | |
| 4 Tiempo idea → claridad grabable bajó | |
| 5 El nicho se nota en los enfoques | |
| 6 Abrí Ideazo por costumbre | |
| 7 Fricción restante tolerable | |
| 8 Lo recomendaría a un creador amigo (sin vender vapor) | |

**Barra go:** ≥6/8 en Sí, **incluyendo #3 y #6**.

- [ ] Go
- [ ] Iterate (anotar fricciones)
- [ ] No-go / replantear wedge

---

## Fase 1 — Presentable (producto)

- [x] Marca pública Ideazo en UI / PWA / docs
- [x] Landing pública con Free + apoyo
- [ ] Dominio custom apuntado a Vercel (ej. `ideazo.co` — ver `NAMING.md`)
- [x] Hint “Añadir a inicio” / instalar PWA en Perfil
- [ ] Checklist `DEPLOY.md` en verde (Supabase + Vercel + OAuth)

---

## Fase 2 — Monetización

- [x] Schema usage (`web/supabase/schema.sql`)
- [x] Enforcement de límites en APIs de IA
- [x] Donaciones PayPal (`/pricing`, paywall, Perfil)
- [ ] `NEXT_PUBLIC_PAYPAL_DONATE_URL` en Vercel si quieres override del default

**Límites por defecto**

| Plan | Generaciones IA / mes | Precio |
|---|---|---|
| Free | 15 | $0 |
| Donación | — | Voluntaria (PayPal) |

---

## Fase 3 — Soft launch

- [x] Modo invite-only (`INVITE_ONLY=true` + códigos en Supabase)
- [x] Waitlist (`/waitlist`)
- [x] Eventos de funnel (`/api/metrics/event`)
- [ ] 5–10 creadores invitados
- [ ] Revisar conversión Free → hit limit → donación

---

## Fase 4 — Público

- [x] `/terms` y `/privacy`
- [x] Landing + pricing vivos
- [ ] Dominio + legal revisados
- [ ] Primer post orgánico (TikTok/Shorts mostrando idea → lista)
- [ ] Objetivo: primeras donaciones o evidencia clara de willingness-to-pay

---

## Orden de trabajo del fundador

1. Correr SQL actualizado en Supabase  
2. Confirmar link PayPal + service role en Vercel  
3. Completar checklist Usuario 1  
4. Soft launch con 5–10 invites  
5. Comprar dominio y abrir público  

*No bloquear el build técnico por el dogfooding: se hace en paralelo.*
