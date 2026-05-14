"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";

export function MessagesTab({ patientId }: { patientId: Id<"patients"> }) {
  const messages = useQuery(api.queries.patients.portalMessages, { patientId });
  const send = useMutation(api.mutations.portal.sendMessage);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await send({ patientId, content: draft });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass p-5">
      <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">
        Portal messages
      </h3>
      <div className="space-y-2 max-h-[320px] overflow-y-auto mb-4">
        {messages?.length === 0 && (
          <div className="text-sm italic text-brand-500">
            No messages yet. Start a conversation.
          </div>
        )}
        {messages
          ?.slice()
          .reverse()
          .map((m) => (
            <div
              key={m._id}
              className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                m.senderType === "patient"
                  ? "bg-brand-50 self-end ml-auto"
                  : "bg-teal-500/15 mr-auto"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-brand-500 mb-1">
                {m.senderType === "patient" ? "Patient" : "Nurse"} ·{" "}
                {new Date(m._creationTime).toLocaleDateString()}
              </div>
              <div className="text-brand-900">{m.content}</div>
            </div>
          ))}
      </div>
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-white/70 border border-brand-100 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="px-4 rounded-lg bg-brand-900 text-white text-sm hover:bg-brand-800 disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}
