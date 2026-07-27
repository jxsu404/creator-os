/** Copy de Home: frase + consejos según nicho, estables por sesión de navegador. */

export type HomeTip = {
  title: string;
  body: string;
};

const SESSION_SEED_KEY = "creatoros_home_copy_seed_v1";

const GENERAL_QUOTES = [
  "Una idea clara vale más que diez borradores a medias.",
  "Graba lo que ya entiendes. El resto se aclara al editar.",
  "La primera frase no es trampa: es una promesa que sí vas a cumplir.",
  "Hoy basta con una pieza. Mejor constante que agotado.",
  "Si no cabe en menos de un minuto, todavía está demasiado grande.",
  "Tu gente no necesita perfecto; necesita útil y ahora.",
  "Anota primero. El enfoque se elige después.",
  "Tres caminos distintos ayudan más que un guion forzado.",
  "Si te trabas, achica: una idea, un tip, un momento.",
  "Termina la guía. Publicar imperfecto enseña más que pulir eterno.",
  "Tu nicho no te encierra: hace memorable tu voz.",
  "Menos opciones. Más claridad. Mejor pieza.",
];

const GENERAL_TIPS: HomeTip[] = [
  {
    title: "Anota en caliente",
    body: "Cuando se te ocurra algo, guárdalo ya. El enfoque se elige después.",
  },
  {
    title: "Elige un camino",
    body: "Prueba tres enfoques distintos. Quédate con uno y deja el resto.",
  },
  {
    title: "Un video, una idea",
    body: "Un tip, un error o un momento. No intentes meter el video largo entero.",
  },
  {
    title: "Empieza con una promesa",
    body: "Di en la primera frase qué se lleva quien se queda a ver.",
  },
  {
    title: "Cierra pidiendo algo útil",
    body: "Invita a seguir, comentar o probarlo — solo si el video lo merece.",
  },
];

/** Quotes extra por nicho (se suman al pool general). */
const NICHE_QUOTES: Record<string, string[]> = {
  Gaming: [
    "La actualización del juego es contenido. No la dejes solo en el chat.",
    "La comunidad recuerda quién explicó el cambio a tiempo.",
    "Enseña el porqué de la jugada, no solo la jugada bonita.",
    "Si el clip emociona sin contexto, súmale una línea al inicio.",
  ],
  Roblox: [
    "Un tip claro de progreso gana a una explicación eterna del mapa.",
    "Si el juego cambió hoy, ya tienes gancho para el video.",
    "Muestra el error típico y la solución en el mismo video.",
    "Habla como se habla en el juego: términos reales, sin inventar.",
  ],
  Guías: [
    "Una guía corta gana si alguien puede hacer el paso 1 ya.",
    "Empieza por el resultado, luego el cómo.",
    "Si hay siete pasos, el video corto solo necesita los tres que fallan.",
    "Quita el relleno: cada segundo debe ayudar a quien mira.",
  ],
  Showcases: [
    "Enseña el antes y después, o el detalle que nadie nota.",
    "Si solo das un tour, aburre. Elige el momento wow.",
    "Pausa en el momento clave; no lo corras entero.",
    "Cuenta qué sentiste al lograrlo — eso vende la escena.",
  ],
  Opiniones: [
    "Opina con un ejemplo. Un caso real vale más que mil adjetivos.",
    "Di tu postura en la primera línea; defiende después.",
    "Una opinión clara invita a comentar. Una tibia se salta.",
    "Respeta a quien mira: no insultes para parecer intenso.",
  ],
  Vlogs: [
    "Un vlog corto necesita un hilo: un día, una decisión, un cambio.",
    "Recorta lo rutinario; deja la escena que cambia el ánimo.",
    "Tu cara y tu voz son el producto. No las escondas.",
    "Empieza ya en la escena interesante, no en la introducción.",
  ],
  Fitness: [
    "Una forma correcta en cuarenta segundos enseña más que un montaje largo.",
    "Di el error común antes de la corrección.",
    "Cuenta series y repeticiones solo si alguien puede aplicarlas hoy.",
    "Motivación sin técnica se olvida; técnica clara se guarda.",
  ],
  Cocina: [
    "Muestra el truco que cambia el plato, no toda la receta.",
    "El video gana con textura, sonido y un tip concreto.",
    "Di tiempos y cantidades solo de lo esencial.",
    "Cierra con el bocado o el plato terminado: que se vea el resultado.",
  ],
  Finanzas: [
    "Un número concreto ayuda más que un “sé disciplinado”.",
    "Explica el riesgo en una línea. Genera confianza.",
    "Empieza por el error típico; luego la solución simple.",
    "No prometas riqueza. Promete claridad que se pueda usar.",
  ],
  Educación: [
    "Enseña una cosa. Si cabe otra, es otro video.",
    "Usa un ejemplo que quien mira pueda repetir hoy.",
    "Una analogía corta abre la puerta; el detalle la cierra.",
    "Pregunta al inicio qué van a poder hacer al final.",
  ],
  Tech: [
    "Mejor mostrar el click que resolver con un discurso.",
    "Nombra la herramienta y la versión; evita tips que ya no aplican.",
    "Tres pasos claros ganan a una reseña interminable.",
    "Si hay atajo, enseña el atajo primero.",
  ],
  Comedia: [
    "Una introducción corta hace más grande el golpe final.",
    "Una regla: una idea cómica por video.",
    "Graba la reacción real; a veces es más fuerte que el chiste.",
    "Edita el silencio: el ritmo también es el chiste.",
  ],
  Lifestyle: [
    "Muestra el ritual de verdad, no solo lo bonito.",
    "Un cambio pequeño y real conecta más que un discurso.",
    "Cuenta el porqué detrás del hábito.",
    "Luz, detalle y una frase honesta: suficiente.",
  ],
  Belleza: [
    "Un tip de producto o técnica ayuda más que un montón sin criterio.",
    "Acércate al resultado: ahí está el gancho.",
    "Di para quién funciona y para quién no.",
    "Antes y después solo si el cambio se entiende de un vistazo.",
  ],
  Negocios: [
    "Una lección de esta semana ayuda más que teoría de manual.",
    "Cuenta el número o la decisión, no solo la vibra.",
    "El error caro enseña más que el logro editado.",
    "Termina con una acción que quepa en hoy.",
  ],
};

const NICHE_TIPS: Record<string, HomeTip[]> = {
  Gaming: [
    {
      title: "Actualización fresca",
      body: "Si el juego cambió, anota el cambio ya. El video casi se arma solo.",
    },
    {
      title: "Una jugada, un video",
      body: "Enseña una jugada o un error. Deja las listas largas para otro día.",
    },
  ],
  Roblox: [
    {
      title: "Habla como en el juego",
      body: "Usa términos reales. Si no estás seguro, anótalos en Juegos.",
    },
    {
      title: "Progreso útil",
      body: "Un tip claro de cómo avanzar retiene más que un paseo eterno.",
    },
  ],
  Guías: [
    {
      title: "Resultado primero",
      body: "Abre con lo que van a lograr. Luego el paso más fácil de empezar.",
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
      title: "Postura + ejemplo",
      body: "Di lo que piensas y apóyalo con un ejemplo concreto en pantalla.",
    },
  ],
  Vlogs: [
    {
      title: "Un hilo",
      body: "Elige una emoción o decisión del día. Eso es el video.",
    },
  ],
  Fitness: [
    {
      title: "Forma antes que ego",
      body: "Corrige un error común. Quien mira siente progreso de inmediato.",
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
      title: "Una lección corta",
      body: "Define qué sabrán hacer al final. Todo lo demás sobra.",
    },
  ],
  Tech: [
    {
      title: "Muéstralo en vivo",
      body: "Que se vea el click o el atajo. Habla poco encima.",
    },
  ],
  Comedia: [
    {
      title: "El ritmo cuenta",
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
      title: "Acércate al detalle",
      body: "Enfoca la técnica o el resultado. El resto es ruido.",
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
