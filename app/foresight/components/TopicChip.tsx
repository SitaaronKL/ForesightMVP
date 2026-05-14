"use client";

import { HelpHint } from "./HelpHint";
import { getTopicMeta } from "./topicMeta";

export function TopicChip({ topic }: { topic: string }) {
  const { label, description } = getTopicMeta(topic);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-medium px-2 py-0.5 border border-brand-100">
      {label}
      <HelpHint width={260} size={11}>
        {description}
      </HelpHint>
    </span>
  );
}

export function TopicChipList({ topics }: { topics: string[] | undefined }) {
  if (!topics || topics.length === 0) {
    return <span className="text-brand-400 text-xs">—</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {topics.map((t) => (
        <TopicChip key={t} topic={t} />
      ))}
    </span>
  );
}
