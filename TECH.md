# Tech — Creator OS (v1)

**Fecha:** 26 de julio de 2026  
**Nombre:** Creator OS (provisional)  
**Versión:** **0.1.0**  
**Fase:** Primer build para Usuario 1 (dogfooding)

---

## Stack v1 (decisión)

| Capa | Elección | Por qué |
|---|---|---|
| App | **Next.js** (App Router) + TypeScript | Web móvil-first rápida de iterar; una sola codebase |
| UI | React + CSS modules / CSS variables | Simple, sin design system pesado |
| Datos (fase dogfood) | **localStorage** + capa `storage` abstraída | Cero setup de DB para empezar a usar hoy; migrable |
| IA | API route server-side + **OpenAI-compatible** (`OPENAI_API_KEY` o compatible) | Generar 3 enfoques + borrador; clave solo en servidor |
| Auth | Ninguna en dogfood local | Un solo usuario (tú); añadir después si hace falta |
| Deploy | Vercel (cuando quieras usarlo en el teléfono) | HTTPS + PWA-friendly |

### Principios técnicos alineados al producto

1. El modelo de dominio refleja `PRODUCT_SYSTEM.md`: Idea, estados, direcciones, borrador, perfil.
2. La capa de storage es **interfaz** — hoy localStorage, mañana Supabase/DB sin reescribir el loop.
3. Prompts viven en servidor; el cliente no habla de “OS” ni de stack.
4. Voz, memoria de videos, YouTube largo, miniaturas: **hooks/extensiones previstas**, no implementadas.

## App

Código en **`web/`** (Next.js).

```bash
cd web
npm install
cp .env.example .env.local   # añade OPENAI_API_KEY
npm run dev
```


### Fuera de v1 tech (pero no descartado)

Ver `BRAND_AND_ROADMAP.md`: voz, memoria de piezas, YT largo, miniaturas, agente async, analytics, multi-red.

---

*Actualizar este doc solo cuando cambie una decisión de stack consciente.*
