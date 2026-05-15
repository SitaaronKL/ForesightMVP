"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { TopicChipList } from "../TopicChip";
import { EncounterDetailModal } from "./EncounterDetailModal";

export function EncountersTab({ patientId }: { patientId: Id<"patients"> }) {
  const encounters = useQuery(api.queries.patients.encountersList, { patientId });
  const [openId, setOpenId] = useState<Id<"encounters"> | null>(null);

  if (!encounters) return <div className="glass p-6 text-brand-500">Loading…</div>;
  if (encounters.length === 0) {
    return (
      <div className="glass p-6 text-brand-500 italic text-sm">
        No encounters logged.
      </div>
    );
  }
  return (
    <>
      <div className="glass p-5">
        <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
          All encounters
        </h3>
        <ul className="space-y-1">
          {encounters.map((e) => {
            const typeLabel = e.type
              .replace("_", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const minutes = Math.round(e.durationSeconds / 60);
            const statusLabel =
              e.status.charAt(0).toUpperCase() + e.status.slice(1);
            return (
              <li
                key={e._id}
                onClick={() => setOpenId(e._id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    setOpenId(e._id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open encounter from ${new Date(e.startedAt).toLocaleDateString()}`}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-foresight/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-brand-950">
                    {new Date(e.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-brand-500">
                    {typeLabel} · {minutes} Min · {statusLabel}
                  </div>
                </div>
                <span onClick={(ev) => ev.stopPropagation()} className="flex-shrink-0">
                  <TopicChipList topics={e.topicTags} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <EncounterDetailModal
        encounterId={openId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
