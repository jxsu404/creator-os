/** Galería de miniaturas generadas (IndexedDB — no cabe en localStorage). */

export type GalleryThumb = {
  id: string;
  createdAt: string;
  imageDataUrl: string;
  ideaId?: string;
  title?: string;
  thumbnailIdea?: string;
};

const DB_NAME = "ideazo_thumbs_v1";
const DB_VERSION = 1;
const STORE = "gallery";
const REFS_STORE = "refs";

export type ThumbRef = {
  id: string;
  createdAt: string;
  imageDataUrl: string;
  name?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const gallery = db.createObjectStore(STORE, { keyPath: "id" });
        gallery.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(REFS_STORE)) {
        db.createObjectStore(REFS_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

export async function listGalleryThumbs(): Promise<GalleryThumb[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as GalleryThumb[]) || [];
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      resolve(rows);
    };
    req.onerror = () => reject(req.error ?? new Error("list failed"));
  });
}

export async function addGalleryThumb(
  entry: Omit<GalleryThumb, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): Promise<GalleryThumb> {
  const item: GalleryThumb = {
    id: entry.id || `thumb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    imageDataUrl: entry.imageDataUrl,
    ideaId: entry.ideaId,
    title: entry.title,
    thumbnailIdea: entry.thumbnailIdea,
  };
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(item);
  await txDone(tx);
  return item;
}

export async function deleteGalleryThumb(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
}

export async function getGalleryThumb(
  id: string
): Promise<GalleryThumb | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as GalleryThumb) || null);
    req.onerror = () => reject(req.error ?? new Error("get failed"));
  });
}

/** Importa miniaturas ya guardadas en ideas (migración one-shot). */
export async function backfillGalleryFromIdeas(
  ideas: Array<{
    id: string;
    title?: string;
    thumbnailUrl?: string;
    youtubePackage?: { thumbnailIdea?: string } | null;
  }>
): Promise<number> {
  const existing = await listGalleryThumbs();
  const seenIdeaIds = new Set(
    existing.map((e) => e.ideaId).filter(Boolean) as string[]
  );
  let added = 0;
  for (const idea of ideas) {
    const url = idea.thumbnailUrl?.trim();
    if (!url?.startsWith("data:image/")) continue;
    if (seenIdeaIds.has(idea.id)) continue;
    await addGalleryThumb({
      imageDataUrl: url,
      ideaId: idea.id,
      title: idea.title,
      thumbnailIdea: idea.youtubePackage?.thumbnailIdea,
    });
    seenIdeaIds.add(idea.id);
    added += 1;
  }
  return added;
}

export async function listThumbRefs(): Promise<ThumbRef[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REFS_STORE, "readonly");
    const req = tx.objectStore(REFS_STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as ThumbRef[]) || [];
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      resolve(rows);
    };
    req.onerror = () => reject(req.error ?? new Error("list refs failed"));
  });
}

export async function addThumbRef(
  entry: Omit<ThumbRef, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<ThumbRef> {
  const item: ThumbRef = {
    id: entry.id || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt || new Date().toISOString(),
    imageDataUrl: entry.imageDataUrl,
    name: entry.name,
  };
  const db = await openDb();
  const tx = db.transaction(REFS_STORE, "readwrite");
  tx.objectStore(REFS_STORE).put(item);
  await txDone(tx);
  return item;
}

export async function deleteThumbRef(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(REFS_STORE, "readwrite");
  tx.objectStore(REFS_STORE).delete(id);
  await txDone(tx);
}
