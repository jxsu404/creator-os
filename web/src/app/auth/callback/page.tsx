"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Supabase no configurado.");
      return;
    }

    const next = params.get("next") || "/";
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;

    async function finish() {
      try {
        if (code) {
          const { error: exchangeError } =
            await supabase!.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && type) {
          const { error: otpError } = await supabase!.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (otpError) throw otpError;
        } else {
          // A veces el link cae sin params (hash en URL) — getSession puede bastar
          const { data } = await supabase!.auth.getSession();
          if (!data.session) {
            throw new Error(
              "El enlace no trae sesión. Pide otro código en /login o abre el link en el mismo navegador."
            );
          }
        }
        router.replace(next.startsWith("/") ? next : "/");
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No pude completar el inicio de sesión."
        );
      }
    }

    void finish();
  }, [params, router]);

  if (error) {
    return (
      <div className="app-shell">
        <main className="app-main onboarding">
          <h1 className="hero-title">No pude entrar</h1>
          <p className="error">{error}</p>
          <a href="/login" className="btn-primary btn-block">
            Volver al login
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <p className="muted">Confirmando sesión…</p>
      </main>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <main className="app-main">
            <p className="muted">Confirmando sesión…</p>
          </main>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
