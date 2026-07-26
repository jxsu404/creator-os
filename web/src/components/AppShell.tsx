"use client";

import Link from "next/link";

export function AppShell({
  children,
  title,
  backHref,
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-row">
          {backHref ? (
            <Link href={backHref} className="back-link">
              ← Atrás
            </Link>
          ) : (
            <Link href="/" className="brand-mark">
              Creator OS
            </Link>
          )}
          {title ? <h1 className="screen-title">{title}</h1> : <span />}
          <Link href="/profile" className="header-link">
            Mi contenido
          </Link>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
