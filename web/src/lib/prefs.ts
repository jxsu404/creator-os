export type ThemePref = "light" | "dark" | "system";
export type LocalePref = "es" | "en";

export type AppPrefs = {
  theme: ThemePref;
  locale: LocalePref;
  reduceMotion: boolean;
};

export const PREFS_STORAGE_KEY = "creatoros_prefs_v1";

export const DEFAULT_PREFS: AppPrefs = {
  theme: "system",
  locale: "es",
  reduceMotion: false,
};

export function normalizePrefs(raw: unknown): AppPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const o = raw as Record<string, unknown>;
  const theme: ThemePref =
    o.theme === "light" || o.theme === "dark" || o.theme === "system"
      ? o.theme
      : DEFAULT_PREFS.theme;
  const locale: LocalePref =
    o.locale === "en" || o.locale === "es" ? o.locale : DEFAULT_PREFS.locale;
  const reduceMotion =
    typeof o.reduceMotion === "boolean"
      ? o.reduceMotion
      : DEFAULT_PREFS.reduceMotion;
  return { theme, locale, reduceMotion };
}

export function readPrefs(): AppPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return normalizePrefs(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writePrefs(prefs: AppPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

/** Resuelve claro/oscuro efectivo para data-theme. */
export function resolveTheme(theme: ThemePref): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyDocumentPrefs(prefs: AppPrefs): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const resolved = resolveTheme(prefs.theme);
  html.setAttribute("data-theme", resolved);
  html.setAttribute("data-theme-pref", prefs.theme);
  html.lang = prefs.locale === "en" ? "en" : "es";
  html.setAttribute(
    "data-reduce-motion",
    prefs.reduceMotion ? "true" : "false"
  );
}

export function speechLangFromLocale(locale: LocalePref): string {
  return locale === "en" ? "en-US" : "es-MX";
}
