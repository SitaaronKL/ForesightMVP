"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";
import { Thread } from "@/components/assistant-ui/thread";
import { SageProvider } from "./SageRuntime";
import { SageActionTray } from "./SageActionTray";
import { PlusIcon, type PlusIconHandle } from "./PlusIcon";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useRef } from "react";

type View = "list" | "thread";

export function AgentRail({
  user,
  contextPatientId,
}: {
  user: any;
  contextPatientId?: Id<"patients">;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<View>("list");
  const [threadId, setThreadId] = useState<Id<"agentThreads"> | null>(null);
  const [reviewSoapId, setReviewSoapId] = useState<Id<"soapNotes"> | null>(null);
  const [reviewPatientId, setReviewPatientId] = useState<Id<"patients"> | null>(null);

  const threads = useQuery(api.queries.agent.myThreads, { limit: 50 });
  const createThread = useMutation(api.mutations.agent.createThread);
  const deleteThread = useMutation(api.mutations.agent.deleteThread);

  async function startNewThread() {
    const id = await createThread({
      title: contextPatientId ? "Patient session" : "New thread",
      contextPatientId,
    });
    setThreadId(id);
    setView("thread");
  }

  function openThread(id: Id<"agentThreads">) {
    setThreadId(id);
    setView("thread");
  }

  function backToList() {
    setView("list");
    setThreadId(null);
  }

  async function handleDelete(id: Id<"agentThreads">) {
    if (!confirm("Delete this thread? This cannot be undone.")) return;
    if (threadId === id) backToList();
    await deleteThread({ threadId: id });
  }

  function openSoapReview(soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) {
    setReviewSoapId(soapNoteId);
    setReviewPatientId(patientId);
  }

  if (collapsed) {
    return (
      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 h-16 w-7 rounded-l-full glass-dark flex items-center justify-center text-white/90 hover:text-white shadow-glow"
        onClick={() => setCollapsed(false)}
        aria-label="Open Sage"
        title="Open Sage"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <>
      <aside className="w-[380px] xl:w-[420px] flex-shrink-0 sticky top-0 self-start h-screen p-4 hidden lg:flex relative">
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Hide Sage"
          title="Hide Sage"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 h-16 w-7 rounded-full glass-dark flex items-center justify-center text-white/90 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="glass-dark flex flex-col w-full h-full overflow-hidden">
          <Header
            view={view}
            threadTitle={
              view === "thread"
                ? threads?.find((t) => t._id === threadId)?.title ?? "Thread"
                : null
            }
            onBackToList={backToList}
            onNewThread={startNewThread}
          />

          {view === "list" && (
            <ThreadList
              threads={threads ?? []}
              onOpen={openThread}
              onDelete={handleDelete}
              onNewThread={startNewThread}
            />
          )}

          {view === "thread" && threadId && (
            <SageProvider threadId={threadId} contextPatientId={contextPatientId}>
              <SageActionTray threadId={threadId} onOpenSoapReview={openSoapReview} />
              <div className="flex-1 min-h-0 overflow-hidden sage-thread">
                <Thread />
              </div>
            </SageProvider>
          )}
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

function Header({
  view,
  threadTitle,
  onBackToList,
  onNewThread,
}: {
  view: View;
  threadTitle: string | null;
  onBackToList: () => void;
  onNewThread: () => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {view === "list" ? (
          <>
            <Sparkles className="w-4 h-4 text-teal-300 flex-shrink-0" />
            <span className="font-semibold text-sm tracking-wide">Sage</span>
          </>
        ) : (
          <>
            <button
              onClick={onBackToList}
              className="text-white/60 hover:text-white flex-shrink-0"
              aria-label="Back to threads"
              title="Back to threads"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-xs text-white/90 truncate">
              {threadTitle}
            </span>
          </>
        )}
      </div>
      <NewThreadButton onClick={onNewThread} />
    </div>
  );
}

function NewThreadButton({ onClick }: { onClick: () => void }) {
  const iconRef = useRef<PlusIconHandle>(null);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className="inline-flex items-center text-[11px] px-2 py-1 gap-1 rounded-full bg-teal-500 hover:bg-teal-700 text-white"
      title="New chat"
    >
      New
      <PlusIcon ref={iconRef} size={12} className="flex items-center" />
    </button>
  );
}

function ThreadList({
  threads,
  onOpen,
  onDelete,
  onNewThread,
}: {
  threads: any[];
  onOpen: (id: Id<"agentThreads">) => void;
  onDelete: (id: Id<"agentThreads">) => void;
  onNewThread: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {threads.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-xs text-white/70 leading-relaxed mb-5">
            Ask Sage about your patients, draft SOAP notes, suggest care plan
            changes. Sage runs on your panel only.
          </p>
          <div className="flex justify-center">
            <NewThreadButton onClick={onNewThread} />
          </div>
        </div>
      ) : (
        <ul className="py-2">
          {threads.map((t) => (
            <li key={t._id} className="group">
              <div className="flex items-stretch hover:bg-white/5">
                <button
                  onClick={() => onOpen(t._id)}
                  className="flex-1 text-left px-4 py-2.5 min-w-0"
                >
                  <div className="text-sm text-white/90 truncate">{t.title}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    {formatRelative(t.lastMessageAt)}
                    {t.contextPatientId ? " · patient" : ""}
                  </div>
                </button>
                <button
                  onClick={() => onDelete(t._id)}
                  className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-warning px-3 transition"
                  aria-label="Delete thread"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}
