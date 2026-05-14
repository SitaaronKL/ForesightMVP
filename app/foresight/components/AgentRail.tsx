"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function AgentRail({ user, contextPatientId }: { user: any; contextPatientId?: Id<"patients"> }) {
  const [collapsed, setCollapsed] = useState(false);
  const [threadId, setThreadId] = useState<Id<"agentThreads"> | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = useQuery(api.queries.agent.myThreads, { limit: 1 });
  const messages = useQuery(
    api.queries.agent.messages,
    threadId ? { threadId } : ("skip" as any),
  );

  const createThread = useMutation(api.mutations.agent.createThread);
  const appendUser = useMutation(api.mutations.agent.appendUserMessage);
  const runAgentTurn = useAction(api.agent.runAgentTurn.runAgentTurn);

  // Pick or create a thread on mount
  useEffect(() => {
    (async () => {
      if (threadId) return;
      if (!threads) return;
      if (threads.length > 0) {
        setThreadId(threads[0]._id);
      } else {
        const id = await createThread({
          title: "Today",
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
      await appendUser({ threadId, content: userMessage });
      await runAgentTurn({ threadId, userInput: userMessage });
    } catch (err: any) {
      console.error(err);
    } finally {
      setPending(false);
    }
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
          >
            ›
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {(messages ?? []).length === 0 && (
            <div className="text-xs text-white/60 italic mt-8 text-center">
              Sage is ready. Try: "show me overdue Level 3 patients" or "draft a SOAP for Maria"
            </div>
          )}
          {messages?.map((m) => (
            <MessageBubble key={m._id} message={m} />
          ))}
          {pending && (
            <div className="text-xs text-white/60 italic">Sage is thinking…</div>
          )}
        </div>

        <div className="border-t border-white/10 p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {["Today's queue", "Overdue Level 3", "Reach rate"].map((s) => (
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
  );
}

function MessageBubble({ message }: { message: any }) {
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
      <div className="text-[11px] text-white/60 font-mono">
        🔧 {message.toolName ?? "tool"}
        {message.toolArgs && (
          <span className="text-white/40 ml-1">
            ({JSON.stringify(message.toolArgs).slice(0, 80)})
          </span>
        )}
      </div>
    );
  }
  if (message.role === "system") {
    return (
      <div className="text-[11px] text-amber-warning italic">
        {message.content}
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="max-w-[90%] rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
