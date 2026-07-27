"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { configured, user, loading, signInWithGoogle, signInWithEmail } =
    useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setMessage(
        "Te envié un enlace y un código. Lo más fácil: escribe el código de 6–8 dígitos del correo."
      );
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
      <div className="app-shell">
        <main className="app-main onboarding">
          <h1 className="hero-title">Cuenta en la nube</h1>
          <p className="muted">
            Añade <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en{" "}
            <code>web/.env.local</code> para activar login y sync.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main onboarding">
        <p className="brand-mark">Creator OS</p>
        <h1 className="hero-title">Tu cuenta</h1>
        <p className="muted">
          Entra para sincronizar ideas entre el celular y la computadora.
        </p>

        <button
          type="button"
          className="btn-primary btn-block"
          disabled={busy || loading}
          onClick={() => void onGoogle()}
        >
          Continuar con Google
        </button>

        <div className="auth-divider" aria-hidden>
          <span>o</span>
        </div>

        <form className="auth-form" onSubmit={otpSent ? onVerifyOtp : onSendEmail}>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy || otpSent}
          />

          {otpSent ? (
            <>
              <label className="field-label" htmlFor="otp">
                Código del correo
              </label>
              <input
                id="otp"
                className="field"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={busy}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary btn-block"
                disabled={busy || otp.trim().length < 6}
              >
                {busy ? "Entrando…" : "Entrar con código"}
              </button>
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setMessage("");
                  setError("");
                }}
              >
                Usar otro email
              </button>
            </>
          ) : (
            <button
              type="submit"
              className="btn-secondary btn-block"
              disabled={busy || !email.trim()}
            >
              Enviar código / enlace
            </button>
          )}
        </form>

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <main className="app-main">
            <p className="muted">Cargando…</p>
          </main>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
