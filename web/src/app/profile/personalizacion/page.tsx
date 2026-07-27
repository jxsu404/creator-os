"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { withUser1Defaults } from "@/lib/profile-context";
import { getProfile, saveProfile } from "@/lib/storage";
import { DEFAULT_RECORDING_STYLE } from "@/lib/user1-defaults";

function PersonalizationSettings() {
  const router = useRouter();
  const [howIRecord, setHowIRecord] = useState("");
  const [voice, setVoice] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) return;
    const profile = withUser1Defaults(p);
    setHowIRecord(profile.recordingStyle?.howIRecord || "");
    setVoice(profile.recordingStyle?.voiceAndPacing || "");
  }, []);

  function save() {
    const existing = getProfile();
    if (!existing) return;
    const base = withUser1Defaults(existing);
    saveProfile({
      ...base,
      recordingStyle: {
        ...DEFAULT_RECORDING_STYLE,
        ...base.recordingStyle,
        howIRecord: howIRecord.trim(),
        voiceAndPacing: voice.trim(),
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
      <p className="muted">Así suenan tus guías.</p>

      <label className="field-label" htmlFor="how">
        Cómo grabo
      </label>
      <textarea
        id="how"
        className="field"
        rows={4}
        value={howIRecord}
        onChange={(e) => setHowIRecord(e.target.value)}
        placeholder="Gameplay + voiceover, ritmo, plataformas…"
      />

      <label className="field-label" htmlFor="voice">
        Voz y ritmo
      </label>
      <textarea
        id="voice"
        className="field"
        rows={4}
        value={voice}
        onChange={(e) => setVoice(e.target.value)}
        placeholder="Tono, estilo de guías, qué evitar…"
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
