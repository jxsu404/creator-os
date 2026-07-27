"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";

/**
 * Si Supabase está configurado, exige sesión.
 * Si no hay env, deja pasar (modo local / desarrollo sin nube).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { configured, loading, user, syncReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [configured, loading, user, router, pathname]);

  if (!configured) return <>{children}</>;

  if (loading || !user || !syncReady) {
    return (
      <AppShell showNav={false}>
        <p className="muted">
          {loading || !user ? "Cargando cuenta…" : "Sincronizando…"}
        </p>
      </AppShell>
    );
  }

  return <>{children}</>;
}
