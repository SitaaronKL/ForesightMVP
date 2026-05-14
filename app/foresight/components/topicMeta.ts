export type TopicMeta = {
  label: string;
  description: string;
};

export const TOPIC_META: Record<string, TopicMeta> = {
  refill: {
    label: "Medication refill",
    description:
      "The patient requested or was prescribed a refill of one or more medications during this encounter.",
  },
  lab_followup: {
    label: "Lab follow-up",
    description:
      "Discussion of recent lab results and next steps based on the values returned.",
  },
  symptom_check: {
    label: "Symptom check",
    description:
      "The nurse triaged new or worsening symptoms reported by the patient.",
  },
  care_plan_review: {
    label: "Care plan review",
    description:
      "The patient's care plan goals, medications, or service elements were reviewed and possibly updated.",
  },
};

const FALLBACK_DESCRIPTION =
  "Topic tag captured during the encounter. No formal description yet.";

export function getTopicMeta(key: string): TopicMeta {
  if (TOPIC_META[key]) return TOPIC_META[key];
  // Fallback: turn "snake_case" or "kebab-case" into "Title Case".
  const label = key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
  return {
    label: label || key,
    description: FALLBACK_DESCRIPTION,
  };
}
