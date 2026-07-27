"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/ideas", label: "Ideas" },
  { href: "/profile", label: "Perfil" },
] as const;

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

  return (
    <div className={`app-shell${showNav ? " app-shell-nav" : ""}`}>
      <header className="app-header">
        <div className="app-header-row">
          {backHref ? (
            <Link href={backHref} className="back-link">
              ← Volver
            </Link>
          ) : (
            <Link href="/" className="brand-mark">
              Creator OS
            </Link>
          )}
          {title ? <h1 className="screen-title">{title}</h1> : <span />}
          <span className="header-spacer" aria-hidden />
        </div>
      </header>
      <main className="app-main">{children}</main>
      {showNav ? (
        <nav className="bottom-nav" aria-label="Principal">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bottom-nav-item${active ? " bottom-nav-item-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
