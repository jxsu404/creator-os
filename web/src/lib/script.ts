import type { Draft } from "./types";

/** Une hook + cuerpo + cierre en un solo guion editable */
export function buildUnifiedScript(draft: Pick<Draft, "hook" | "scriptBody" | "closing">): string {
  return [draft.hook, draft.scriptBody, draft.closing]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}
