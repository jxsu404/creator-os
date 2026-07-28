/** Compresión / resize de imágenes en el navegador (canvas). */

export const THUMB_EXPORT_MAX_WIDTH = 1280;
export const THUMB_EXPORT_QUALITY = 0.82;
export const REF_IMAGE_MAX_WIDTH = 1024;
export const REF_IMAGE_QUALITY = 0.8;
export const MAX_REFERENCE_IMAGES = 3;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

/**
 * Reencoda a JPEG con ancho máximo. Reduce peso de data URLs
 * (las miniaturas crudas rompen localStorage y el render).
 */
export async function compressImageDataUrl(
  dataUrl: string,
  opts?: { maxWidth?: number; quality?: number }
): Promise<string> {
  if (typeof window === "undefined") return dataUrl;
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  const maxWidth = opts?.maxWidth ?? THUMB_EXPORT_MAX_WIDTH;
  const quality = opts?.quality ?? THUMB_EXPORT_QUALITY;

  const img = await loadImage(dataUrl);
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

/** File → data URL comprimido (para refs del usuario). */
export async function fileToCompressedDataUrl(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("No se pudo leer el archivo"));
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
  return compressImageDataUrl(raw, {
    maxWidth: opts?.maxWidth ?? REF_IMAGE_MAX_WIDTH,
    quality: opts?.quality ?? REF_IMAGE_QUALITY,
  });
}

/** Descarga un data URL como archivo. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function thumbFilename(title?: string): string {
  const base = (title || "miniatura")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "miniatura"}-${Date.now()}.jpg`;
}
