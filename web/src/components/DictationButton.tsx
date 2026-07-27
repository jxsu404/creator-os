"use client";

import { useEffect } from "react";
import { usePrefsOptional } from "@/components/PrefsProvider";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";
import { speechLangFromLocale } from "@/lib/prefs";

type Props = {
  /** Se llama con cada fragmento final reconocido. */
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: string;
};

/**
 * Ícono de micrófono para dictado, pensado para vivir dentro del
 * mismo cuadro de texto (`.field-with-mic`).
 */
export function DictationButton({
  onTranscript,
  disabled = false,
  lang,
}: Props) {
  const prefs = usePrefsOptional();
  const resolvedLang =
    lang ??
    (prefs ? speechLangFromLocale(prefs.prefs.locale) : "es-MX");
  const startLabel = prefs?.t("dictation.start") ?? "Dictar con micrófono";
  const stopLabel = prefs?.t("dictation.stop") ?? "Detener dictado";

  const { supported, listening, error, toggle, stop } = useSpeechDictation({
    lang: resolvedLang,
    onFinal: onTranscript,
  });

  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  if (!supported) return null;

  return (
    <>
      <button
        type="button"
        className={`dictation-mic${listening ? " dictation-mic-active" : ""}`}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? stopLabel : startLabel}
        title={listening ? stopLabel : startLabel}
        onClick={toggle}
      >
        {listening ? <span className="dictation-dot" aria-hidden /> : <MicIcon />}
      </button>
      {error ? (
        <p className="error dictation-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** Une texto dictado al valor actual sin duplicar espacios. */
export function appendDictation(current: string, transcript: string): string {
  const piece = transcript.trim();
  if (!piece) return current;
  const base = current.trimEnd();
  if (!base) return piece;
  const needsSpace = !/[\s\n]$/.test(base);
  return needsSpace ? `${base} ${piece}` : `${base}${piece}`;
}

function MicIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 19v3" />
    </svg>
  );
}
