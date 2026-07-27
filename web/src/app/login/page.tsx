"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

function GoogleGlyph() {
  return (
    <svg
      className="auth-google-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { configured, user, loading, signInWithGoogle, signInWithEmail } =
    useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromQuery = params.get("error");
    if (fromQuery) {
      setError(
        fromQuery === "config"
          ? "Supabase no está configurado en este entorno."
          : fromQuery
      );
    }
  }, [params]);

  useEffect(() => {
    if (!configured) {
      router.replace("/");
      return;
    }
    if (!loading && user) router.replace(next);
  }, [configured, loading, user, router, next]);

  async function onGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude iniciar con Google.");
      setBusy(false);
    }
  }

  async function onSendEmail(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await signInWithEmail(email.trim());
      setOtpSent(true);
      setMessage("Revisa tu correo. Escribe el código de 6–8 dígitos.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pude enviar el enlace."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const token = otp.trim();
    if (!email.trim() || !token) return;
    setError("");
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase no configurado");
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });
      if (verifyError) throw verifyError;
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Código inválido o expirado. Pide otro."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="auth-screen">
        <div className="auth-atmosphere" aria-hidden />
        <main className="auth-panel">
          <p className="auth-brand">Creator OS</p>
          <h1 className="auth-headline">Falta configurar la cuenta</h1>
          <p className="auth-sub">
            Añade las variables de Supabase en el entorno y vuelve a cargar.
          </p>
        </main>
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className="auth-screen">
        <div className="auth-atmosphere" aria-hidden />
        <main className="auth-panel auth-panel-center">
          <p className="auth-brand">Creator OS</p>
          <p className="auth-sub">Preparando tu sesión…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-atmosphere" aria-hidden />
      <div className="auth-glow" aria-hidden />

      <main className="auth-panel">
        <header className="auth-top">
          <p className="auth-brand">Creator OS</p>
          <p className="auth-kicker">Para creadores short-form</p>
        </header>

        <div className="auth-copy">
          <h1 className="auth-headline">
            Entra.
            <br />
            Graba más.
          </h1>
          <p className="auth-sub">
            Una cuenta. Tus ideas en el celular y en la PC, listas para
            convertir en guion.
          </p>
        </div>

        <div className="auth-actions">
          <button
            type="button"
            className="auth-btn-google"
            disabled={busy || loading}
            onClick={() => void onGoogle()}
          >
            <GoogleGlyph />
            <span>{busy && !showEmail ? "Conectando…" : "Continuar con Google"}</span>
          </button>

          {!showEmail ? (
            <button
              type="button"
              className="auth-btn-ghost"
              disabled={busy}
              onClick={() => {
                setShowEmail(true);
                setError("");
              }}
            >
              Usar email
            </button>
          ) : (
            <form
              className="auth-email"
              onSubmit={otpSent ? onVerifyOtp : onSendEmail}
            >
              <div className="auth-divider-line" aria-hidden>
                <span>email</span>
              </div>

              <label className="auth-label" htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                className="auth-input"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy || otpSent}
                autoFocus
              />

              {otpSent ? (
                <>
                  <label className="auth-label" htmlFor="otp">
                    Código
                  </label>
                  <input
                    id="otp"
                    className="auth-input auth-input-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={busy}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={busy || otp.trim().length < 6}
                  >
                    {busy ? "Entrando…" : "Entrar"}
                  </button>
                  <button
                    type="button"
                    className="auth-text-btn"
                    disabled={busy}
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setMessage("");
                      setError("");
                    }}
                  >
                    Otro correo
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={busy || !email.trim()}
                  >
                    {busy ? "Enviando…" : "Enviar código"}
                  </button>
                  <button
                    type="button"
                    className="auth-text-btn"
                    disabled={busy}
                    onClick={() => {
                      setShowEmail(false);
                      setEmail("");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Volver
                  </button>
                </>
              )}
            </form>
          )}

          {message ? <p className="auth-success">{message}</p> : null}
          {error ? (
            <p className="auth-error" role="alert">
              {/rate|limit|too many|429/i.test(error)
                ? "Demasiados intentos por email. Espera un momento o usa Google."
                : error}
            </p>
          ) : null}
        </div>

        <p className="auth-legal">
          Al continuar aceptas que tus ideas se sincronicen de forma segura en
          tu cuenta.
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-screen">
          <div className="auth-atmosphere" aria-hidden />
          <main className="auth-panel auth-panel-center">
            <p className="auth-brand">Creator OS</p>
            <p className="auth-sub">Cargando…</p>
          </main>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
