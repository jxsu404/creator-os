"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { withUser1Defaults } from "@/lib/profile-context";
import { getProfile, saveProfile } from "@/lib/storage";
import { DEFAULT_BRAND } from "@/lib/user1-defaults";

function EditProfile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) return;
    const profile = withUser1Defaults(p);
    setName(profile.brand?.creatorName || "");
    setBio(profile.customDescription || "");
  }, []);

  function save() {
    const existing = getProfile();
    if (!existing) return;
    const base = withUser1Defaults(existing);
    saveProfile({
      ...base,
      customDescription: bio.trim(),
      brand: {
        ...DEFAULT_BRAND,
        ...base.brand,
        creatorName: name.trim() || DEFAULT_BRAND.creatorName,
      },
    });
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      router.push("/profile");
    }, 500);
  }

  return (
    <AppShell title="Editar perfil" backHref="/profile">
      <label className="field-label" htmlFor="name">
        Nombre
      </label>
      <input
        id="name"
        className="field"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />

      <label className="field-label" htmlFor="bio">
        Descripción
      </label>
      <textarea
        id="bio"
        className="field"
        rows={4}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="De qué va tu canal…"
      />

      {saved ? <p className="success">Guardado.</p> : null}

      <button type="button" className="btn-primary btn-block" onClick={save}>
        Guardar
      </button>
    </AppShell>
  );
}

export default function EditProfilePage() {
  return (
    <RequireOnboarding>
      <EditProfile />
    </RequireOnboarding>
  );
}
