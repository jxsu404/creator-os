"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { usePrefs } from "@/components/PrefsProvider";
import {
  downloadDataUrl,
  thumbFilename,
} from "@/lib/image-compress";
import { getIdeas } from "@/lib/storage";
import {
  backfillGalleryFromIdeas,
  deleteGalleryThumb,
  listGalleryThumbs,
  type GalleryThumb,
} from "@/lib/thumbnail-gallery";

function GalleryBody() {
  const { t } = usePrefs();
  const [items, setItems] = useState<GalleryThumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryThumb | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      try {
        await backfillGalleryFromIdeas(getIdeas());
      } catch {
        /* ignore migrate errors */
      }
      setItems(await listGalleryThumbs());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  async function onDelete(id: string) {
    if (!window.confirm(t("gallery.deleteConfirm"))) return;
    await deleteGalleryThumb(id);
    if (selected?.id === id) setSelected(null);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function onDownload(item: GalleryThumb) {
    downloadDataUrl(item.imageDataUrl, thumbFilename(item.title));
  }

  return (
    <AppShell title={t("gallery.title")}>
      <p className="muted gallery-lead">{t("gallery.lead")}</p>

      {loading ? <p className="muted">{t("common.loading")}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <p className="muted">{t("gallery.empty")}</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <p className="idea-meta gallery-count">
          {t("gallery.count", { count: items.length })}
        </p>
      ) : null}

      <div className="gallery-grid">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="gallery-card"
            onClick={() => setSelected(item)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageDataUrl} alt="" className="gallery-card-img" />
            {item.title ? (
              <span className="gallery-card-title">{item.title}</span>
            ) : null}
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title || t("gallery.title")}
          onClick={() => setSelected(null)}
        >
          <div
            className="gallery-lightbox-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.imageDataUrl}
              alt={selected.title || ""}
              className="gallery-lightbox-img"
            />
            {selected.title ? (
              <p className="gallery-lightbox-title">{selected.title}</p>
            ) : null}
            {selected.thumbnailIdea ? (
              <p className="muted">{selected.thumbnailIdea}</p>
            ) : null}
            <div className="gallery-lightbox-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onDownload(selected)}
              >
                {t("gallery.download")}
              </button>
              {selected.ideaId ? (
                <Link
                  href={`/ideas/${selected.ideaId}/script`}
                  className="btn-secondary"
                >
                  {t("gallery.openIdea")}
                </Link>
              ) : null}
              <button
                type="button"
                className="text-link"
                onClick={() => void onDelete(selected.id)}
              >
                {t("gallery.delete")}
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => setSelected(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function GalleryPage() {
  return (
    <RequireOnboarding>
      <GalleryBody />
    </RequireOnboarding>
  );
}
