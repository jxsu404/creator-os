"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { usePrefs } from "@/components/PrefsProvider";
import { APP_VERSION } from "@/lib/app-version";
import type { LocalePref, ThemePref } from "@/lib/prefs";
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

  useEffect(() => {
    setThumbDraft(prefs.thumbnailStylePrompt);
  }, [prefs.thumbnailStylePrompt]);

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
          rows={6}
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
