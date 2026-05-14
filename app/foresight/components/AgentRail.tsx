"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";

export function AgentRail({
  user,
  contextPatientId,
}: {
  user: any;
  contextPatientId?: Id<"patients">;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [threadId, setThreadId] = useState<Id<"agentThreads"> | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [reviewSoapId, setReviewSoapId] = useState<Id<"soapNotes"> | null>(null);
  const [reviewPatientId, setReviewPatientId] = useState<Id<"patients"> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = useQuery(api.queries.agent.myThreads, { limit: 1 });
  const messages = useQuery(
    api.queries.agent.messages,
    threadId ? { threadId } : ("skip" as any),
  );

  const createThread = useMutation(api.mutations.agent.createThread);
  const runAgentTurn = useAction(api.agent.runAgentTurn.runAgentTurn);

  // Ensure a thread exists
  useEffect(() => {
    if (threadId) return;
    if (!threads) return;
    (async () => {
      if (threads.length > 0) {
        setThreadId(threads[0]._id);
      } else {
        const id = await createThread({
          title: contextPatientId ? "Patient session" : "Today",
          contextPatientId,
        });
        setThreadId(id);
      }
    })();
  }, [threads, threadId, createThread, contextPatientId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  async function handleSend() {
    if (!input.trim() || !threadId) return;
    const userMessage = input;
    setInput("");
    setPending(true);
    try {
      await runAgentTurn({
        threadId,
        userInput: userMessage,
        contextPatientId,
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setPending(false);
    }
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
      <aside className="w-[380px] flex-shrink-0 sticky top-[60px] self-start h-[calc(100vh-60px)] p-4 hidden lg:flex">
        <div className="glass-dark flex flex-col w-full h-full overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${pending ? "bg-teal-300 pulse-dot" : "bg-green-ok"}`}
              />
              <span className="font-semibold text-sm tracking-wide">Sage</span>
              <span className="text-[10px] text-white/60">
                {contextPatientId ? "patient context" : "panel context"}
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-white/60 hover:text-white text-lg leading-none"
              aria-label="Collapse Sage"
            >
              ›
            </button>
          </div>

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

          <div className="border-t border-white/10 p-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(contextPatientId
                ? ["Summarize this patient", "Draft a SOAP note", "Suggest care plan changes"]
                : ["Today's queue", "Overdue Level 3", "Reach rate"]
              ).map((s) => (
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
                    handleSend();
                  }
                }}
                placeholder="Ask Sage…"
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/40 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-teal-300"
              />
              <button
                onClick={handleSend}
                disabled={pending || !input.trim()}
                className="px-3 rounded-lg bg-teal-500 hover:bg-teal-700 text-white text-sm disabled:opacity-30"
              >
                ↑
              </button>
            </div>
          </div>
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

function truncateJson(obj: any): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > 80 ? s.slice(0, 77) + "..." : s;
  } catch {
    return String(obj).slice(0, 80);
  }
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
  // Empty assistant bubbles (e.g. internal __rawItem envelopes that decoded to JSON) — skip render
  if (message.role === "assistant" && (!message.content || message.content.startsWith("{\"__rawItem"))) {
    return null;
  }
  if (message.role === "system") {
    return (
      <div className="text-[11px] text-amber-warning italic">
        {message.content}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex">
        <div className="max-w-[90%] rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
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

  const label = {
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
        // Outreach: already scheduled. Mark applied for UI.
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
          <div className="text-xs text-white/90 mt-0.5 truncate">
            {card.summary}
          </div>
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
