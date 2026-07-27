"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";

/** Validación Usuario 1 queda fuera de la UI por ahora → redirige a Perfil. */
function ValidationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <AppShell title="Perfil" backHref="/">
      <p className="muted">Redirigiendo…</p>
    </AppShell>
  );
}

export default function ValidationPage() {
  return (
    <RequireOnboarding>
      <ValidationRedirect />
    </RequireOnboarding>
  );
}
