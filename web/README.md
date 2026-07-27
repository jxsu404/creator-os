# Ideazo — app

De idea a listo para grabar. (Repo técnico: `creator-os`)

## Scripts

```bash
npm install
cp .env.example .env.local   # optional; AI keys for generate routes
npm run dev
npm run verify               # lint + typecheck + test
```

## Rutas clave

| Ruta | Qué es |
|---|---|
| `/` | Landing (sin sesión) o Home |
| `/login` | Auth |
| `/pricing` | Free vs Pro + Stripe |
| `/invite` | Soft launch |
| `/waitlist` | Lista de espera |
| `/terms` `/privacy` | Legal |

Ver raíz: `AGENTS.md`, `LAUNCH.md`, `DEPLOY.md`, `GO_TO_MARKET.md`.
