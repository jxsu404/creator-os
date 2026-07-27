/** Donaciones voluntarias (PayPal). Sin suscripción por ahora. */

const DEFAULT_PAYPAL_DONATE_URL = "https://paypal.me/josuucr";

export function paypalDonateUrl(): string | null {
  const url =
    process.env.NEXT_PUBLIC_PAYPAL_DONATE_URL?.trim() ||
    DEFAULT_PAYPAL_DONATE_URL;
  return url || null;
}

export function isDonateConfigured(): boolean {
  return Boolean(paypalDonateUrl());
}

/** Ruta de apoyo en la app (fallback si falta el link de PayPal). */
export const SUPPORT_PATH = "/pricing";
