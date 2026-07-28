"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { usePrefs } from "@/components/PrefsProvider";
import { APP_VERSION } from "@/lib/app-version";
import {
  fileToCompressedDataUrl,
  MAX_REFERENCE_IMAGES,
} from "@/lib/image-compress";
import type { LocalePref, ThemePref } from "@/lib/prefs";
import {
  addThumbRef,
  deleteThumbRef,
  listThumbRefs,
  type ThumbRef,
} from "@/lib/thumbnail-gallery";
import {
  DEFAULT_THUMBNAIL_STYLE_PROMPT,
  THUMBNAIL_STYLE_PROMPT_MAX,
} from "@/lib/thumbnail-prompt";

function SettingsBody() {
  const {
    prefs,
    setTheme,
    setLocale,
    setReduceMotion,
    setThumbnailStylePrompt,
    t,
  } = usePrefs();
  const [thumbDraft, setThumbDraft] = useState(prefs.thumbnailStylePrompt);
  const [thumbSaved, setThumbSaved] = useState(false);
  const [refs, setRefs] = useState<ThumbRef[]>([]);
  const [refBusy, setRefBusy] = useState(false);
  const [refError, setRefError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setThumbDraft(prefs.thumbnailStylePrompt);
  }, [prefs.thumbnailStylePrompt]);

  useEffect(() => {
    void listThumbRefs()
      .then(setRefs)
      .catch(() => setRefs([]));
  }, []);

  const themes: { id: ThemePref; label: string }[] = [
    { id: "system", label: t("settings.themeSystem") },
    { id: "light", label: t("settings.themeLight") },
    { id: "dark", label: t("settings.themeDark") },
  ];

  const locales: { id: LocalePref; label: string }[] = [
    { id: "es", label: t("settings.localeEs") },
    { id: "en", label: t("settings.localeEn") },
  ];

  function saveThumbStyle() {
    setThumbnailStylePrompt(thumbDraft.slice(0, THUMBNAIL_STYLE_PROMPT_MAX));
    setThumbSaved(true);
    window.setTimeout(() => setThumbSaved(false), 1400);
  }

  function resetThumbStyle() {
    setThumbDraft("");
    setThumbnailStylePrompt("");
    setThumbSaved(true);
    window.setTimeout(() => setThumbSaved(false), 1400);
  }

  async function onPickRefs(files: FileList | null) {
    if (!files?.length) return;
    setRefError("");
    setRefBusy(true);
    try {
      let current = await listThumbRefs();
      for (const file of Array.from(files)) {
        if (current.length >= MAX_REFERENCE_IMAGES) {
          setRefError(t("settings.thumbRefsFull"));
          break;
        }
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await fileToCompressedDataUrl(file);
        const added = await addThumbRef({
          imageDataUrl: dataUrl,
          name: file.name,
        });
        current = [added, ...current];
      }
      setRefs(current.slice(0, MAX_REFERENCE_IMAGES));
    } catch (e) {
      setRefError(
        e instanceof Error ? e.message : t("common.errorGeneric")
      );
    } finally {
      setRefBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onRemoveRef(id: string) {
    await deleteThumbRef(id);
    setRefs((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <AppShell title={t("settings.title")} backHref="/profile">
      <section className="section settings-block">
        <h2 className="section-title">{t("settings.appearance")}</h2>
        <p className="muted settings-block-lead">
          {t("settings.appearanceDesc")}
        </p>
        <div
          className="prefs-segment"
          role="radiogroup"
          aria-label={t("settings.appearance")}
        >
          {themes.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={prefs.theme === opt.id}
              className={`prefs-segment-btn${
                prefs.theme === opt.id ? " prefs-segment-btn-active" : ""
              }`}
              onClick={() => setTheme(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section settings-block">
        <h2 className="section-title">{t("settings.language")}</h2>
        <p className="muted settings-block-lead">
          {t("settings.languageDesc")}
        </p>
        <div
          className="prefs-segment"
          role="radiogroup"
          aria-label={t("settings.language")}
        >
          {locales.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={prefs.locale === opt.id}
              className={`prefs-segment-btn${
                prefs.locale === opt.id ? " prefs-segment-btn-active" : ""
              }`}
              onClick={() => setLocale(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section settings-block">
        <h2 className="section-title">{t("settings.motion")}</h2>
        <p className="muted settings-block-lead">{t("settings.motionDesc")}</p>
        <label className="prefs-toggle-row">
          <span className="settings-title">{t("settings.reduceMotion")}</span>
          <input
            type="checkbox"
            className="prefs-toggle"
            checked={prefs.reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
        </label>
      </section>

      <section className="section settings-block">
        <h2 className="section-title">{t("settings.thumbnails")}</h2>
        <p className="muted settings-block-lead">
          {t("settings.thumbnailsDesc")}
        </p>
        <label className="field-label" htmlFor="thumb-style-prompt">
          {t("settings.thumbnails")} ({thumbDraft.length}/
          {THUMBNAIL_STYLE_PROMPT_MAX})
        </label>
        <textarea
          id="thumb-style-prompt"
          className="field field-lg"
          rows={10}
          maxLength={THUMBNAIL_STYLE_PROMPT_MAX}
          placeholder={t("settings.thumbnailsPlaceholder")}
          value={thumbDraft}
          onChange={(e) => setThumbDraft(e.target.value)}
        />
        <details className="thumb-prompt-default">
          <summary className="text-link">Default Ideazo</summary>
          <pre className="thumb-prompt-default-pre">
            {DEFAULT_THUMBNAIL_STYLE_PROMPT}
          </pre>
        </details>
        <div className="stack" style={{ marginTop: "var(--space-2)" }}>
          <button
            type="button"
            className="btn-secondary btn-block"
            onClick={saveThumbStyle}
          >
            {thumbSaved ? t("settings.thumbnailsSaved") : t("common.save")}
          </button>
          <button
            type="button"
            className="text-link"
            onClick={resetThumbStyle}
          >
            {t("settings.thumbnailsReset")}
          </button>
        </div>

        <h3 className="section-title" style={{ marginTop: "var(--space-4)" }}>
          {t("settings.thumbRefs")}
        </h3>
        <p className="muted settings-block-lead">{t("settings.thumbRefsDesc")}</p>
        {refs.length > 0 ? (
          <div className="thumb-refs-grid">
            {refs.map((ref) => (
              <div key={ref.id} className="thumb-ref-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ref.imageDataUrl} alt={ref.name || ""} />
                <button
                  type="button"
                  className="thumb-ref-remove"
                  onClick={() => void onRemoveRef(ref.id)}
                >
                  {t("settings.thumbRefsRemove")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void onPickRefs(e.target.files)}
        />
        <button
          type="button"
          className="btn-secondary btn-block"
          disabled={refBusy || refs.length >= MAX_REFERENCE_IMAGES}
          onClick={() => fileRef.current?.click()}
        >
          {refBusy
            ? t("common.loading")
            : refs.length >= MAX_REFERENCE_IMAGES
              ? t("settings.thumbRefsFull")
              : t("settings.thumbRefsAdd")}
        </button>
        {refError ? <p className="error">{refError}</p> : null}
      </section>

      <nav className="settings-list" aria-label={t("settings.title")}>
        <Link href="/profile/versiones" className="settings-row">
          <div>
            <p className="settings-title">{t("settings.versionsLink")}</p>
            <p className="settings-desc">{t("settings.versionsLinkDesc")}</p>
          </div>
          <span className="chevron" aria-hidden>
            →
          </span>
        </Link>
      </nav>

      <p
        className="app-version-footer"
        aria-label={t("settings.versionFooter", { version: APP_VERSION })}
      >
        {t("settings.versionFooter", { version: APP_VERSION })}
      </p>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <RequireOnboarding>
      <SettingsBody />
    </RequireOnboarding>
  );
}
