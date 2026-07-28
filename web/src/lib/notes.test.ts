import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NOTES_KEY,
  clearNotes,
  createBlankNote,
  deleteNote,
  getNote,
  getNotes,
  noteListTitle,
  notePreview,
  saveTextAsNote,
  upsertNote,
} from "./notes";

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const memory = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memory,
    configurable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
}

beforeEach(() => {
  installMemoryLocalStorage();
});

afterEach(() => {
  clearNotes();
});

describe("notes storage", () => {
  it("creates, lists and updates notes", () => {
    const note = createBlankNote();
    note.body = "Primera línea\nMás texto";
    upsertNote(note);
    expect(getNotes()).toHaveLength(1);
    expect(getNote(note.id)?.body).toContain("Primera línea");

    upsertNote({
      ...note,
      body: "Actualizado",
      updatedAt: new Date().toISOString(),
    });
    expect(getNote(note.id)?.body).toBe("Actualizado");
  });

  it("deletes notes", () => {
    const note = saveTextAsNote({ body: "borrar me" });
    expect(deleteNote(note.id)).toBe(true);
    expect(getNote(note.id)).toBeNull();
    expect(deleteNote(note.id)).toBe(false);
  });

  it("saveTextAsNote copies script text", () => {
    const note = saveTextAsNote({
      body: "Hook\n\nCuerpo",
      title: "Mi guion",
      sourceIdeaId: "idea_1",
    });
    expect(note.title).toBe("Mi guion");
    expect(note.sourceIdeaId).toBe("idea_1");
    expect(getNotes()[0].id).toBe(note.id);
  });

  it("noteListTitle falls back to first line", () => {
    expect(noteListTitle({ body: "## Gancho\nHola" })).toBe("Gancho");
    expect(noteListTitle({ title: "Explicit", body: "x" })).toBe("Explicit");
    expect(noteListTitle({ body: "   " })).toBe("Sin título");
  });

  it("notePreview flattens whitespace", () => {
    expect(notePreview({ body: "a\n\nb" }, 20)).toBe("a b");
  });

  it("clearNotes removes storage key", () => {
    saveTextAsNote({ body: "x" });
    clearNotes();
    expect(getNotes()).toHaveLength(0);
    expect(localStorage.getItem(NOTES_KEY)).toBeNull();
  });
});
