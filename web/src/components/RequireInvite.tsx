"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";

/**
 * Si INVITE_ONLY está activo en el servidor, exige user_access.
 * Rutas públicas (/invite, /waitlist, /pricing, legal) no pasan por aquí.
 */
export function RequireInvite({ children }: { children: React.ReactNode }) {
  const { configured, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(!configured);
  const [checkError, setCheckError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) {
      setAllowed(false);
      return;
    }

    let cancelled = false;
    setCheckError(false);
    void (async () => {
      try {
        const res = await fetch("/api/invite", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`invite check ${res.status}`);
        }
        const data = (await res.json()) as {
          inviteOnly?: boolean;
          granted?: boolean;
        };
        if (cancelled) return;
        if (data.inviteOnly && !data.granted) {
          if (pathname !== "/invite") {
            router.replace("/invite");
          }
          setAllowed(false);
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancelled) {
          setCheckError(true);
          setAllowed(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, router, pathname, retryKey]);

  if (!configured) return <>{children}</>;
  if (loading || !user) return <>{children}</>;
  if (!allowed) {
    return (
      <AppShell showNav={false}>
        {checkError ? (
          <div className="stack gap-sm">
            <p className="muted">
              No pude comprobar tu invitación. Revisa la conexión e intenta de
              nuevo.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <p className="muted">Comprobando invitación…</p>
        )}
      </AppShell>
    );
  }
  return <>{children}</>;
}
