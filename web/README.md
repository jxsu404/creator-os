# Ideazo — app

De idea a listo para grabar. (Repo técnico: creator-os)

## Scripts

```bash
npm install
cp .env.example .env.local   # Gemini + Supabase (+ Stripe en prod)
npm run dev
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
| `/profile/validacion` | Gate Usuario 1 |

Ver raíz del repo: `LAUNCH.md`, `DEPLOY.md`, `GO_TO_MARKET.md`.
