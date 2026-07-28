import type { Draft, ScriptBlock } from "./types";

/** Une hook + (bloques o cuerpo) + cierre en un solo guion editable. */
export function buildUnifiedScript(
  draft: Pick<Draft, "hook" | "scriptBody" | "closing" | "blocks">
): string {
  const parts: string[] = [];
  const hook = draft.hook?.trim();
  if (hook) parts.push(hook);

  const blocks = draft.blocks?.filter((b) => b.title?.trim() || b.body?.trim());
  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      const title = block.title.trim();
      const body = block.body.trim();
      if (title && body) {
        parts.push(`## ${title}\n\n${body}`);
      } else if (title) {
        parts.push(`## ${title}`);
      } else if (body) {
        parts.push(body);
      }
    }
  } else {
    const body = draft.scriptBody?.trim();
    if (body) parts.push(body);
  }

  const closing = draft.closing?.trim();
  if (closing) parts.push(closing);

  return parts.join("\n\n");
}

/** Une solo los cuerpos de bloques (compat con scriptBody en APIs/validación). */
export function joinBlockBodies(blocks: ScriptBlock[]): string {
  return blocks
    .map((b) => b.body.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function formatEstimatedDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 180) return `~${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  return `~${mins} min`;
}
