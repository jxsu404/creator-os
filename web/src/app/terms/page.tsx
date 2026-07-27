import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export const metadata = {
  title: "Términos — Ideazo",
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <BrandMark href="/" />
        <Link href="/privacy" className="lp-nav-link">
          Privacidad
        </Link>
      </header>
      <article className="legal-body">
        <h1>Términos de uso</h1>
        <p className="muted">Última actualización: 27 de julio de 2026</p>
        <p>
          Ideazo es un compañero creativo web/PWA que ayuda a convertir ideas en
          guías listas para grabar contenido short-form. Al usar el servicio
          aceptas estos términos.
        </p>
        <h2>Cuenta</h2>
        <p>
          Debes autenticarte (p. ej. Google o email). Eres responsable de la
          actividad bajo tu cuenta.
        </p>
        <h2>Cupo y apoyo</h2>
        <p>
          Ideazo incluye un cupo mensual gratuito de generaciones con IA. Por
          ahora no hay suscripción de pago. Puedes apoyar el proyecto con una
          donación voluntaria (p. ej. PayPal) desde{" "}
          <Link href="/pricing">/pricing</Link>; las donaciones no desbloquean
          un plan Pro.
        </p>
        <h2>Contenido e IA</h2>
        <p>
          Conservas los derechos sobre tus ideas y borradores. Las propuestas de
          la IA son sugerencias: tú decides qué grabar y publicas bajo tu
          responsabilidad. No garantizamos resultados de audiencia ni
          viralidad.
        </p>
        <h2>Uso aceptable</h2>
        <p>
          No uses Ideazo para abuso de la API, spam, contenido ilegal o para
          eludir límites de plan. Podemos suspender cuentas que vulneren estos
          términos.
        </p>
        <h2>Disponibilidad</h2>
        <p>
          El servicio se ofrece “tal cual”. Puede haber interrupciones por
          mantenimiento, cuotas de proveedores de IA o fallos de terceros
          (Supabase, Vercel, proveedores de IA o PayPal).
        </p>
        <h2>Contacto</h2>
        <p>
          Para dudas de facturación o cuenta, responde desde el email de tu
          cuenta o el canal que indiquemos en la app.
        </p>
      </article>
    </div>
  );
}
