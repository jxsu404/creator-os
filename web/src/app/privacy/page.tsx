import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export const metadata = {
  title: "Privacidad — Ideazo",
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <BrandMark href="/" />
        <Link href="/terms" className="lp-nav-link">
          Términos
        </Link>
      </header>
      <article className="legal-body">
        <h1>Privacidad</h1>
        <p className="muted">Última actualización: 27 de julio de 2026</p>
        <p>
          Esta política describe qué datos trata Ideazo para operar la app
          web/PWA y cómo los usamos.
        </p>
        <h2>Datos que tratamos</h2>
        <ul>
          <li>
            <strong>Cuenta:</strong> email e identificadores de Auth (Supabase /
            Google).
          </li>
          <li>
            <strong>Contenido creativo:</strong> ideas, enfoques, borradores y
            perfil de nicho que guardas en la app.
          </li>
          <li>
            <strong>Uso / facturación:</strong> contadores de generaciones,
            plan, IDs de Stripe necesarios para cobrar Pro.
          </li>
          <li>
            <strong>Técnicos:</strong> logs de error, eventos de funnel
            agregables (p. ej. onboarding, upgrade).
          </li>
        </ul>
        <h2>Para qué</h2>
        <p>
          Prestar el servicio (sync, IA, límites de plan), mejorar el producto y
          gestionar suscripciones. No vendemos tus ideas a terceros.
        </p>
        <h2>Proveedores</h2>
        <p>
          Usamos proveedores de infraestructura: Vercel (hosting), Supabase
          (auth/base de datos), Stripe (pagos) y APIs de modelos de IA (p. ej.
          Google Gemini y failovers configurados). Cada uno trata datos según
          su propio encargo y ubicación.
        </p>
        <h2>Retención y derechos</h2>
        <p>
          Puedes solicitar acceso o borrado de tu cuenta contactándonos con el
          email registrado. Al borrar la cuenta eliminamos perfil e ideas
          asociadas en un plazo razonable, salvo obligaciones legales o de
          facturación.
        </p>
        <h2>Cookies</h2>
        <p>
          Usamos cookies/sesión necesarias para autenticación. No usamos redes
          de publicidad de terceros en el núcleo del producto.
        </p>
      </article>
    </div>
  );
}
