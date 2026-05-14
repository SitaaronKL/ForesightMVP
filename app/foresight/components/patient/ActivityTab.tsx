"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import {
  Phone,
  Hospital,
  MessageSquare,
  FileText,
  Inbox as InboxIcon,
} from "lucide-react";
import { EncounterDetailModal } from "./EncounterDetailModal";
import { HelpHint } from "../HelpHint";

type Kind =
  | "encounter"
  | "hospital_event"
  | "portal_message"
  | "care_plan_version";

const KIND_META: Record<
  Kind,
  { label: string; Icon: typeof Phone; tint: string; iconColor: string }
> = {
  encounter: {
    label: "Encounter",
    Icon: Phone,
    tint: "bg-foresight/10 border-foresight/25",
    iconColor: "text-foresight",
  },
  hospital_event: {
    label: "Hospital",
    Icon: Hospital,
    tint: "bg-amber-100 border-amber-300",
    iconColor: "text-amber-700",
  },
  portal_message: {
    label: "Message",
    Icon: MessageSquare,
    tint: "bg-violet-100 border-violet-300",
    iconColor: "text-violet-700",
  },
  care_plan_version: {
    label: "Care plan",
    Icon: FileText,
    tint: "bg-teal-100 border-teal-300",
    iconColor: "text-teal-700",
  },
};

const FILTERS: { key: Kind | "all"; label: string }[] = [
  { key: "all", label: "All activity" },
  { key: "encounter", label: "Encounters" },
  { key: "hospital_event", label: "Hospital events" },
  { key: "portal_message", label: "Messages" },
  { key: "care_plan_version", label: "Care plan" },
];

export function ActivityTab({ patientId }: { patientId: Id<"patients"> }) {
  const feed = useQuery(api.queries.patients.activityFeed, {
    patientId,
    limit: 40,
  });
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [encounterId, setEncounterId] = useState<Id<"encounters"> | null>(null);

  if (!feed) return <div className="glass p-6 text-brand-500">Loading…</div>;

  const filtered =
    filter === "all" ? feed : feed.filter((i) => i.kind === filter);

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
          <header
            className="px-6 pt-5 pb-4"
            style={{
              backgroundImage: "url(/image-mesh-gradient.png)",
              backgroundSize: "200% 200%",
              backgroundPosition: "50% 50%",
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <InboxIcon className="w-5 h-5 text-brand-950" />
                  <h3 className="text-lg font-semibold text-brand-950">
                    Activity
                  </h3>
                  <HelpHint width={300}>
                    Reverse-chronological feed of everything that has happened
                    on this patient: calls, messages, hospital events, and
                    care plan revisions. Use this as the per-patient inbox.
                  </HelpHint>
                </div>
                <p className="text-xs text-brand-950/80 mt-0.5">
                  {feed.length} item{feed.length === 1 ? "" : "s"} across the
                  last 90 days.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full transition ${
                      active
                        ? "bg-foresight text-white"
                        : "bg-white/60 text-brand-700 hover:bg-white/85"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </header>

          {filtered.length === 0 ? (
            <p className="text-sm text-brand-500 italic p-6">
              Nothing matches this filter.
            </p>
          ) : (
            <ol className="relative">
              <div className="absolute left-[31px] top-3 bottom-3 w-px bg-brand-100" />
              {filtered.map((item) => {
                const meta = KIND_META[item.kind as Kind];
                const date = new Date(item.timestamp);
                const clickable = item.kind === "encounter";
                return (
                  <li
                    key={`${item.kind}-${item.refId}`}
                    className="relative flex items-start gap-3 px-4 py-3 hover:bg-brand-50/40 transition"
                  >
                    <span
                      className={`w-8 h-8 rounded-full border-2 ${meta.tint} flex items-center justify-center flex-shrink-0 relative z-10 bg-white`}
                    >
                      <meta.Icon className={`w-3.5 h-3.5 ${meta.iconColor}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-brand-950">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${meta.iconColor} ${meta.tint}`}
                        >
                          {meta.label}
                        </span>
                        {item.status && (
                          <span className="text-[10px] uppercase tracking-wider text-brand-500">
                            · {item.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {item.body && (
                        <p className="text-xs text-brand-700 mt-0.5 line-clamp-2">
                          {item.body}
                        </p>
                      )}
                      {item.meta && (
                        <p className="text-[11px] text-brand-500 mt-0.5">
                          {item.meta}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[11px] text-brand-500 whitespace-nowrap">
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {clickable && (
                        <button
                          onClick={() =>
                            setEncounterId(item.refId as Id<"encounters">)
                          }
                          className="text-[10px] uppercase tracking-wider font-semibold text-foresight hover:text-foresight-dark"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <EncounterDetailModal
        encounterId={encounterId}
        onClose={() => setEncounterId(null)}
      />
    </>
  );
}
