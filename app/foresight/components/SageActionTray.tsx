"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { useRef, useState } from "react";
import { AmbulanceIcon, type AmbulanceIconHandle } from "./AmbulanceIcon";

type Card = {
  kind: string;
  targetId?: string;
  summary: string;
  status: "pending" | "applied" | "dismissed";
};

const KIND_LABEL: Record<string, string> = {
  soap_draft: "SOAP draft",
  care_plan_revision: "Care plan revision",
  patient_message: "Portal message",
  outreach: "Outreach scheduled",
};

export function SageActionTray({
  threadId,
  onOpenSoapReview,
}: {
  threadId: Id<"agentThreads">;
  onOpenSoapReview: (
    soapNoteId: Id<"soapNotes">,
    patientId: Id<"patients">,
  ) => void;
}) {
  const messages = useQuery(api.queries.agent.messages, { threadId });
  const pending = (messages ?? []).flatMap((m: any) =>
    (m.actionCards ?? [])
      .map((card: Card, idx: number) => ({ card, messageId: m._id, idx }))
      .filter((x: any) => x.card.status === "pending"),
  );

  if (pending.length === 0) return null;

  return (
    <div className="border-b border-brand-100 px-4 py-3 space-y-2 bg-white">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-foresight font-semibold">
        <AmbulanceIcon size={12} className="flex items-center" />
        <span>
          Sage drafted {pending.length} action{pending.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
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
  onOpenSoapReview: (
    soapNoteId: Id<"soapNotes">,
    patientId: Id<"patients">,
  ) => void;
}) {
  const applySoap = useMutation(api.mutations.applyActions.applySoapDraft);
  const applyCarePlan = useMutation(
    api.mutations.applyActions.applyCarePlanRevision,
  );
  const applyMessage = useMutation(
    api.mutations.applyActions.applyPatientMessage,
  );
  const dismiss = useMutation(api.mutations.agent.dismissActionCard);
  const [pending, setPending] = useState(false);
  const ambulanceRef = useRef<AmbulanceIconHandle>(null);

  const label = KIND_LABEL[card.kind] ?? "Action";
  const applyLabel = card.kind === "soap_draft" ? "Review draft" : "Apply";

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
    <div
      className="rounded-2xl border border-foresight/20 bg-foresight/5 overflow-hidden"
      onMouseEnter={() => ambulanceRef.current?.startAnimation()}
      onMouseLeave={() => ambulanceRef.current?.stopAnimation()}
    >
      {/* Header: who + what */}
      <div className="px-3 py-2 flex items-center gap-1.5 bg-foresight/10 border-b border-foresight/15">
        <AmbulanceIcon
          ref={ambulanceRef}
          size={12}
          className="flex items-center text-foresight"
        />
        <span className="text-[10px] uppercase tracking-wider text-foresight font-semibold">
          {label}
        </span>
      </div>

      {/* Body: full readable summary */}
      <div className="px-3 py-2.5 text-xs text-brand-950 leading-relaxed whitespace-pre-wrap">
        {card.summary}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <Button
          onClick={handleApply}
          disabled={pending}
          size="sm"
          className="h-7 px-3 text-[11px] rounded-full bg-foresight hover:bg-foresight-dark text-white gap-1"
        >
          <Check className="w-3 h-3" />
          {pending ? "Applying…" : applyLabel}
        </Button>
        <Button
          onClick={() => dismiss({ messageId, cardIndex })}
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-[11px] rounded-full text-brand-600 hover:bg-brand-50 hover:text-brand-950 gap-1"
        >
          <X className="w-3 h-3" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
