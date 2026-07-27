"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      <div className="app-shell">
        <main className="app-main">
          <p className="muted">Cargando…</p>
        </main>
      </div>
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
