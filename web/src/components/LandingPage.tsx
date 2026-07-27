"use client";

import Link from "next/link";

function ProductStage() {
  return (
    <div className="lp-stage" aria-hidden>
      <div className="lp-stage-glow" />
      <div className="lp-phone">
        <div className="lp-phone-bezel">
          <div className="lp-phone-notch" />
          <div className="lp-phone-screen">
            <p className="lp-phone-brand">Ideazo</p>
            <div className="lp-flow">
              <div className="lp-flow-step lp-flow-step-1">
                <span className="lp-flow-label">Idea</span>
                <p className="lp-flow-text">
                  Cómo explicar un tip sin aburrir
                </p>
              </div>
              <div className="lp-flow-step lp-flow-step-2">
                <span className="lp-flow-label">3 enfoques</span>
                <ul className="lp-flow-list">
                  <li>Error común → fix rápido</li>
                  <li>Showcase en 20s</li>
                  <li>Opinión con prueba</li>
                </ul>
              </div>
              <div className="lp-flow-step lp-flow-step-3">
                <span className="lp-flow-label">Lista</span>
                <p className="lp-flow-text">Hook + guion + tomas</p>
                <span className="lp-flow-ready">Lista para grabar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lp-orbit lp-orbit-a" />
      <div className="lp-orbit lp-orbit-b" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="lp">
      <div className="lp-atmosphere" aria-hidden />

      <header className="lp-nav">
        <p className="lp-nav-brand">Ideazo</p>
        <div className="lp-nav-actions">
          <Link href="/pricing" className="lp-nav-link">
            Precios
          </Link>
          <Link href="/login" className="lp-nav-link">
            Entrar
          </Link>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <h1 className="lp-brand">Ideazo</h1>
          <p className="lp-headline">De idea vaga a lista para grabar.</p>
          <p className="lp-sub">
            Tres enfoques. Tú eliges. Sin sustituir tu criterio.
          </p>
          <div className="lp-cta">
            <Link href="/login" className="lp-btn-primary">
              Empezar gratis
            </Link>
            <a href="#precios" className="lp-btn-ghost">
              Ver planes
            </a>
          </div>
        </div>
        <ProductStage />
      </section>

      <section id="como" className="lp-section">
        <h2 className="lp-section-title">Un solo camino</h2>
        <p className="lp-section-sub">
          Capturas. Eliges un enfoque. Sales con una guía grabable.
        </p>
        <ol className="lp-steps">
          <li className="lp-step">
            <span className="lp-step-num">01</span>
            <div>
              <h3 className="lp-step-title">Captura la chispa</h3>
              <p className="lp-step-body">
                Anota lo que se te ocurrió. No hace falta que esté claro.
              </p>
            </div>
          </li>
          <li className="lp-step">
            <span className="lp-step-num">02</span>
            <div>
              <h3 className="lp-step-title">Elige un enfoque</h3>
              <p className="lp-step-body">
                Tres direcciones distintas. Quedas con la que suene a tu video.
              </p>
            </div>
          </li>
          <li className="lp-step">
            <span className="lp-step-num">03</span>
            <div>
              <h3 className="lp-step-title">Graba con guía</h3>
              <p className="lp-step-body">
                Hook, guion y tomas. Editas hasta que sea tuyo.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section id="precios" className="lp-section">
        <h2 className="lp-section-title">Free y Pro</h2>
        <p className="lp-section-sub">
          Prueba el loop de verdad. Pasa a Pro cuando se te acaben las
          generaciones.
        </p>
        <div className="lp-pricing">
          <div className="lp-price-card">
            <p className="lp-price-name">Free</p>
            <p className="lp-price-amount">
              $0<span>/mes</span>
            </p>
            <ul className="lp-price-list">
              <li>15 generaciones IA / mes</li>
              <li>Loop completo idea → lista</li>
              <li>Sync celular ↔ PC</li>
            </ul>
            <Link href="/login" className="lp-btn-ghost lp-price-cta">
              Empezar
            </Link>
          </div>
          <div className="lp-price-card lp-price-card-pro">
            <p className="lp-price-name">Pro</p>
            <p className="lp-price-amount">
              $14<span>/mes</span>
            </p>
            <ul className="lp-price-list">
              <li>500 generaciones / mes</li>
              <li>Prioridad cuando hay carga</li>
              <li>Mismo loop, sin freno</li>
            </ul>
            <Link href="/pricing" className="lp-btn-primary lp-price-cta">
              Ver Pro
            </Link>
          </div>
        </div>
        <p className="lp-price-note">
          También $119/año.{" "}
          <Link href="/waitlist">Lista de espera</Link> si el soft launch está
          cerrado.
        </p>
      </section>

      <footer className="lp-footer">
        <p>Ideazo</p>
        <div className="lp-footer-links">
          <Link href="/terms">Términos</Link>
          <Link href="/privacy">Privacidad</Link>
          <Link href="/login">Abrir Ideazo</Link>
        </div>
      </footer>
    </div>
  );
}
