"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import {
  DOGFOOD_CRITERIA,
  autoHint,
  computeDogfoodStats,
  evaluateGo,
  loadDogfoodAnswers,
  saveDogfoodAnswers,
  type DogfoodAnswers,
} from "@/lib/dogfood";
import { getIdeas } from "@/lib/storage";
import { onSynced } from "@/lib/sync";

function DogfoodHub() {
  const [answers, setAnswers] = useState<DogfoodAnswers>({});
  const [stats, setStats] = useState({
    captured: 0,
    withDirections: 0,
    readyOrRecorded: 0,
  });

  useEffect(() => {
    function refresh() {
      setAnswers(loadDogfoodAnswers());
      setStats(computeDogfoodStats(getIdeas()));
    }
    refresh();
    return onSynced(refresh);
  }, []);

  const evaluation = useMemo(() => evaluateGo(answers), [answers]);

  function setAnswer(id: number, value: boolean) {
    const next = { ...answers, [String(id)]: value };
    setAnswers(next);
    saveDogfoodAnswers(next);
  }

  return (
    <AppShell title="Validación" backHref="/profile">
      <section className="section">
        <h2 className="section-title">Gate Usuario 1</h2>
        <p className="muted">
          Marca con honestidad después de usar Ideazo para videos reales. Meta:
          ≥6/8 en Sí, incluyendo #3 y #6. Detalle en{" "}
          <code>VALIDATION_USER1.md</code> / <code>LAUNCH.md</code>.
        </p>
        <div className="dogfood-stats">
          <p>
            Ideas: <strong>{stats.captured}</strong>
          </p>
          <p>
            Con 3 enfoques: <strong>{stats.withDirections}</strong>
          </p>
          <p>
            Listas / grabadas: <strong>{stats.readyOrRecorded}</strong>
          </p>
        </div>
      </section>

      <section className="section stack">
        {DOGFOOD_CRITERIA.map((c) => {
          const hint = autoHint(c, stats);
          const value = answers[String(c.id)];
          return (
            <div key={c.id} className="dogfood-row">
              <p className="dogfood-label">
                <span className="dogfood-num">#{c.id}</span> {c.label}
                {c.requiredForGo ? (
                  <span className="dogfood-required"> obligatorio</span>
                ) : null}
              </p>
              {hint !== null ? (
                <p className="muted dogfood-hint">
                  Señal automática: {hint ? "en verde con tus ideas" : "aún no"}
                </p>
              ) : null}
              <div className="dogfood-actions">
                <button
                  type="button"
                  className={
                    value === true ? "btn-primary" : "btn-secondary"
                  }
                  onClick={() => setAnswer(c.id, true)}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className={
                    value === false ? "btn-primary" : "btn-secondary"
                  }
                  onClick={() => setAnswer(c.id, false)}
                >
                  No
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="section">
        <div
          className={
            evaluation.go ? "dogfood-verdict dogfood-go" : "dogfood-verdict"
          }
        >
          <p className="dogfood-verdict-title">
            {evaluation.go
              ? "Go — listo para soft launch / visibilidad"
              : "Aún no hay go"}
          </p>
          <p className="muted">
            Sí: {evaluation.yesCount}/8
            {evaluation.missingRequired.length
              ? ` · Faltan obligatorios: ${evaluation.missingRequired
                  .map((n) => `#${n}`)
                  .join(", ")}`
              : null}
          </p>
        </div>
        <Link href="/profile" className="text-link">
          Volver al perfil
        </Link>
      </section>
    </AppShell>
  );
}

export default function ValidacionPage() {
  return (
    <RequireOnboarding>
      <DogfoodHub />
    </RequireOnboarding>
  );
}
