"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type MessageKey } from "@/lib/i18n/t";
import {
  applyDocumentPrefs,
  DEFAULT_PREFS,
  readPrefs,
  writePrefs,
  type AppPrefs,
  type LocalePref,
  type ThemePref,
} from "@/lib/prefs";

type PrefsContextValue = {
  prefs: AppPrefs;
  setTheme: (theme: ThemePref) => void;
  setLocale: (locale: LocalePref) => void;
  setReduceMotion: (value: boolean) => void;
  setThumbnailStylePrompt: (value: string) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = readPrefs();
    setPrefs(loaded);
    applyDocumentPrefs(loaded);
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== "creatoros_prefs_v1") return;
      const next = readPrefs();
      setPrefs(next);
      applyDocumentPrefs(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyDocumentPrefs(readPrefs());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs.theme, ready]);

  const commit = useCallback((next: AppPrefs) => {
    setPrefs(next);
    writePrefs(next);
    applyDocumentPrefs(next);
  }, []);

  const setTheme = useCallback(
    (theme: ThemePref) => {
      commit({ ...readPrefs(), theme });
    },
    [commit]
  );

  const setLocale = useCallback(
    (locale: LocalePref) => {
      commit({ ...readPrefs(), locale });
    },
    [commit]
  );

  const setReduceMotion = useCallback(
    (reduceMotion: boolean) => {
      commit({ ...readPrefs(), reduceMotion });
    },
    [commit]
  );

  const setThumbnailStylePrompt = useCallback(
    (thumbnailStylePrompt: string) => {
      commit({ ...readPrefs(), thumbnailStylePrompt });
    },
    [commit]
  );

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(prefs.locale, key, vars),
    [prefs.locale]
  );

  const value = useMemo(
    () => ({
      prefs,
      setTheme,
      setLocale,
      setReduceMotion,
      setThumbnailStylePrompt,
      t,
    }),
    [
      prefs,
      setTheme,
      setLocale,
      setReduceMotion,
      setThumbnailStylePrompt,
      t,
    ]
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    throw new Error("usePrefs must be used within PrefsProvider");
  }
  return ctx;
}

/** Safe for optional use outside provider (falls back to defaults). */
export function usePrefsOptional(): PrefsContextValue | null {
  return useContext(PrefsContext);
}
