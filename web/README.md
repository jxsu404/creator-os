# Ideazo — app

De idea a listo para grabar. (Repo técnico: creator-os)

## Setup local

```bash
cd web
npm install
cp .env.example .env.local
# Edita .env.local → GEMINI_API_KEY (gratis: https://aistudio.google.com/apikey)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Sin Supabase, los datos viven en **localStorage** del navegador.

## Deploy público (Vercel)

Ver guía completa: [`../DEPLOY.md`](../DEPLOY.md).

Resumen:

1. Importa el repo en [Vercel](https://vercel.com).
2. **Root Directory = `web`**.
3. Env: `GEMINI_API_KEY` (mínimo).
4. Deploy → URL pública `*.vercel.app`.

Sin vars de Supabase, cualquiera puede usarla sin cuenta.

## Docs de producto (carpeta padre)

- `PRODUCT_VISION.md`
- `PRODUCT_SYSTEM.md`
- `UX_BRIEF.md`
- `TECH.md`
- `DEPLOY.md`
