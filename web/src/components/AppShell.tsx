"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  title,
  backHref,
  showNav = true,
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  /** Ocultar en onboarding u pantallas especiales */
  showNav?: boolean;
}) {
  const pathname = usePathname();
  const createActive = navActive(pathname, "/capture");

  return (
    <div className={`app-shell${showNav ? " app-shell-nav" : ""}`}>
      <div className="app-atmosphere" aria-hidden />
      <div className="app-glow" aria-hidden />

      <header className="app-header">
        <div className="app-header-row">
          {backHref ? (
            <Link href={backHref} className="back-link">
              ← Volver
            </Link>
          ) : (
            <Link href="/" className="brand-mark">
              Ideazo
            </Link>
          )}
          {title ? <h1 className="screen-title">{title}</h1> : <span />}
          <span className="header-spacer" aria-hidden />
        </div>
      </header>

      <main className="app-main">{children}</main>

      {showNav ? (
        <nav className="bottom-nav" aria-label="Principal">
          <Link
            href="/"
            className={`bottom-nav-item${
              navActive(pathname, "/") ? " bottom-nav-item-active" : ""
            }`}
          >
            Inicio
          </Link>

          <Link
            href="/capture"
            className={`bottom-nav-create${
              createActive ? " bottom-nav-create-active" : ""
            }`}
            aria-label="Nueva idea para un video"
          >
            <span className="bottom-nav-create-orb" aria-hidden>
              <span className="bottom-nav-create-plus">+</span>
            </span>
            <span className="bottom-nav-create-label">Nueva</span>
          </Link>

          <Link
            href="/profile"
            className={`bottom-nav-item${
              navActive(pathname, "/profile") ? " bottom-nav-item-active" : ""
            }`}
          >
            Perfil
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
