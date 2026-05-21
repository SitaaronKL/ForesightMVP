"use client";

import { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useSageThreadId } from "./SageRuntime";
import { SageActionTray } from "./SageActionTray";
import { AmbulanceIcon, type AmbulanceIconHandle } from "./AmbulanceIcon";
import { HistoryIcon, type HistoryIconHandle } from "./HistoryIcon";
import { ArrowBigLeftDashIcon, type ArrowBigLeftDashIconHandle } from "./ArrowBigLeftDashIcon";
import { ArrowBigRightDashIcon, type ArrowBigRightDashIconHandle } from "./ArrowBigRightDashIcon";
import { useRef } from "react";
import {
  useAgentRail,
  RAIL_MIN_WIDTH,
  RAIL_MAX_WIDTH,
} from "./AgentRailContext";

export function AgentRail({
  user,
  contextPatientId,
}: {
  user: any;
  contextPatientId?: Id<"patients">;
}) {
  const { collapsed, setCollapsed, width, setWidth } = useAgentRail();
  const [reviewSoapId, setReviewSoapId] = useState<Id<"soapNotes"> | null>(null);
  const [reviewPatientId, setReviewPatientId] = useState<Id<"patients"> | null>(null);
  const openIconRef = useRef<ArrowBigLeftDashIconHandle>(null);
  const hideIconRef = useRef<ArrowBigRightDashIconHandle>(null);

  function openSoapReview(soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) {
    setReviewSoapId(soapNoteId);
    setReviewPatientId(patientId);
  }

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startWidth = width;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const next = Math.max(
        RAIL_MIN_WIDTH,
        Math.min(RAIL_MAX_WIDTH, startWidth - dx),
      );
      setWidth(next);
    };
    const onEnd = (ev: PointerEvent) => {
      try {
        handle.releasePointerCapture(ev.pointerId);
      } catch {}
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  }

  if (collapsed) {
    return (
      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30"
        onClick={() => setCollapsed(false)}
        onMouseEnter={() => openIconRef.current?.startAnimation()}
        onMouseLeave={() => openIconRef.current?.stopAnimation()}
        aria-label="Open Sage"
        title="Open Sage"
      >
        <div className="h-16 w-7 rounded-l-full bg-white/70 backdrop-blur-xl border border-r-0 border-white/60 shadow-[-4px_0_16px_rgba(11,59,92,0.12)] flex items-center justify-center text-brand-950 hover:text-brand-700 hover:bg-white/85 transition">
          <ArrowBigLeftDashIcon ref={openIconRef} size={18} className="flex items-center" />
        </div>
      </button>
    );
  }

  return (
    <>
      <aside
        style={{ width }}
        className="fixed right-0 top-0 h-screen hidden lg:flex z-20"
      >
        {/* Collapse tab nub: glued to the OUTSIDE of the sidebar's left edge,
            so it visibly attaches to the sidebar instead of overlapping the
            translucent surface and bleeding into dashboard content behind. */}
        <button
          onClick={() => setCollapsed(true)}
          onMouseEnter={() => hideIconRef.current?.startAnimation()}
          onMouseLeave={() => hideIconRef.current?.stopAnimation()}
          aria-label="Hide Sage"
          title="Hide Sage"
          className="absolute right-full top-1/2 -translate-y-1/2 z-20"
        >
          <div className="h-16 w-7 rounded-l-full bg-white/70 backdrop-blur-xl border border-r-0 border-white/60 shadow-[-4px_0_16px_rgba(11,59,92,0.08)] flex items-center justify-center text-brand-950 hover:text-brand-700 hover:bg-white/85 transition">
            <ArrowBigRightDashIcon ref={hideIconRef} size={18} className="flex items-center" />
          </div>
        </button>

        {/* Drag handle on the rail's left edge — drag to resize.
            Wider hit-target (8px) than its visible mark so it's easy to grab,
            and uses Pointer Events with capture so the drag follows the
            cursor even when it leaves the handle. */}
        <div
          onPointerDown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Sage panel"
          title="Drag to resize"
          style={{ touchAction: "none" }}
          className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-30 group flex items-center justify-center"
        >
          <span className="block w-0.5 h-12 rounded-full bg-brand-200 group-hover:bg-foresight transition-colors" />
        </div>

        {/* Translucent liquid-glass sidebar surface, full height, flush right edge */}
        <div className="relative flex flex-col w-full h-full overflow-hidden border-l border-white/40 backdrop-blur-2xl backdrop-saturate-150 bg-white/40 shadow-[-8px_0_32px_rgba(11,59,92,0.08)]">
          <SageInner onOpenSoapReview={openSoapReview} />
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
  const ambulanceRef = useRef<AmbulanceIconHandle>(null);
  const historyRef = useRef<HistoryIconHandle>(null);

  return (
    <>
      {/* Full-height divider between thread list and chat, drawn above the
          header so it visually splits the rail from the very top. */}
      {showHistory && (
        <div className="pointer-events-none absolute top-0 bottom-0 left-[160px] w-px bg-brand-950 z-20" />
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/30 flex items-center justify-between gap-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 min-w-0 text-brand-950 cursor-default"
          onMouseEnter={() => ambulanceRef.current?.startAnimation()}
          onMouseLeave={() => ambulanceRef.current?.stopAnimation()}
        >
          <AmbulanceIcon ref={ambulanceRef} size={18} className="flex-shrink-0" />
          <span className="font-semibold text-sm tracking-wide">Sage</span>
        </div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          onMouseEnter={() => historyRef.current?.startAnimation()}
          onMouseLeave={() => historyRef.current?.stopAnimation()}
          className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 bg-foresight hover:bg-foresight-dark text-white transition shadow-sm"
          aria-label="Toggle conversation history"
          title="Toggle history"
        >
          <HistoryIcon ref={historyRef} size={14} className="flex items-center" />
          History
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Thread list panel — clicking any item closes history and reveals
            the selected chat full-width. */}
        {showHistory && (
          <div
            onClick={() => setShowHistory(false)}
            className="w-[160px] bg-white/30 overflow-y-auto p-2 flex-shrink-0"
          >
            <ThreadList />
          </div>
        )}

        {/* Active thread / chat surface — clicking anywhere inside also
            closes the history panel. */}
        <div
          onClick={() => showHistory && setShowHistory(false)}
          className="flex-1 min-w-0 flex flex-col"
        >
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
