export const es = {
  nav: {
    home: "Inicio",
    capture: "Nueva idea",
    captureShort: "Nueva",
    ideas: "Ideas",
    profile: "Perfil",
  },
  profile: {
    title: "Perfil",
    edit: "Editar perfil",
    games: "Juegos",
    gamesDesc: "Activo: {game}",
    personalization: "Personalización",
    personalizationDesc: "Cómo grabas y tono",
    connections: "Conexiones",
    connectionsDescYt: "YouTube · {channel}",
    connectionsDescDefault: "YouTube · TikTok",
    settings: "Ajustes",
    settingsDesc: "Apariencia, idioma y más",
    versions: "Historial de versiones",
    versionsDesc: "Qué cambió en cada versión",
    aiUsage: "Uso de IA",
    aiUsageLead:
      "Porcentaje de uso de inteligencia artificial que te queda (Gemini, Groq, xAI).",
    supportTitle: "Apoya Ideazo",
    supportDesc: "Donación por PayPal · sin suscripción por ahora.",
    donate: "Donar con PayPal",
    howToSupport: "Cómo apoyar",
    account: "Cuenta",
    sessionActive: "Sesión activa",
    syncingDevices: "Tus datos van entre celular y PC",
    connectingAccount: "Conectando tu cuenta…",
    syncNow: "Sincronizar ahora",
    syncing: "Sincronizando…",
    signOut: "Cerrar sesión",
    signOutConfirm: "¿Cerrar sesión en este dispositivo?",
    versionBadge: "Ideazo v{version}",
  },
  versions: {
    title: "Historial de versiones",
    lead: "Qué cambió en cada versión de Ideazo.",
    current: "Actual",
    empty: "Aún no hay notas de versión.",
  },
  settings: {
    title: "Ajustes",
    appearance: "Apariencia",
    appearanceDesc: "Claro, oscuro o según el sistema",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    language: "Idioma",
    languageDesc: "Texto de la app (la IA sigue en español)",
    localeEs: "Español",
    localeEn: "English",
    motion: "Movimiento",
    motionDesc: "Menos animaciones en la interfaz",
    reduceMotion: "Reducir movimiento",
    thumbnails: "Miniaturas",
    thumbnailsDesc:
      "Estilo base del prompt al generar miniaturas con IA. Vacío = estilo Ideazo por defecto.",
    thumbnailsPlaceholder:
      "Ej. Estilo gaming Roblox, contraste fuerte, 2–3 palabras grandes, sin watermarks…",
    thumbnailsReset: "Usar estilo por defecto",
    thumbnailsSaved: "Estilo guardado",
    versionsLink: "Historial de versiones",
    versionsLinkDesc: "Notas de cada release",
    versionFooter: "Ideazo v{version}",
  },
  common: {
    back: "Volver",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "Cargando…",
    errorGeneric: "Algo salió mal. Intenta de nuevo.",
    networkError: "Sin conexión. Revisa tu red e intenta de nuevo.",
  },
  loop: {
    newIdea: "Nueva idea",
    continue: "Continuar",
    readyToRecord: "Listo para grabar",
    generateDirections: "Generar enfoques",
    generateDraft: "Generar guía",
  },
  dictation: {
    start: "Dictar con micrófono",
    stop: "Detener dictado",
  },
} as const;

/** Árbol de mensajes: mismas claves que `es`, valores string. */
export type MessageTree = {
  [K in keyof typeof es]: {
    [P in keyof (typeof es)[K]]: string;
  };
};
