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
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-brand-500 border-b border-brand-100">
              <th className="py-2 font-semibold">Date</th>
              <th className="py-2 font-semibold">Type</th>
              <th className="py-2 font-semibold">Duration</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Topics</th>
            </tr>
          </thead>
          <tbody>
            {encounters.map((e) => (
              <tr
                key={e._id}
                onClick={() => setOpenId(e._id)}
                className="border-b border-brand-50 last:border-0 cursor-pointer hover:bg-foresight/5 transition-colors"
                tabIndex={0}
                role="button"
                aria-label={`Open encounter from ${new Date(e.startedAt).toLocaleDateString()}`}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    setOpenId(e._id);
                  }
                }}
              >
                <td className="py-2 text-brand-950">
                  {new Date(e.startedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-2 text-brand-700 capitalize">
                  {e.type.replace("_", " ")}
                </td>
                <td className="py-2 text-brand-700">
                  {Math.round(e.durationSeconds / 60)} min
                </td>
                <td className="py-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                      e.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                <td
                  className="py-2"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <TopicChipList topics={e.topicTags} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EncounterDetailModal
        encounterId={openId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
