"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function PrimaryNav({
  pathname,
  variant,
}: {
  pathname: string;
  variant: "bottom" | "side";
}) {
  const createActive = navActive(pathname, "/capture");
  const isSide = variant === "side";
  const root = isSide ? "side-nav" : "bottom-nav";
  const item = isSide ? "side-nav-item" : "bottom-nav-item";
  const itemActive = isSide
    ? "side-nav-item-active"
    : "bottom-nav-item-active";
  const create = isSide ? "side-nav-create" : "bottom-nav-create";
  const createActiveClass = isSide
    ? "side-nav-create-active"
    : "bottom-nav-create-active";

  return (
    <nav
      className={root}
      aria-label="Principal"
      {...(isSide ? { "data-desktop-nav": true } : { "data-mobile-nav": true })}
    >
      {isSide ? (
        <div className="side-nav-brand">
          <BrandMark size="sm" />
        </div>
      ) : null}

      {isSide ? (
        <>
          <Link
            href="/capture"
            className={`${create}${createActive ? ` ${createActiveClass}` : ""}`}
            aria-label="Nueva idea para un video"
          >
            <span className="side-nav-create-mark" aria-hidden>
              +
            </span>
            <span>Nueva idea</span>
          </Link>

          <Link
            href="/"
            className={`${item}${
              navActive(pathname, "/") ? ` ${itemActive}` : ""
            }`}
          >
            Inicio
          </Link>

          <Link
            href="/profile"
            className={`${item}${
              navActive(pathname, "/profile") ? ` ${itemActive}` : ""
            }`}
          >
            Perfil
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/"
            className={`${item}${
              navActive(pathname, "/") ? ` ${itemActive}` : ""
            }`}
          >
            Inicio
          </Link>

          <Link
            href="/capture"
            className={`${create}${
              createActive ? ` ${createActiveClass}` : ""
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
            className={`${item}${
              navActive(pathname, "/profile") ? ` ${itemActive}` : ""
            }`}
          >
            Perfil
          </Link>
        </>
      )}
    </nav>
  );
}

function backAriaLabel(backHref: string, backLabel?: string) {
  if (backLabel?.trim()) return backLabel.trim();
  if (backHref === "/") return "Volver a Inicio";
  if (backHref === "/ideas") return "Volver a Ideas";
  if (backHref === "/capture") return "Volver a Nueva idea";
  if (backHref === "/profile") return "Volver a Perfil";
  if (backHref.endsWith("/draft")) return "Volver a la guía";
  if (backHref.endsWith("/directions")) return "Volver a enfoques";
  if (backHref.endsWith("/script")) return "Volver al guion";
  if (/^\/ideas\/[^/]+$/.test(backHref)) return "Volver a la idea";
  return "Volver";
}

export function AppShell({
  children,
  title,
  backHref,
  backLabel,
  showNav = true,
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  /** Nombre accesible del control Volver (destino). */
  backLabel?: string;
  /** Ocultar en onboarding u pantallas especiales */
  showNav?: boolean;
}) {
  const pathname = usePathname();
  const showHeader = Boolean(title || backHref);

  return (
    <div
      className={`app-shell${showNav ? " app-shell-nav" : " app-shell-bare"}`}
    >
      <div className="app-atmosphere" aria-hidden />
      <div className="app-glow" aria-hidden />

      {showNav ? <PrimaryNav pathname={pathname} variant="side" /> : null}

      <div className="app-shell-body">
        {showHeader ? (
          <header className="app-header">
            <div className="app-header-row">
              {backHref ? (
                <Link
                  href={backHref}
                  className="back-link"
                  aria-label={backAriaLabel(backHref, backLabel)}
                >
                  ← Volver
                </Link>
              ) : (
                <span className="app-header-brand">
                  <BrandMark />
                </span>
              )}
              {title ? <h1 className="screen-title">{title}</h1> : <span />}
              <span className="header-spacer" aria-hidden />
            </div>
          </header>
        ) : null}

        <main className="app-main">{children}</main>
      </div>

      {showNav ? <PrimaryNav pathname={pathname} variant="bottom" /> : null}
    </div>
  );
}
