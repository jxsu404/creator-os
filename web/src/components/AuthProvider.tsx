"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabaseBrowser,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  disableCloudSync,
  enableCloudSync,
  pullAndMerge,
} from "@/lib/sync";
import { clearLocalWorkspace } from "@/lib/storage";

type AuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  syncReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSync: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [syncReady, setSyncReady] = useState(!configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setSyncReady(true);
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      setSyncReady(true);
      return;
    }

    let cancelled = false;
    let booted = false;

    async function boot(next: Session | null) {
      setSession(next);
      if (next?.user) {
        setSyncReady(false);
        try {
          await enableCloudSync(next.user);
        } finally {
          if (!cancelled) {
            setSyncReady(true);
            setLoading(false);
            booted = true;
          }
        }
      } else {
        disableCloudSync();
        if (!cancelled) {
          setSyncReady(true);
          setLoading(false);
          booted = true;
        }
      }
    }

    // Esperar INITIAL_SESSION (incluye tokens del hash/query del magic link)
    // antes de marcar "sin usuario", para no redirigir a /login demasiado pronto.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "INITIAL_SESSION" || booted || next) {
        void boot(next);
      }
    });

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void pullAndMerge();
      }
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase no configurado");
    const origin = window.location.origin;
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") || "/"
        : "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase no configurado");
    const origin = window.location.origin;
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") || "/"
        : "/";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    disableCloudSync();
    clearLocalWorkspace();
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }, []);

  const refreshSync = useCallback(async () => {
    await pullAndMerge();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      syncReady,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      refreshSync,
    }),
    [
      configured,
      loading,
      session,
      syncReady,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      refreshSync,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
