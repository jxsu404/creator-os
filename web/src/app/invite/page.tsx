"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/components/AuthProvider";

export default function InvitePage() {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) {
      router.replace("/");
      return;
    }
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/invite")}`);
      return;
    }
    if (!user) return;
    void fetch("/api/invite")
      .then((r) => r.json())
      .then((data: { inviteOnly?: boolean; granted?: boolean }) => {
        if (!data.inviteOnly || data.granted) router.replace("/");
      })
      .catch(() => {
        /* ignore */
      });
  }, [configured, loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude validar.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandMark linked={false} size="lg" />
        <h1 className="auth-title">Invitación</h1>
        <p className="muted">
          Ideazo está en soft launch. Necesitas un código para entrar.
        </p>
        <form onSubmit={onSubmit} className="stack">
          <label className="field">
            <span>Código</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="IDEAZO-EARLY"
              autoCapitalize="characters"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn-primary btn-block" disabled={busy}>
            {busy ? "Validando…" : "Entrar"}
          </button>
        </form>
        <p className="muted">
          ¿Sin código?{" "}
          <Link href="/waitlist" className="text-link">
            Únete a la lista
          </Link>
        </p>
      </div>
    </div>
  );
}
