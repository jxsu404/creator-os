import { createId } from "./id";
import type { TextNote } from "./types";

export const NOTES_KEY = "creatoros_notes_v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readNotesRaw(): TextNote[] {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(NOTES_KEY);
  if (!raw) return [];
  try {
    const notes = JSON.parse(raw) as TextNote[];
    return Array.isArray(notes) ? notes.filter(isValidNote) : [];
  } catch {
    return [];
  }
}

function isValidNote(n: unknown): n is TextNote {
  if (!n || typeof n !== "object") return false;
  const o = n as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.body === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

function writeNotes(notes: TextNote[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getNotes(): TextNote[] {
  return readNotesRaw().sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getNote(id: string): TextNote | null {
  return readNotesRaw().find((n) => n.id === id) ?? null;
}

export function upsertNote(note: TextNote): void {
  const notes = readNotesRaw();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.unshift(note);
  writeNotes(notes);
}

export function deleteNote(id: string): boolean {
  const notes = readNotesRaw();
  const next = notes.filter((n) => n.id !== id);
  if (next.length === notes.length) return false;
  writeNotes(next);
  return true;
}

export function clearNotes(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(NOTES_KEY);
}

/** Primera línea útil como título de lista. */
export function noteListTitle(note: Pick<TextNote, "title" | "body">): string {
  const explicit = note.title?.trim();
  if (explicit) return explicit.slice(0, 80);
  const line =
    note.body
      .split(/\r?\n/)
      .map((l) => l.replace(/^#+\s*/, "").trim())
      .find(Boolean) || "";
  if (!line) return "Sin título";
  return line.length > 80 ? `${line.slice(0, 77)}…` : line;
}

export function notePreview(note: Pick<TextNote, "body">, max = 100): string {
  const flat = note.body.replace(/\s+/g, " ").trim();
  if (!flat) return "Nota vacía";
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function createBlankNote(): TextNote {
  const now = new Date().toISOString();
  return {
    id: createId("note"),
    body: "",
    createdAt: now,
    updatedAt: now,
  };
}

/** Copia un guion/texto a una nota nueva. */
export function saveTextAsNote(opts: {
  body: string;
  title?: string;
  sourceIdeaId?: string;
}): TextNote {
  const now = new Date().toISOString();
  const note: TextNote = {
    id: createId("note"),
    body: opts.body,
    createdAt: now,
    updatedAt: now,
    ...(opts.title?.trim() ? { title: opts.title.trim().slice(0, 120) } : {}),
    ...(opts.sourceIdeaId ? { sourceIdeaId: opts.sourceIdeaId } : {}),
  };
  upsertNote(note);
  return note;
}
