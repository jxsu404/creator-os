/** Frases del día — tono creador, sin cliché vacío */
export const DAILY_QUOTES = [
  "Una idea clara vale más que diez borradores a medias.",
  "Graba lo que ya entiendes. El resto se aclara al editar.",
  "El hook no es clickbait: es una promesa que sí vas a cumplir.",
  "Hoy basta con una pieza. Consistencia > intensidad.",
  "Si no cabe en 45 segundos, aún no está listo para Short.",
  "Tu audiencia no necesita perfect; necesita útil y ahora.",
  "Captura primero. Decide el ángulo después.",
  "El update del juego es contenido. No lo dejes solo en Discord.",
  "Tres enfoques distintos > un guion forzado.",
  "Si te trabas, baja el scope: un tip, un error, un poder.",
  "La comunidad recuerda quién llegó primero al meta.",
  "Termina la guía. Publicar imperfecto enseña más que pulir eterno.",
];

export const HOME_TIPS = [
  {
    title: "Captura en caliente",
    body: "Cuando se te ocurra algo in-game, guárdalo ya. El ángulo se elige después.",
  },
  {
    title: "Elige un enfoque",
    body: "Tres direcciones distintas. Quédate con una y deja el resto.",
  },
  {
    title: "Update fresco",
    body: "Pega el anuncio en Juegos. La IA deja de inventar patch notes.",
  },
  {
    title: "Short = una idea",
    body: "Un tip, un ranking beat, un error. No metas el long-form entero.",
  },
  {
    title: "CTA con sentido",
    body: "Crimson Core cuando el video pide comunidad o farm en grupo.",
  },
];

export function quoteForToday(date = new Date()): string {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % DAILY_QUOTES.length;
  return DAILY_QUOTES[hash];
}

export function tipsForToday(count = 3, date = new Date()) {
  const start = date.getDate() % HOME_TIPS.length;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(HOME_TIPS[(start + i) % HOME_TIPS.length]);
  }
  return out;
}
