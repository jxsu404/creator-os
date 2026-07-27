/** Tipos mínimos del Web Speech API (Chrome / Edge / Safari). */

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: { transcript: string };
}

export interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike> & {
    length: number;
  };
}

export interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechDictationSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

export function friendlySpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permiso de micrófono denegado. Actívalo en el navegador.";
    case "no-speech":
      return "No escuché nada. Intenta de nuevo.";
    case "audio-capture":
      return "No encontré un micrófono.";
    case "network":
      return "El dictado de Chrome no pudo conectar con Google. Revisa internet, prueba en Chrome/Edge (no en vista previa) y vuelve a tocar el micrófono.";
    case "aborted":
      return "";
    default:
      return "No pude dictar. Prueba en Chrome o Edge.";
  }
}
