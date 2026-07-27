"use client";

import { useState } from "react";
import { applyGenerationBilling } from "@/lib/apply-generation-billing";
import type { Idea, YoutubeUploadPackage } from "@/lib/types";

type Props = {
  idea: Idea;
  script: string;
  profileContext: string;
  onSave: (pkg: YoutubeUploadPackage) => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function YoutubePackagePanel({
  idea,
  script,
  profileContext,
  onSave,
}: Props) {
  const pkg = idea.youtubePackage;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const direction = idea.directions?.find(
        (d) => d.id === idea.selectedDirectionId
      );
      const res = await fetch("/api/generate-youtube-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: idea.rawText,
          existingTitle: idea.title,
          profileContext,
          script,
          direction: direction
            ? {
                name: direction.name,
                promise: direction.promise,
                angle: direction.angle,
                hook: direction.hook,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar");
      void applyGenerationBilling(data.billing);
      onSave(data.package as YoutubeUploadPackage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude generar el paquete.");
    } finally {
      setBusy(false);
    }
  }

  function patch(partial: Partial<YoutubeUploadPackage>) {
    if (!pkg) return;
    onSave({ ...pkg, ...partial });
  }

  async function markCopied(key: string, text: string) {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <section className="section yt-package">
      <div className="section-head">
        <h2 className="section-title">Subir a YouTube</h2>
      </div>
      <p className="muted">
        Genera título, descripción, etiquetas e idea de miniatura para pegar en
        YouTube Studio.
      </p>

      <button
        type="button"
        className="btn-secondary btn-block"
        disabled={busy || !script.trim()}
        onClick={() => void generate()}
      >
        {busy
          ? "Generando…"
          : pkg
            ? "Regenerar datos de YouTube"
            : "Generar datos de YouTube"}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {pkg ? (
        <div className="yt-package-fields">
          <label className="field-label" htmlFor="yt-pkg-title">
            Título ({pkg.title.length}/100)
          </label>
          <input
            id="yt-pkg-title"
            className="field"
            maxLength={100}
            value={pkg.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
          <button
            type="button"
            className="text-link"
            onClick={() => void markCopied("title", pkg.title)}
          >
            {copied === "title" ? "Copiado" : "Copiar título"}
          </button>

          <label className="field-label" htmlFor="yt-pkg-desc">
            Descripción
          </label>
          <textarea
            id="yt-pkg-desc"
            className="field field-lg"
            rows={8}
            maxLength={5000}
            value={pkg.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
          <button
            type="button"
            className="text-link"
            onClick={() => void markCopied("desc", pkg.description)}
          >
            {copied === "desc" ? "Copiado" : "Copiar descripción"}
          </button>

          <label className="field-label" htmlFor="yt-pkg-tags">
            Etiquetas (separadas por coma)
          </label>
          <input
            id="yt-pkg-tags"
            className="field"
            value={pkg.tags.join(", ")}
            onChange={(e) =>
              patch({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
          <button
            type="button"
            className="text-link"
            onClick={() => void markCopied("tags", pkg.tags.join(", "))}
          >
            {copied === "tags" ? "Copiado" : "Copiar etiquetas"}
          </button>

          <label className="field-label" htmlFor="yt-pkg-thumb">
            Idea de miniatura (1 renglón)
          </label>
          <input
            id="yt-pkg-thumb"
            className="field"
            maxLength={160}
            value={pkg.thumbnailIdea}
            onChange={(e) => patch({ thumbnailIdea: e.target.value })}
          />
          <button
            type="button"
            className="text-link"
            onClick={() => void markCopied("thumb", pkg.thumbnailIdea)}
          >
            {copied === "thumb" ? "Copiado" : "Copiar idea"}
          </button>

          <button
            type="button"
            className="btn-secondary btn-block"
            disabled
            title="Futuro: IA de imagen (Gemini / Grok Imagine)"
          >
            Generar miniatura
          </button>
          <p className="idea-meta yt-package-future">
            Pronto: con este botón la IA creará la imagen a partir de la idea.
          </p>

          <button
            type="button"
            className="btn-primary btn-block"
            onClick={() =>
              void markCopied(
                "all",
                [
                  pkg.title,
                  "",
                  pkg.description,
                  "",
                  `Etiquetas: ${pkg.tags.join(", ")}`,
                  "",
                  `Miniatura: ${pkg.thumbnailIdea}`,
                ].join("\n")
              )
            }
          >
            {copied === "all" ? "Todo copiado" : "Copiar todo"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
