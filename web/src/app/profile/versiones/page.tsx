"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { usePrefs } from "@/components/PrefsProvider";
import { APP_VERSION } from "@/lib/app-version";
import { RELEASES } from "@/lib/releases";

function VersionsBody() {
  const { t } = usePrefs();

  return (
    <AppShell title={t("versions.title")} backHref="/profile">
      <p className="muted versions-lead">{t("versions.lead")}</p>

      {RELEASES.length === 0 ? (
        <p className="muted">{t("versions.empty")}</p>
      ) : (
        <ol className="versions-list">
          {RELEASES.map((release) => {
            const isCurrent = release.version === APP_VERSION;
            return (
              <li
                key={release.version}
                className={`versions-card${isCurrent ? " versions-card-current" : ""}`}
              >
                <div className="versions-card-head">
                  <h2 className="versions-version">
                    v{release.version}
                    {release.title ? (
                      <span className="versions-title-tag">
                        {" "}
                        · {release.title}
                      </span>
                    ) : null}
                  </h2>
                  <div className="versions-meta">
                    {isCurrent ? (
                      <span className="versions-badge">
                        {t("versions.current")}
                      </span>
                    ) : null}
                    {release.date ? (
                      <time dateTime={release.date}>{release.date}</time>
                    ) : null}
                  </div>
                </div>
                <ul className="versions-highlights">
                  {release.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}

      <p className="versions-back-wrap">
        <Link href="/profile/ajustes" className="text-link">
          {t("settings.title")}
        </Link>
      </p>
    </AppShell>
  );
}

export default function VersionsPage() {
  return (
    <RequireOnboarding>
      <VersionsBody />
    </RequireOnboarding>
  );
}
