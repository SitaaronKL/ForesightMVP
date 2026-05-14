"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

type Card = {
  kind: string;
  targetId?: string;
  summary: string;
  status: "pending" | "applied" | "dismissed";
};

export function SageActionTray({
  threadId,
  onOpenSoapReview,
}: {
  threadId: Id<"agentThreads">;
  onOpenSoapReview: (soapNoteId: Id<"soapNotes">, patientId: Id<"patients">) => void;
}) {
  const messages = useQuery(api.queries.agent.messages, { threadId });
  const pending = (messages ?? []).flatMap((m: any) =>
    (m.actionCards ?? [])
      .map((card: Card, idx: number) => ({ card, messageId: m._id, idx }))
      .filter((x: any) => x.card.status === "pending"),
  );

  if (pending.length === 0) return null;

  return (
    <div className="border-b border-white/30 p-3 space-y-2 bg-white/30">
      <div className="text-[10px] uppercase tracking-wider text-teal-700 font-semibold">
        Pending actions ({pending.length})
      </div>
      {pending.map(({ card, messageId, idx }: any) => (
        <ActionCardRow
          key={`${messageId}-${idx}`}
          messageId={messageId}
          cardIndex={idx}
          card={card}
          onOpenSoapReview={onOpenSoapReview}
        />
      ))}
    </div>
  );
}

function ActionCardRow({
  messageId,
  cardIndex,
  card,
  onOpenSoapReview,
}: {
  messageId: Id<"agentMessages">;
  cardIndex: number;
  card: Card;
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
    }[card.kind] ?? "Action";

  async function handleApply() {
    setPending(true);
    try {
      if (card.kind === "soap_draft" && card.targetId) {
        const result = await applySoap({
          messageId,
          cardIndex,
          soapNoteId: card.targetId as Id<"soapNotes">,
        });
        onOpenSoapReview(result.soapNoteId, result.patientId);
      } else if (card.kind === "care_plan_revision" && card.targetId) {
        await applyCarePlan({
          messageId,
          cardIndex,
          versionId: card.targetId as Id<"carePlanVersions">,
        });
      } else if (card.kind === "patient_message" && card.targetId) {
        await applyMessage({
          messageId,
          cardIndex,
          patientId: card.targetId as Id<"patients">,
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
    <div className="rounded-lg bg-white/60 border border-white/60 p-2.5 flex items-center justify-between gap-2 shadow-sm">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-teal-700 font-semibold">
          {label}
        </div>
        <div className="text-xs text-brand-900 mt-0.5 truncate">{card.summary}</div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          onClick={handleApply}
          disabled={pending}
          size="sm"
          className="h-7 text-[10px] bg-teal-500 hover:bg-teal-700 text-white"
        >
          {pending ? "…" : card.kind === "soap_draft" ? "Review" : "Apply"}
        </Button>
        <Button
          onClick={() => dismiss({ messageId, cardIndex })}
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-brand-600 hover:bg-white/40 hover:text-brand-900"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
