"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "waitlist_page" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pude apuntarte.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <BrandMark href="/" size="lg" />
        <h1 className="auth-title">Lista de espera</h1>
        {done ? (
          <p className="muted">
            Listo. Te avisamos cuando abramos más plazas del soft launch.
          </p>
        ) : (
          <>
            <p className="muted">
              Déjanos tu email. Priorizamos creadores short-form que ya publican.
            </p>
            <form onSubmit={onSubmit} className="stack">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </label>
              {error ? <p className="error">{error}</p> : null}
              <button
                type="submit"
                className="btn-primary btn-block"
                disabled={busy}
              >
                {busy ? "Enviando…" : "Apuntarme"}
              </button>
            </form>
          </>
        )}
        <p className="muted">
          <Link href="/login" className="text-link">
            Ya tengo cuenta
          </Link>
          {" · "}
          <Link href="/invite" className="text-link">
            Tengo código
          </Link>
        </p>
      </div>
    </div>
  );
}
