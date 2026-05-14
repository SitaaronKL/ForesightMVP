"use client";

import { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { SageProvider, useSageThreadId } from "./SageRuntime";
import { SageActionTray } from "./SageActionTray";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { AmbulanceIcon } from "./AmbulanceIcon";

export function AgentRail({
  user,
  contextPatientId,
}: {
  user: any;
  contextPatientId?: Id<"patients">;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [reviewSoapId, setReviewSoapId] = useState<Id<"soapNotes"> | null>(null);
  const [reviewPatientId, setReviewPatientId] = useState<Id<"patients"> | null>(null);

  function openSoapReview(soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) {
    setReviewSoapId(soapNoteId);
    setReviewPatientId(patientId);
  }

  if (collapsed) {
    return (
      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30"
        onClick={() => setCollapsed(false)}
        aria-label="Open Sage"
        title="Open Sage"
      >
        <div className="h-16 w-7 rounded-l-full bg-white/70 backdrop-blur-xl border border-r-0 border-white/60 shadow-[-4px_0_16px_rgba(11,59,92,0.12)] flex items-center justify-center text-brand-900 hover:text-brand-700 hover:bg-white/85 transition">
          <ChevronLeft className="w-4 h-4" />
        </div>
      </button>
    );
  }

  return (
    <>
      <aside className="fixed right-0 top-0 w-[380px] xl:w-[420px] h-screen hidden lg:flex z-20">
        {/* Collapse tab nub: glued to the OUTSIDE of the sidebar's left edge,
            so it visibly attaches to the sidebar instead of overlapping the
            translucent surface and bleeding into dashboard content behind. */}
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Hide Sage"
          title="Hide Sage"
          className="absolute right-full top-1/2 -translate-y-1/2 z-20"
        >
          <div className="h-16 w-7 rounded-l-full bg-white/70 backdrop-blur-xl border border-r-0 border-white/60 shadow-[-4px_0_16px_rgba(11,59,92,0.08)] flex items-center justify-center text-brand-900 hover:text-brand-700 hover:bg-white/85 transition">
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Translucent liquid-glass sidebar surface, full height, flush right edge */}
        <div className="flex flex-col w-full h-full overflow-hidden border-l border-white/40 backdrop-blur-2xl backdrop-saturate-150 bg-white/40 shadow-[-8px_0_32px_rgba(11,59,92,0.08)]">
          <SageProvider contextPatientId={contextPatientId}>
            <SageInner onOpenSoapReview={openSoapReview} />
          </SageProvider>
        </div>
      </aside>

      {reviewSoapId && reviewPatientId && (
        <SoapReviewModal
          soapNoteId={reviewSoapId}
          patientId={reviewPatientId}
          onClose={() => {
            setReviewSoapId(null);
            setReviewPatientId(null);
          }}
        />
      )}
    </>
  );
}

function SageInner({
  onOpenSoapReview,
}: {
  onOpenSoapReview: (soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) => void;
}) {
  const threadId = useSageThreadId();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/30 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 text-brand-900">
          <AmbulanceIcon size={18} className="flex-shrink-0" />
          <span className="font-semibold text-sm tracking-wide">Sage</span>
        </div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-900 rounded-md px-2 py-1 hover:bg-white/40"
          aria-label="Toggle conversation history"
          title="Toggle history"
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Thread list panel */}
        {showHistory && (
          <div className="w-[160px] border-r border-white/30 bg-white/30 overflow-y-auto p-2 flex-shrink-0">
            <ThreadList />
          </div>
        )}

        {/* Active thread / chat surface */}
        <div className="flex-1 min-w-0 flex flex-col">
          {threadId && (
            <SageActionTray threadId={threadId} onOpenSoapReview={onOpenSoapReview} />
          )}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Thread />
          </div>
        </div>
      </div>
    </>
  );
}
