"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  friendlySpeechError,
  getSpeechRecognitionCtor,
  isSpeechDictationSupported,
  type SpeechRecognitionLike,
} from "@/lib/speech";

type Options = {
  /** Idioma BCP-47. Default es-MX. */
  lang?: string;
  /** Recibe el texto final dictado (una frase o bloque). */
  onFinal: (transcript: string) => void;
  /** Texto parcial mientras habla (opcional, para preview). */
  onInterim?: (transcript: string) => void;
};

/**
 * Dictado por micrófono vía Web Speech API.
 * Compatible con Chrome, Edge y Safari reciente. Firefox no lo soporta.
 * Chrome envía audio a servidores de Google; el error "network" es de ese servicio.
 */
export function useSpeechDictation({
  lang = "es-MX",
  onFinal,
  onInterim,
}: Options) {
  const [supported] = useState(() => isSpeechDictationSupported());
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListenRef = useRef(false);
  const lastErrorRef = useRef("");
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);

  useEffect(() => {
    onFinalRef.current = onFinal;
    onInterimRef.current = onInterim;
  }, [onFinal, onInterim]);

  const stop = useCallback(() => {
    wantListenRef.current = false;
    lastErrorRef.current = "";
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Tu navegador no soporta dictado. Usa Chrome o Edge.");
      return;
    }

    setError("");
    lastErrorRef.current = "";
    wantListenRef.current = true;

    // Reinicia instancia limpia cada sesión
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    const rec = new Ctor();
    // continuous=false es más estable (menos "network" en Chrome/Android)
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (wantListenRef.current) setListening(true);
    };

    rec.onresult = (event) => {
      let interim = "";
      let finals = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript?.trim() || "";
        if (!piece) continue;
        if (result.isFinal) finals += (finals ? " " : "") + piece;
        else interim += (interim ? " " : "") + piece;
      }
      if (finals) onFinalRef.current(finals);
      if (interim) onInterimRef.current?.(interim);
    };

    rec.onerror = (event) => {
      lastErrorRef.current = event.error;
      // no-speech / aborted: no alarmar; el usuario puede seguir
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      const msg = friendlySpeechError(event.error);
      if (msg) setError(msg);
      // network y permisos: cortar el bucle de reinicio
      if (
        event.error === "network" ||
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "audio-capture"
      ) {
        wantListenRef.current = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      // Tras una frase (continuous=false), reinicia solo si el usuario sigue dictando
      // y no hubo error de red/permiso.
      const fatal =
        lastErrorRef.current === "network" ||
        lastErrorRef.current === "not-allowed" ||
        lastErrorRef.current === "service-not-allowed" ||
        lastErrorRef.current === "audio-capture";

      if (wantListenRef.current && !fatal) {
        lastErrorRef.current = "";
        try {
          rec.start();
          return;
        } catch {
          wantListenRef.current = false;
        }
      }
      setListening(false);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("No pude iniciar el micrófono.");
      wantListenRef.current = false;
      setListening(false);
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening || wantListenRef.current) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      wantListenRef.current = false;
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return { supported, listening, error, start, stop, toggle, setError };
}
