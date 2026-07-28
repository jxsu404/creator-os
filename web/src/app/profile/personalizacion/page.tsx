"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { BLANK_RECORDING_STYLE, withUser1Defaults } from "@/lib/profile-context";
import { getProfile, saveProfile } from "@/lib/storage";

function PersonalizationSettings() {
  const router = useRouter();
  const [howIRecord, setHowIRecord] = useState("");
  const [voice, setVoice] = useState("");
  const [youtubeDesc, setYoutubeDesc] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) return;
    const profile = withUser1Defaults(p);
    setHowIRecord(profile.recordingStyle?.howIRecord || "");
    setVoice(profile.recordingStyle?.voiceAndPacing || "");
    setYoutubeDesc(profile.recordingStyle?.youtubeDescriptionStyle || "");
  }, []);

  function save() {
    const existing = getProfile();
    if (!existing) return;
    const base = withUser1Defaults(existing);
    saveProfile({
      ...base,
      recordingStyle: {
        ...BLANK_RECORDING_STYLE,
        ...base.recordingStyle,
        howIRecord: howIRecord.trim(),
        voiceAndPacing: voice.trim(),
        youtubeDescriptionStyle: youtubeDesc.trim(),
      },
    });
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      router.push("/profile");
    }, 500);
  }

  return (
    <AppShell title="Personalización" backHref="/profile">
      <p className="muted settings-block-lead">
        Así suena tu contenido. La IA usa esto al armar guiones y descripciones
        de YouTube.
      </p>

      <label className="field-label" htmlFor="how">
        Cómo grabo
      </label>
      <p className="idea-meta">
        Formatos de tus videos (gameplay + voz, facecam, shorts…). Define cómo
        estructura la IA el guion a partir de tu idea.
      </p>
      <textarea
        id="how"
        className="field"
        rows={4}
        value={howIRecord}
        onChange={(e) => setHowIRecord(e.target.value)}
        placeholder="Ej. Gameplay con voz en off, videos cortos verticales, sin facecam…"
      />

      <label className="field-label" htmlFor="voice">
        Voz y ritmo
      </label>
      <p className="idea-meta">
        Cómo escribes y hablas. Si capturas una idea en tu tono —&quot;probé
        Shindo Life, me mataron y estuvo difícil&quot;— la IA escribe el guion
        con esa misma voz.
      </p>
      <textarea
        id="voice"
        className="field"
        rows={4}
        value={voice}
        onChange={(e) => setVoice(e.target.value)}
        placeholder="Ej. Cercano, directo, como si le contara a un amigo. Empiezo con hola familia…"
      />

      <label className="field-label" htmlFor="yt-desc">
        Descripciones de YouTube
      </label>
      <p className="idea-meta">
        Formato que quieres en título, descripción y etiquetas cuando generes el
        paquete para subir a YouTube.
      </p>
      <textarea
        id="yt-desc"
        className="field"
        rows={4}
        value={youtubeDesc}
        onChange={(e) => setYoutubeDesc(e.target.value)}
        placeholder="Ej. Primera línea con gancho, saltos de línea, 3 hashtags al final, mencionar Discord…"
      />

      {saved ? <p className="success">Guardado.</p> : null}

      <button type="button" className="btn-primary btn-block" onClick={save}>
        Guardar
      </button>
    </AppShell>
  );
}

export default function PersonalizationPage() {
  return (
    <RequireOnboarding>
      <PersonalizationSettings />
    </RequireOnboarding>
  );
}
