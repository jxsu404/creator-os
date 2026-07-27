import Link from "next/link";
import { IdeaThumb } from "@/components/IdeaThumb";
import { IdeaLabels } from "@/components/IdeaLabels";
import { ideaHref } from "@/lib/idea-href";
import { ideaTitle } from "@/lib/idea-title";
import type { Idea } from "@/lib/types";

export function IdeaRow({ idea, niches }: { idea: Idea; niches: string[] }) {
  return (
    <Link href={ideaHref(idea)} className="idea-row idea-row-media">
      <IdeaThumb idea={idea} niches={niches} />
      <div className="idea-row-body">
        <p className="idea-text">{ideaTitle(idea)}</p>
        <IdeaLabels idea={idea} niches={niches} />
      </div>
      <span className="chevron" aria-hidden>
        →
      </span>
    </Link>
  );
}
