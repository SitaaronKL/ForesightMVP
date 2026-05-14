"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";
import ReactMarkdown from "react-markdown";

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
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [reviewSoapId, setReviewSoapId] = useState<Id<"soapNotes"> | null>(null);
  const [reviewPatientId, setReviewPatientId] = useState<Id<"patients"> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = useQuery(api.queries.agent.myThreads, { limit: 50 });
  const messages = useQuery(
    api.queries.agent.messages,
    threadId && view === "thread" ? { threadId } : ("skip" as any),
  );

  const createThread = useMutation(api.mutations.agent.createThread);
  const renameThreadIfDefault = useMutation(
    api.mutations.agent.renameThreadIfDefault,
  );
  const deleteThread = useMutation(api.mutations.agent.deleteThread);
  const runAgentTurn = useAction(api.agent.runAgentTurn.runAgentTurn);

  useEffect(() => {
    if (scrollRef.current && view === "thread") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length, view]);

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

  async function handleSend() {
    if (!input.trim()) return;

    // Make sure we have a thread
    let activeId = threadId;
    let isFirst = false;
    if (!activeId) {
      activeId = await createThread({
        title: contextPatientId ? "Patient session" : "New thread",
        contextPatientId,
      });
      setThreadId(activeId);
      setView("thread");
      isFirst = true;
    } else {
      isFirst = (messages?.length ?? 0) === 0;
    }

    const userMessage = input;
    setInput("");
    setPending(true);

    // If this is the first message, rename the thread from "New thread" → first user msg
    if (isFirst) {
      void renameThreadIfDefault({
        threadId: activeId,
        title: userMessage,
      });
    }

    try {
      await runAgentTurn({
        threadId: activeId,
        userInput: userMessage,
        contextPatientId,
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setPending(false);
    }
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
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full glass-dark flex items-center justify-center text-white shadow-glow"
        onClick={() => setCollapsed(false)}
        aria-label="Open Sage"
      >
        ✦
      </button>
    );
  }

  return (
    <>
      <aside className="w-[340px] xl:w-[380px] flex-shrink-0 sticky top-0 self-start h-screen p-4 hidden lg:flex">
        <div className="glass-dark flex flex-col w-full h-full overflow-hidden">
          <Header
            view={view}
            threadTitle={
              view === "thread"
                ? threads?.find((t) => t._id === threadId)?.title ?? "Thread"
                : null
            }
            pending={pending}
            contextPatientId={contextPatientId}
            onBackToList={backToList}
            onNewThread={startNewThread}
            onCollapse={() => setCollapsed(true)}
          />

          {view === "list" && (
            <ThreadList
              threads={threads ?? []}
              onOpen={openThread}
              onDelete={handleDelete}
              onNewThread={startNewThread}
            />
          )}

          {view === "thread" && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {(messages ?? []).length === 0 && (
                  <div className="text-xs text-white/60 italic mt-8 text-center px-4">
                    Sage is ready. Try: "show me overdue Level 3 patients" or "draft a SOAP for Maria's last call"
                  </div>
                )}
                {messages?.map((m) => (
                  <MessageBubble
                    key={m._id}
                    message={m}
                    onOpenSoapReview={openSoapReview}
                  />
                ))}
                {pending && (
                  <div className="text-xs text-white/60 italic">Sage is thinking…</div>
                )}
              </div>

              <Composer
                input={input}
                setInput={setInput}
                onSend={handleSend}
                pending={pending}
                contextPatientId={contextPatientId}
              />
            </>
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
  pending,
  contextPatientId,
  onBackToList,
  onNewThread,
  onCollapse,
}: {
  view: View;
  threadTitle: string | null;
  pending: boolean;
  contextPatientId?: Id<"patients">;
  onBackToList: () => void;
  onNewThread: () => void;
  onCollapse: () => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${pending ? "bg-teal-300 pulse-dot" : "bg-green-ok"}`}
        />
        {view === "list" ? (
          <>
            <span className="font-semibold text-sm tracking-wide">Sage</span>
            <span className="text-[10px] text-white/60">
              {contextPatientId ? "patient context" : "panel context"}
            </span>
          </>
        ) : (
          <>
            <button
              onClick={onBackToList}
              className="text-white/60 hover:text-white text-xs leading-none flex-shrink-0"
              aria-label="Back to threads"
              title="Back to threads"
            >
              ‹
            </button>
            <span className="font-medium text-xs text-white/90 truncate">
              {threadTitle}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onNewThread}
          className="text-[10px] px-2 py-1 rounded bg-teal-500 hover:bg-teal-700 text-white"
          title="New chat"
        >
          + New
        </button>
        <button
          onClick={onCollapse}
          className="text-white/60 hover:text-white text-lg leading-none ml-1"
          aria-label="Collapse Sage"
        >
          ›
        </button>
      </div>
    </div>
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
          <p className="text-xs text-white/60 italic mb-4">No conversations yet.</p>
          <button
            onClick={onNewThread}
            className="text-xs px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-700 text-white"
          >
            Start a chat
          </button>
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
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Composer({
  input,
  setInput,
  onSend,
  pending,
  contextPatientId,
}: {
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  pending: boolean;
  contextPatientId?: Id<"patients">;
}) {
  const suggestions = contextPatientId
    ? ["Summarize this patient", "Draft a SOAP note", "Suggest care plan changes"]
    : ["Today's queue", "Overdue Level 3", "Reach rate"];
  return (
    <div className="border-t border-white/10 p-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-[10px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask Sage…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-teal-300"
        />
        <button
          onClick={onSend}
          disabled={pending || !input.trim()}
          className="px-3 rounded-lg bg-teal-500 hover:bg-teal-700 text-white text-sm disabled:opacity-30"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function truncateJson(obj: any): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > 80 ? s.slice(0, 77) + "..." : s;
  } catch {
    return String(obj).slice(0, 80);
  }
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

function MessageBubble({
  message,
  onOpenSoapReview,
}: {
  message: any;
  onOpenSoapReview: (soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-teal-500/30 px-3 py-2 text-sm">
          {message.content}
        </div>
      </div>
    );
  }
  if (message.role === "tool") {
    return (
      <div className="text-[11px] text-white/55 font-mono pl-1">
        <span className="text-teal-300">▸</span>{" "}
        <span className="text-white/80">{message.toolName ?? "tool"}</span>
        {message.toolArgs && (
          <span className="text-white/40 ml-1">
            ({truncateJson(message.toolArgs)})
          </span>
        )}
      </div>
    );
  }
  if (message.role === "system") {
    return (
      <div className="text-[11px] text-amber-warning italic">{message.content}</div>
    );
  }
  // Skip empty assistant bubbles or raw __rawItem JSON envelopes
  if (
    message.role === "assistant" &&
    (!message.content || message.content.startsWith('{"__rawItem'))
  ) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex">
        <div className="max-w-[90%] rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="my-1 first:mt-0 last:mb-0">{children}</p>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>
              ),
              li: ({ children }) => <li className="leading-snug">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold text-white">{children}</strong>
              ),
              em: ({ children }) => <em className="italic text-white/90">{children}</em>,
              code: ({ children }) => (
                <code className="font-mono text-[11px] bg-black/30 px-1 py-0.5 rounded">
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-teal-300 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      {message.actionCards?.map((card: any, i: number) => (
        <ActionCard
          key={i}
          messageId={message._id}
          cardIndex={i}
          card={card}
          onOpenSoapReview={onOpenSoapReview}
        />
      ))}
    </div>
  );
}

function ActionCard({
  messageId,
  cardIndex,
  card,
  onOpenSoapReview,
}: {
  messageId: Id<"agentMessages">;
  cardIndex: number;
  card: any;
  onOpenSoapReview: (soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) => void;
}) {
  const applySoap = useMutation(api.mutations.applyActions.applySoapDraft);
  const applyCarePlan = useMutation(api.mutations.applyActions.applyCarePlanRevision);
  const applyMessage = useMutation(api.mutations.applyActions.applyPatientMessage);
  const dismiss = useMutation(api.mutations.agent.dismissActionCard);
  const [pending, setPending] = useState(false);

  const label =
    {
      soap_draft: "SOAP draft",
      care_plan_revision: "Care plan revision",
      patient_message: "Portal message",
      outreach: "Outreach scheduled",
    }[card.kind as string] ?? "Action";

  async function handleApply() {
    setPending(true);
    try {
      if (card.kind === "soap_draft" && card.targetId) {
        const result = await applySoap({
          messageId,
          cardIndex,
          soapNoteId: card.targetId,
        });
        onOpenSoapReview(result.soapNoteId, result.patientId);
      } else if (card.kind === "care_plan_revision" && card.targetId) {
        await applyCarePlan({
          messageId,
          cardIndex,
          versionId: card.targetId,
        });
      } else if (card.kind === "patient_message" && card.targetId) {
        await applyMessage({
          messageId,
          cardIndex,
          patientId: card.targetId,
          content: card.summary,
        });
      } else {
        await dismiss({ messageId, cardIndex });
      }
    } catch (err: any) {
      alert(err?.message ?? "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="ml-1 rounded-lg bg-white/8 border border-white/15 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold">
            {label}
          </div>
          <div className="text-xs text-white/90 mt-0.5 truncate">{card.summary}</div>
        </div>
        {card.status === "applied" ? (
          <span className="text-[10px] uppercase text-green-ok bg-green-500/15 px-2 py-1 rounded">
            Applied
          </span>
        ) : card.status === "dismissed" ? (
          <span className="text-[10px] uppercase text-white/40">Dismissed</span>
        ) : (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleApply}
              disabled={pending}
              className="text-[10px] px-2 py-1 rounded bg-teal-500 hover:bg-teal-700 text-white disabled:opacity-50"
            >
              {pending ? "…" : card.kind === "soap_draft" ? "Review" : "Apply"}
            </button>
            <button
              onClick={() => dismiss({ messageId, cardIndex })}
              className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
