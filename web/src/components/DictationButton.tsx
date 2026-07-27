"use client";

import { useEffect } from "react";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";

type Props = {
  /** Se llama con cada fragmento final reconocido. */
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: string;
};

/**
 * Botón de dictado por micrófono. Se oculta el control activo si el
 * navegador no soporta Speech API (muestra un aviso discreto).
 */
export function DictationButton({
  onTranscript,
  disabled = false,
  lang = "es-MX",
}: Props) {
  const { supported, listening, error, toggle, stop } = useSpeechDictation({
    lang,
    onFinal: onTranscript,
  });

  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  if (!supported) {
    return (
      <p className="idea-meta dictation-unsupported">
        Dictado no disponible aquí. Usa Chrome o Edge.
      </p>
    );
  }

  return (
    <div className="dictation-bar">
      <button
        type="button"
        className={`btn-secondary btn-block dictation-btn${
          listening ? " dictation-btn-active" : ""
        }`}
        disabled={disabled}
        aria-pressed={listening}
        onClick={toggle}
      >
        <span className="dictation-btn-label" aria-hidden>
          {listening ? <span className="dictation-dot" /> : <MicIcon />}
        </span>
        {listening ? "Escuchando… toca para parar" : "Dictar con micrófono"}
      </button>
      {listening ? (
        <p className="muted dictation-hint">
          Habla con naturalidad. Se escribe solo.
        </p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
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
