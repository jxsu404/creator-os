"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { getProfile } from "@/lib/storage";
import { onSynced } from "@/lib/sync";

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function check() {
      const profile = getProfile();
      if (!profile) {
        router.replace("/onboarding");
        return;
      }
      setReady(true);
    }
    check();
    return onSynced(check);
  }, [router]);

  if (!ready) {
    return (
      <AppShell showNav={false}>
        <p className="muted">Cargando…</p>
      </AppShell>
    );
  }

  return <>{children}</>;
}

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <OnboardingGate>{children}</OnboardingGate>
    </RequireAuth>
  );
}
