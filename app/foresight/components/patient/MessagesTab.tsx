"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon } from "../ArrowUpRightIcon";
import { FolderPlusIcon, type FolderPlusIconHandle } from "../FolderPlusIcon";
import { useMe } from "../useMe";

export function MessagesTab({ patientId }: { patientId: Id<"patients"> }) {
  const me = useMe() as any;
  const messages = useQuery(api.queries.patients.portalMessages, { patientId });
  const send = useMutation(api.mutations.portal.sendMessage);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const folderRef = useRef<FolderPlusIconHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawMyName = me?.name ?? me?.email ?? "You";
  const myLabel =
    typeof rawMyName === "string" ? rawMyName.split(",")[0].trim() : "You";

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      await send({ patientId, content: text });
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  const ordered = (messages ?? []).slice().reverse();

  return (
    <div className="glass overflow-hidden flex flex-col h-[calc(100dvh-260px)] min-h-[360px] max-h-[640px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/30 flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
          Portal messages
        </span>
        <span className="text-[11px] text-brand-500 ml-auto">
          {ordered.length} {ordered.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Message stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {ordered.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-brand-500 text-sm">
            <p className="italic">No messages yet.</p>
            <p className="text-xs mt-1 text-brand-400">
              Start a conversation with the patient through the portal.
            </p>
          </div>
        )}
        {ordered.map((m) => {
          const isNurse = m.senderType !== "patient";
          return (
            <div
              key={m._id}
              className={`flex ${isNurse ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                  isNurse
                    ? "bg-foresight text-white"
                    : "bg-white/80 border border-brand-100 text-brand-950"
                }`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider mb-0.5 ${
                    isNurse ? "text-white/70" : "text-brand-500"
                  }`}
                >
                  {isNurse ? myLabel : "Patient"} ·{" "}
                  {new Date(m._creationTime).toLocaleDateString()}
                </div>
                <div className="leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="flex flex-col gap-2 rounded-3xl border border-brand-100 bg-white/85 p-2.5 transition focus-within:border-foresight/50">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Send a portal message…"
            rows={1}
            className="resize-none w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-brand-400 max-h-32 min-h-9"
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onMouseEnter={() => folderRef.current?.startAnimation()}
              onMouseLeave={() => folderRef.current?.stopAnimation()}
              aria-label="Add attachment"
              title="Add attachment"
              className="size-8 rounded-full flex items-center justify-center text-brand-700 hover:text-brand-950 transition"
            >
              <FolderPlusIcon ref={folderRef} size={18} className="flex items-center" />
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              aria-label="Send"
              title="Send"
              className="size-9 rounded-full flex items-center justify-center bg-foresight text-white shadow-sm hover:bg-foresight-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUpRightIcon size={16} className="flex items-center" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
