import { APP_VERSION } from "@/lib/app-version";

export type ReleaseNotes = {
  version: string;
  date: string;
  title?: string;
  highlights: string[];
};

/**
 * Historial humano para Perfil → Historial de versiones.
 * Al publicar: añadir entrada arriba + bump package.json + CHANGELOG.md.
 */
export const RELEASES: ReleaseNotes[] = [
  {
    version: "2.0.0",
    date: "2026-07-27",
    title: "Miniaturas IA",
    highlights: [
      "Generar miniatura con IA desde la idea de miniatura del paquete YouTube/TikTok",
      "La imagen se guarda en la idea y aparece en Inicio / Ideas",
      "Usa Grok Imagine o Gemini Imagen (misma cuota de generación)",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-07-27",
    title: "Estable",
    highlights: [
      "Versión visible en Perfil e historial de cambios en la app",
      "Ajustes: apariencia (claro / oscuro / sistema), idioma y reducir movimiento",
      "Tema claro y oscuro con la misma marca Ideazo",
      "Interfaz en español o inglés (la IA sigue en español)",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-07-27",
    title: "Lanzamiento Ideazo",
    highlights: [
      "Landing pública, precios, waitlist e invitaciones",
      "Límites mensuales de IA y apoyo con PayPal",
      "Legal: términos y privacidad",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-07-26",
    highlights: [
      "IA con Gemini (y failover a Grok / Groq)",
      "“Marcar lista para grabar” vuelve al Home",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-26",
    title: "Primera versión",
    highlights: [
      "Loop idea → 3 enfoques → guía → listo para grabar",
      "Onboarding de nicho y captura rápida",
    ],
  },
];

export function currentRelease(): ReleaseNotes {
  return (
    RELEASES.find((r) => r.version === APP_VERSION) ?? {
      version: APP_VERSION,
      date: "",
      highlights: [],
    }
  );
}
