/**
 * Destinos seguros post-login / deep links.
 * Solo paths relativos de la app (un solo `/` inicial).
 */
export function sanitizeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return fallback;
  return value;
}
