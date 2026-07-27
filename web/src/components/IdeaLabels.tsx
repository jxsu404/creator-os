import type { Idea } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import {
  categoryColorKey,
  categoryDisplayLabel,
  ideaStatusGroup,
  STATUS_GROUP_TONE,
} from "@/lib/idea-labels";

type IdeaLabelsProps = {
  idea: Idea;
  niches?: string[];
  /** Show status chip (default true). */
  showStatus?: boolean;
  /** Show category chip (default true). */
  showCategory?: boolean;
};

export function IdeaLabels({
  idea,
  niches = [],
  showStatus = true,
  showCategory = true,
}: IdeaLabelsProps) {
  const group = ideaStatusGroup(idea.status);
  const statusTone = group ? STATUS_GROUP_TONE[group] : "gray";
  const category = showCategory ? categoryDisplayLabel(idea, niches) : null;
  const catKey = category ? categoryColorKey(idea, niches) : null;

  if (!showStatus && !category) return null;

  return (
    <span className="idea-labels">
      {showStatus ? (
        <span className={`idea-label idea-label-status tone-${statusTone}`}>
          {STATUS_LABEL[idea.status]}
        </span>
      ) : null}
      {category && catKey ? (
        <span className={`idea-label idea-label-cat cat-${catKey}`}>
          {category}
        </span>
      ) : null}
    </span>
  );
}
