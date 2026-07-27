import { en } from "@/lib/i18n/en";
import { es, type MessageTree } from "@/lib/i18n/es";
import type { LocalePref } from "@/lib/prefs";

const catalogs: Record<LocalePref, MessageTree> = { es, en };

type Leaves<T, P extends string = ""> = T extends string
  ? P
  : {
      [K in keyof T & string]: Leaves<
        T[K],
        P extends "" ? K : `${P}.${K}`
      >;
    }[keyof T & string];

export type MessageKey = Leaves<MessageTree>;

function getByPath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = tree;
  for (const part of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  locale: LocalePref,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const raw =
    getByPath(catalogs[locale], key) ??
    getByPath(catalogs.es, key) ??
    key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`
  );
}
