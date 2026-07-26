"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/storage";

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (!profile) {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
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
