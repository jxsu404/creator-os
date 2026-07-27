"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { usePrefs } from "@/components/PrefsProvider";
import { APP_VERSION } from "@/lib/app-version";
import type { LocalePref, ThemePref } from "@/lib/prefs";

function SettingsBody() {
  const { prefs, setTheme, setLocale, setReduceMotion, t } = usePrefs();

  const themes: { id: ThemePref; label: string }[] = [
    { id: "system", label: t("settings.themeSystem") },
    { id: "light", label: t("settings.themeLight") },
    { id: "dark", label: t("settings.themeDark") },
  ];

  const locales: { id: LocalePref; label: string }[] = [
    { id: "es", label: t("settings.localeEs") },
    { id: "en", label: t("settings.localeEn") },
  ];

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

      <p className="app-version-footer" aria-label={t("settings.versionFooter", { version: APP_VERSION })}>
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
