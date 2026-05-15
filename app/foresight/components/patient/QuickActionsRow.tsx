"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import {
  PencilLine,
  CheckCircle2,
  CalendarClock,
  Phone,
  MessageCircle,
  Mail,
  Send,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HelpHint } from "../HelpHint";
import { GlassTooltip } from "../GlassTooltip";
import {
  MessageCirclePlusIcon,
  type MessageCirclePlusIconHandle,
} from "../MessageCirclePlusIcon";
import { useRef } from "react";

type ActionKey = "message" | "note" | "element" | "retry";

type ActionDef = {
  key: ActionKey;
  label: string;
  renderIcon: () => React.ReactNode;
  tooltip: string;
};

/**
 * Inline quick-action pills. Designed to sit in the patient header next to
 * Call + Record call. Each button matches the "Call" pill recipe (white
 * backdrop, brand-200 border, rounded-[100px]).
 */
export function QuickActionsRow({
  patientId,
  patientName,
}: {
  patientId: Id<"patients">;
  patientName: string;
}) {
  const [open, setOpen] = useState<ActionKey | null>(null);

  return (
    <>
      {/* Labels collapse to icons via the closest @container ancestor in
          the patient header — they always render, never wrap, and pick up
          text again the moment there's room. */}
      {ACTIONS.map((a) => (
        <GlassTooltip key={a.key} width={260} content={a.tooltip}>
          <button
            onClick={() => setOpen(a.key)}
            aria-label={a.label}
            className="inline-flex items-center gap-2 rounded-[100px] bg-white/70 backdrop-blur-md border border-brand-200 text-brand-950 text-sm font-medium hover:bg-white transition shadow-sm flex-shrink-0 px-3 @[700px]:px-5 py-2"
          >
            <a.Icon className="w-4 h-4 text-foresight" />
            <span className="hidden @[700px]:inline whitespace-nowrap">
              {a.label}
            </span>
          </button>
        </GlassTooltip>
      ))}

      <SendMessageDialog
        open={open === "message"}
        onOpenChange={(o) => setOpen(o ? "message" : null)}
        patientId={patientId}
        patientName={patientName}
      />
      <QuickNoteDialog
        open={open === "note"}
        onOpenChange={(o) => setOpen(o ? "note" : null)}
        patientId={patientId}
        patientName={patientName}
      />
      <MarkElementDialog
        open={open === "element"}
        onOpenChange={(o) => setOpen(o ? "element" : null)}
        patientId={patientId}
      />
      <ScheduleRetryDialog
        open={open === "retry"}
        onOpenChange={(o) => setOpen(o ? "retry" : null)}
        patientId={patientId}
        patientName={patientName}
      />
    </>
  );
}

/* ──────────────────── Send portal message ──────────────────── */

function SendMessageDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: Id<"patients">;
  patientName: string;
}) {
  const send = useMutation(api.mutations.portal.sendMessage);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await send({ patientId, content: content.trim() });
      setContent("");
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  }

  const templates: { label: string; text: string }[] = [
    {
      label: "Check-in",
      text: `Hi ${patientName.split(" ")[0]}, this is your care nurse. Just checking in. How have you been feeling this week? Any changes to share with me?`,
    },
    {
      label: "Refill confirm",
      text: `Hi ${patientName.split(" ")[0]}, your refill request has been sent to your provider. You should hear back within 24-48 hours. Let me know if anything changes.`,
    },
    {
      label: "Lab follow-up",
      text: `Hi ${patientName.split(" ")[0]}, I reviewed your recent labs and wanted to share the highlights. Could we set up a quick call this week to walk through them?`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div
          className="px-6 py-5"
          style={{
            backgroundImage: "url(/image-mesh-gradient.png)",
            backgroundSize: "200% 200%",
            backgroundPosition: "100% 100%",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-brand-950 text-lg">
              Send portal message
            </DialogTitle>
            <DialogDescription className="text-brand-950/70 text-xs">
              To {patientName} · counts toward APCM service element #9
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {templates.map((t) => (
              <button
                key={t.label}
                onClick={() => setContent(t.text)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-foresight/8 hover:bg-foresight/15 text-foresight transition"
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write a message to ${patientName.split(" ")[0]}…`}
            className="w-full min-h-[120px] rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-brand-950 placeholder:text-brand-400 focus:outline-none focus:border-foresight resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-brand-500">
              Patient sees this in their portal inbox.
            </p>
            <button
              onClick={submit}
              disabled={!content.trim() || sending}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-foresight hover:bg-foresight-dark text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────── Quick note ──────────────────── */

const NOTE_TEMPLATES: { label: string; topic: string; body: string }[] = [
  {
    label: "Refill submitted",
    topic: "refill",
    body: "Submitted refill request to prescribing physician. Patient confirmed adherence and no side effects.",
  },
  {
    label: "Lab review",
    topic: "lab_followup",
    body: "Reviewed recent labs. Flagged abnormal values and notified primary care. Will follow up on next call.",
  },
  {
    label: "TOC follow-up",
    topic: "transitions_of_care",
    body: "Transition-of-care follow-up after recent discharge. Reviewed discharge instructions, medication reconciliation, red-flag symptoms.",
  },
  {
    label: "Chart review",
    topic: "chart_review",
    body: "Pre-call chart review. Updated problem list, reviewed recent encounters, flagged items for next touch.",
  },
];

function QuickNoteDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: Id<"patients">;
  patientName: string;
}) {
  const quick = useMutation(api.mutations.encounters.quickNote);
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [topic, setTopic] = useState<string>("other");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!note.trim() || saving) return;
    setSaving(true);
    try {
      await quick({
        patientId,
        note: note.trim(),
        durationMinutes: minutes,
        topicTags: [topic],
      });
      setNote("");
      setMinutes(5);
      setTopic("other");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div
          className="px-6 py-5"
          style={{
            backgroundImage: "url(/image-mesh-gradient.png)",
            backgroundSize: "200% 200%",
            backgroundPosition: "50% 0%",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-brand-950 text-lg">
              Quick note
            </DialogTitle>
            <DialogDescription className="text-brand-950/70 text-xs">
              Log an off-call touch for {patientName}.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {NOTE_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  setNote(t.body);
                  setTopic(t.topic);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-foresight/8 hover:bg-foresight/15 text-foresight transition"
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you do? (e.g., 'Refill sent to Dr. Singh for metformin')"
            className="w-full min-h-[100px] rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-brand-950 placeholder:text-brand-400 focus:outline-none focus:border-foresight resize-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-brand-700">
              Duration
              <select
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value))}
                className="rounded-full border border-brand-100 px-2.5 py-1 text-xs text-brand-950 focus:outline-none focus:border-foresight"
              >
                {[2, 5, 10, 15, 20, 30].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-brand-700">
              Topic
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="rounded-full border border-brand-100 px-2.5 py-1 text-xs text-brand-950 focus:outline-none focus:border-foresight"
              >
                <option value="refill">Refill</option>
                <option value="lab_followup">Lab follow-up</option>
                <option value="transitions_of_care">Transitions of care</option>
                <option value="chart_review">Chart review</option>
                <option value="symptom_check">Symptom check</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </label>
            <div className="ml-auto">
              <button
                onClick={submit}
                disabled={!note.trim() || saving}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-foresight hover:bg-foresight-dark text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Log note"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────── Mark element delivered ──────────────────── */

function MarkElementDialog({
  open,
  onOpenChange,
  patientId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: Id<"patients">;
}) {
  const els = useQuery(
    api.queries.patients.serviceElementsForMonth,
    open ? { patientId } : "skip",
  );
  const mark = useMutation(api.mutations.encounters.markServiceElementDelivered);
  const [working, setWorking] = useState<number | null>(null);

  const pending = (els ?? []).filter((e) => e.status !== "delivered");

  async function markIt(elementId: number) {
    setWorking(elementId);
    try {
      await mark({ patientId, elementId });
    } finally {
      setWorking(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div
          className="px-6 py-5"
          style={{
            backgroundImage: "url(/image-mesh-gradient.png)",
            backgroundSize: "200% 200%",
            backgroundPosition: "0% 100%",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-brand-950 text-lg">
              Mark service element delivered
            </DialogTitle>
            <DialogDescription className="text-brand-950/70 text-xs">
              Manually attest an APCM element when activity-based evidence
              isn't enough. Your name is recorded on the audit trail.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {!els ? (
            <p className="text-sm text-brand-500">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-brand-600 italic">
              All 11 elements are already delivered for this month. Audit-ready.
            </p>
          ) : (
            pending
              .sort((a, b) => a.elementId - b.elementId)
              .map((el) => (
                <div
                  key={el._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-brand-100"
                >
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                    {el.elementId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-brand-950 truncate">
                      {el.elementName}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-700">
                      {el.status.replace("_", " ")}
                    </div>
                  </div>
                  <button
                    onClick={() => markIt(el.elementId)}
                    disabled={working === el.elementId}
                    className="text-xs font-medium rounded-full px-3 py-1 bg-foresight hover:bg-foresight-dark text-white transition disabled:opacity-50"
                  >
                    {working === el.elementId ? "Saving…" : "Mark delivered"}
                  </button>
                </div>
              ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────── Schedule retry ──────────────────── */

function ScheduleRetryDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patientId: Id<"patients">;
  patientName: string;
}) {
  const schedule = useMutation(api.mutations.outreach.schedule);
  const [method, setMethod] = useState<"call" | "sms" | "portal" | "email">(
    "call",
  );
  const [when, setWhen] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await schedule({
        patientId,
        method,
        scheduledFor: new Date(when).getTime(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const methods: { value: "call" | "sms" | "portal" | "email"; label: string; Icon: typeof Phone }[] =
    [
      { value: "call", label: "Phone call", Icon: Phone },
      { value: "sms", label: "SMS", Icon: MessageCircle },
      { value: "portal", label: "Portal", Icon: MessageSquarePlus },
      { value: "email", label: "Email", Icon: Mail },
    ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div
          className="px-6 py-5"
          style={{
            backgroundImage: "url(/image-mesh-gradient.png)",
            backgroundSize: "200% 200%",
            backgroundPosition: "100% 0%",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-brand-950 text-lg">
              Schedule retry
            </DialogTitle>
            <DialogDescription className="text-brand-950/70 text-xs">
              Queue an outreach attempt for {patientName}.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-500 mb-2">
              Method
            </div>
            <div className="grid grid-cols-4 gap-2">
              {methods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-[11px] transition ${
                    method === m.value
                      ? "border-foresight bg-foresight/8 text-foresight font-medium"
                      : "border-brand-100 text-brand-600 hover:border-brand-200"
                  }`}
                >
                  <m.Icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-500 mb-2">
              When
            </div>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm text-brand-950 focus:outline-none focus:border-foresight"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium text-brand-600 px-3 py-1.5 rounded-full hover:bg-brand-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-foresight hover:bg-foresight-dark text-white text-xs font-medium transition shadow-sm disabled:opacity-50"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              {saving ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
