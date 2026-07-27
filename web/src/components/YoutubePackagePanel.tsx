"use client";

import { useState } from "react";
import {
  isUsageLimitPayload,
  UpgradePrompt,
} from "@/components/UpgradePrompt";
import { applyGenerationBilling } from "@/lib/apply-generation-billing";
import type { Idea, YoutubeUploadPackage } from "@/lib/types";

type Props = {
  idea: Idea;
  script: string;
  profileContext: string;
  onSave: (pkg: YoutubeUploadPackage) => void;
  onThumbnail: (thumbnailUrl: string) => void;
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
  onThumbnail,
}: Props) {
  const pkg = idea.youtubePackage;
  const [options, setOptions] = useState<YoutubeUploadPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [copied, setCopied] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    setNeedsUpgrade(false);
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
      if (!res.ok) {
        if (res.status === 402 || isUsageLimitPayload(data)) {
          setNeedsUpgrade(true);
        }
        throw new Error(data.error || "Error al generar");
      }
      void applyGenerationBilling(data.billing);
      const list = Array.isArray(data.packages)
        ? (data.packages as YoutubeUploadPackage[])
        : [];
      if (list.length < 3) {
        throw new Error("No llegaron 3 opciones. Intenta de nuevo.");
      }
      setOptions(list.slice(0, 3));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude generar las opciones.");
    } finally {
      setBusy(false);
    }
  }

  function chooseOption(chosen: YoutubeUploadPackage) {
    onSave(chosen);
    setOptions(null);
  }

  function requestOtherOptions() {
    if (
      pkg &&
      !window.confirm(
        "¿Generar otras 3 opciones? Se reemplazará el paquete actual cuando elijas una."
      )
    ) {
      return;
    }
    void generate();
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

  async function generateThumbnail() {
    if (!pkg?.thumbnailIdea.trim()) {
      setError("Escribe una idea de miniatura primero.");
      return;
    }
    setThumbBusy(true);
    setError("");
    setNeedsUpgrade(false);
    try {
      const res = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbnailIdea: pkg.thumbnailIdea,
          title: pkg.title || idea.title,
          ideaText: idea.rawText,
          profileContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || isUsageLimitPayload(data)) {
          setNeedsUpgrade(true);
        }
        throw new Error(data.error || "Error al generar la miniatura");
      }
      void applyGenerationBilling(data.billing);
      const url =
        typeof data.imageDataUrl === "string" ? data.imageDataUrl.trim() : "";
      if (!url.startsWith("data:image/")) {
        throw new Error("No llegó una imagen válida.");
      }
      onThumbnail(url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pude generar la miniatura."
      );
    } finally {
      setThumbBusy(false);
    }
  }

  const showingPicker = Boolean(options?.length);
  const showEditor = Boolean(pkg) && !showingPicker;

  return (
    <section className="section yt-package">
      <div className="section-head">
        <h2 className="section-title">Subir a YouTube / TikTok</h2>
      </div>
      <p className="muted">
        Tres opciones de título, descripción y etiquetas. Eliges una, editas si
        hace falta y pegas al subir.
      </p>

      {!showingPicker && !busy ? (
        <button
          type="button"
          className="btn-secondary btn-block"
          disabled={!script.trim()}
          onClick={() => {
            if (pkg) {
              requestOtherOptions();
              return;
            }
            void generate();
          }}
        >
          {pkg ? "Otras 3 opciones" : "Generar 3 opciones"}
        </button>
      ) : null}

      {busy ? <p className="muted">Armando opciones…</p> : null}

      {needsUpgrade ? <UpgradePrompt message={error} compact /> : null}

      {error && !needsUpgrade ? <p className="error">{error}</p> : null}

      {showingPicker && options ? (
        <div className="stack yt-package-options">
          {options.map((opt, i) => (
            <article key={`${opt.title}-${i}`} className="direction-card">
              <h3 className="direction-name">
                {opt.label?.trim() || `Opción ${i + 1}`}
              </h3>
              <p className="yt-option-title">{opt.title}</p>
              <p className="muted yt-option-desc">
                {opt.description.slice(0, 140)}
                {opt.description.length > 140 ? "…" : ""}
              </p>
              <p className="idea-meta">
                {opt.tags.slice(0, 4).join(" · ")}
                {opt.tags.length > 4 ? "…" : ""}
              </p>
              <button
                type="button"
                className="btn-primary btn-block"
                disabled={busy}
                onClick={() => chooseOption(opt)}
              >
                Elegir
              </button>
            </article>
          ))}
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => void generate()}
          >
            Otras opciones
          </button>
          {pkg ? (
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => setOptions(null)}
            >
              Seguir con el paquete actual
            </button>
          ) : null}
        </div>
      ) : null}

      {showEditor && pkg ? (
        <div className="yt-package-fields">
          {pkg.label ? (
            <p className="idea-meta">Elegiste: {pkg.label}</p>
          ) : null}

          <label className="field-label" htmlFor="yt-pkg-title">
            Título / caption ({pkg.title.length}/100)
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

          {idea.thumbnailUrl ? (
            <div className="yt-thumb-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={idea.thumbnailUrl} alt="Miniatura generada" />
            </div>
          ) : null}

          <button
            type="button"
            className="btn-secondary btn-block"
            disabled={thumbBusy || !pkg.thumbnailIdea.trim()}
            onClick={() => void generateThumbnail()}
          >
            {thumbBusy
              ? "Generando miniatura…"
              : idea.thumbnailUrl
                ? "Regenerar miniatura"
                : "Generar miniatura"}
          </button>
          <p className="idea-meta">
            Usa 1 generación del cupo. La imagen queda en esta idea.
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
