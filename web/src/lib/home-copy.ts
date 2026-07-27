/** Copy de Home: frase + consejos según nicho, estables por sesión de navegador. */

export type HomeTip = {
  title: string;
  body: string;
};

const SESSION_SEED_KEY = "creatoros_home_copy_seed_v1";

const GENERAL_QUOTES = [
  "Una idea clara vale más que diez borradores a medias.",
  "Graba lo que ya entiendes. El resto se aclara al editar.",
  "El hook no es clickbait: es una promesa que sí vas a cumplir.",
  "Hoy basta con una pieza. Consistencia > intensidad.",
  "Si no cabe en 45 segundos, aún no está listo para short.",
  "Tu audiencia no necesita perfect; necesita útil y ahora.",
  "Captura primero. Decide el ángulo después.",
  "Tres enfoques distintos > un guion forzado.",
  "Si te trabas, baja el scope: una idea, un tip, un momento.",
  "Termina la guía. Publicar imperfecto enseña más que pulir eterno.",
  "Tu nicho no es una jaula: es el filtro que hace memorable tu voz.",
  "Menos opciones. Más claridad. Mejor pieza.",
];

const GENERAL_TIPS: HomeTip[] = [
  {
    title: "Captura en caliente",
    body: "Cuando se te ocurra algo, guárdalo ya. El ángulo se elige después.",
  },
  {
    title: "Elige un enfoque",
    body: "Tres direcciones distintas. Quédate con una y deja el resto.",
  },
  {
    title: "Short = una idea",
    body: "Un tip, un error, un momento. No metas el long-form entero.",
  },
  {
    title: "Hook con promesa",
    body: "Di en la primera frase qué se lleva quien se queda.",
  },
  {
    title: "Cierra con CTA útil",
    body: "Pide lo que el video ya mereció: seguir, comentar o probarlo.",
  },
];

/** Quotes extra por nicho (se suman al pool general). */
const NICHE_QUOTES: Record<string, string[]> = {
  Gaming: [
    "El update del juego es contenido. No lo dejes solo en el chat.",
    "La comunidad recuerda quién llegó primero al meta.",
    "Enseña el porqué del move, no solo el highlight.",
    "Si el clip emociona sin contexto, súmale una línea de setup.",
  ],
  Roblox: [
    "Un tip de farm claro > una explicación eterna del mapa.",
    "Si el update cambió el meta, tu short ya tiene gancho.",
    "Muestra el error típico y la fix en el mismo take.",
    "Habla el idioma del juego: términos reales, sin inventar.",
  ],
  Guías: [
    "Una guía corta gana si alguien puede hacer el paso 1 ya.",
    "Empieza por el resultado, luego el cómo.",
    "Si hay 7 pasos, el short solo necesita los 3 que fallan.",
    "Quita el relleno: cada segundo debe mover al viewer.",
  ],
  Showcases: [
    "Enseña el antes/después o el detalle que nadie nota.",
    "Un showcase sin ángulo es solo un tour. Elige el wow.",
    "Pausa en el momento clave; no lo corras entero.",
    "Cuenta qué sentiste al lograrlo — eso vende la escena.",
  ],
  Opiniones: [
    "Opina con evidencia: un ejemplo > mil adjetivos.",
    "Di tu take en la primera línea; defiende después.",
    "Una opinión clara invita comentario. Una tibia, scroll.",
    "Respeta al viewer: no insultes para parecer intenso.",
  ],
  Vlogs: [
    "Un vlog short necesita un hilo: un día, una decisión, un cambio.",
    "Recorta lo rutinario; deja la escena que cambia el ánimo.",
    "Tu cara y tu voz son el producto. No las escondas.",
    "Empieza in media res: ya estás en la escena interesante.",
  ],
  Fitness: [
    "Una forma correcta en 40s enseña más que un montage largo.",
    "Di el error común antes de la corrección.",
    "Cuenta series/reps solo si alguien puede aplicarlas hoy.",
    "Motivación sin técnica se olvida; técnica con punch se guarda.",
  ],
  Cocina: [
    "Muestra el truco que cambia el plato, no toda la receta.",
    "El short gana con textura, sizzle y un tip concreto.",
    "Di tiempos y cantidades solo de lo esencial.",
    "Cierra con el bocado o el plato terminado: payoff visual.",
  ],
  Finanzas: [
    "Un número concreto > un consejo vago de “sé disciplinado”.",
    "Explica el riesgo en una línea. Genera confianza.",
    "Empieza por el error típico; luego la fix simple.",
    "No prometas riqueza. Promete claridad accionable.",
  ],
  Educación: [
    "Enseña una cosa. Si cabe otra, es otro video.",
    "Usa un ejemplo que el viewer pueda repetir hoy.",
    "La analogía corta abre la puerta; el detalle la cierra.",
    "Pregunta al inicio qué van a poder hacer al final.",
  ],
  Tech: [
    "Demo > discurso. Que se vea el click que resuelve.",
    "Nombra la versión/tool; evita tips que ya no aplican.",
    "Un workflow de 3 pasos vence a un review infinito.",
    "Si hay atajo, enseña el atajo primero.",
  ],
  Comedia: [
    "El setup corto hace más grande el punchline.",
    "Una regla: una idea cómica por short.",
    "Graba la reacción real; a veces es más fuerte que el gag.",
    "Edita el silencio: el timing es el chiste.",
  ],
  Lifestyle: [
    "Muestra el ritual, no el highlight reel vacío.",
    "Un cambio pequeño y real conecta más que un speech.",
    "Cuenta el porqué detrás del hábito.",
    "Luz, detalle y una frase honesta: suficiente.",
  ],
  Belleza: [
    "Un tip de producto o técnica > un haul sin criterio.",
    "Close-up del resultado: ahí está el gancho.",
    "Di para quién funciona y para quién no.",
    "Antes/después solo si el cambio se entiende en un glance.",
  ],
  Negocios: [
    "Una lección de esta semana > teoría de manual.",
    "Cuenta el número o la decisión, no solo la vibe.",
    "El error caro enseña más que el win editado.",
    "Termina con una acción que quepa en hoy.",
  ],
};

const NICHE_TIPS: Record<string, HomeTip[]> = {
  Gaming: [
    {
      title: "Update fresco",
      body: "Si hay parche, captura el cambio ya. El short se escribe solo.",
    },
    {
      title: "Un move, un short",
      body: "Enseña una jugada o un error. Deja el ranking largo para otro día.",
    },
  ],
  Roblox: [
    {
      title: "Vocabulario real",
      body: "Usa términos del juego. Si no estás seguro, anótalos en Juegos.",
    },
    {
      title: "Farm útil",
      body: "Un tip de progreso claro retiene más que un showcase eterno.",
    },
  ],
  Guías: [
    {
      title: "Resultado primero",
      body: "Abre con lo que lograrán. Luego el paso más fácil de empezar.",
    },
  ],
  Showcases: [
    {
      title: "El momento wow",
      body: "Recorta hasta el detalle que justifica quedarse a ver.",
    },
  ],
  Opiniones: [
    {
      title: "Take + prueba",
      body: "Di tu postura y apóyala con un ejemplo concreto en pantalla.",
    },
  ],
  Vlogs: [
    {
      title: "Un hilo",
      body: "Elige una emoción o decisión del día. Eso es el short.",
    },
  ],
  Fitness: [
    {
      title: "Forma > ego",
      body: "Corrige un error común. El viewer siente progreso inmediato.",
    },
  ],
  Cocina: [
    {
      title: "El truco del plato",
      body: "Enseña el gesto que cambia sabor o textura, no toda la receta.",
    },
  ],
  Finanzas: [
    {
      title: "Un número",
      body: "Ancla el tip a una cifra o regla simple que se pueda aplicar.",
    },
  ],
  Educación: [
    {
      title: "Una micro-lección",
      body: "Define qué sabrán hacer al final. Todo lo demás sobra.",
    },
  ],
  Tech: [
    {
      title: "Demo rápida",
      body: "Muestra el click o atajo. Narración corta encima.",
    },
  ],
  Comedia: [
    {
      title: "Timing",
      body: "Graba de más y corta al golpe. El silencio también es chiste.",
    },
  ],
  Lifestyle: [
    {
      title: "Ritual real",
      body: "Enseña el hábito con honestidad. Menos pose, más proceso.",
    },
  ],
  Belleza: [
    {
      title: "Close-up útil",
      body: "Enfoca la técnica o el finish. El resto es ruido.",
    },
  ],
  Negocios: [
    {
      title: "Lección de esta semana",
      body: "Cuenta una decisión real y qué harías distinto.",
    },
  ],
};

function normalizeNiche(niche: string): string {
  const t = niche.trim();
  if (!t) return "";
  const found = Object.keys(NICHE_QUOTES).find(
    (k) => k.toLowerCase() === t.toLowerCase()
  );
  return found || t;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed estable por pestaña/sesión; cambia al reabrir la app. */
export function getHomeCopySessionSeed(): number {
  if (typeof window === "undefined") return 1;
  try {
    const existing = sessionStorage.getItem(SESSION_SEED_KEY);
    if (existing) {
      const n = Number(existing);
      if (Number.isFinite(n)) return n;
    }
    const next =
      (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0 || 1;
    sessionStorage.setItem(SESSION_SEED_KEY, String(next));
    return next;
  } catch {
    return (Date.now() ^ 0x9e3779b9) >>> 0;
  }
}

function quotePool(niches: string[]): string[] {
  const pool = [...GENERAL_QUOTES];
  const seen = new Set(pool);
  for (const raw of niches) {
    const key = normalizeNiche(raw);
    for (const q of NICHE_QUOTES[key] || []) {
      if (!seen.has(q)) {
        seen.add(q);
        pool.push(q);
      }
    }
  }
  return pool;
}

function tipPool(niches: string[]): HomeTip[] {
  const pool = [...GENERAL_TIPS];
  const seen = new Set(pool.map((t) => t.title));
  for (const raw of niches) {
    const key = normalizeNiche(raw);
    for (const tip of NICHE_TIPS[key] || []) {
      if (!seen.has(tip.title)) {
        seen.add(tip.title);
        pool.push(tip);
      }
    }
  }
  return pool;
}

function pickOne<T>(items: T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

function pickUniqueTips(items: HomeTip[], count: number, rand: () => number): HomeTip[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

/** Frase motivacional de esta sesión, sesgada al nicho del creador. */
export function quoteForSession(
  niches: string[] = [],
  seed = getHomeCopySessionSeed()
): string {
  const pool = quotePool(niches);
  return pickOne(pool, mulberry32(seed ^ 0xa5a5a5a5));
}

/** Consejos de esta sesión (únicos), sesgados al nicho. */
export function tipsForSession(
  niches: string[] = [],
  count = 3,
  seed = getHomeCopySessionSeed()
): HomeTip[] {
  const pool = tipPool(niches);
  return pickUniqueTips(pool, count, mulberry32(seed ^ 0x3c3c3c3c));
}

/** @deprecated — usar quoteForSession */
export function quoteForToday(date = new Date()): string {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % GENERAL_QUOTES.length;
  }
  return GENERAL_QUOTES[hash];
}

/** @deprecated — usar tipsForSession */
export function tipsForToday(count = 3, date = new Date()) {
  const start = date.getDate() % GENERAL_TIPS.length;
  const out: HomeTip[] = [];
  for (let i = 0; i < count; i++) {
    out.push(GENERAL_TIPS[(start + i) % GENERAL_TIPS.length]);
  }
  return out;
}
