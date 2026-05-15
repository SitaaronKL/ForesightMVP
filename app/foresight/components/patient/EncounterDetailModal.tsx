"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TopicChipList } from "../TopicChip";
import { Spinner } from "../Spinner";

export function EncounterDetailModal({
  encounterId,
  onClose,
}: {
  encounterId: Id<"encounters"> | null;
  onClose: () => void;
}) {
  const detail = useQuery(
    api.queries.patients.encounterDetail,
    encounterId ? { encounterId } : "skip",
  );

  return (
    <Dialog
      open={encounterId != null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="max-w-3xl max-h-[88vh] p-0 border-0 bg-white shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="max-h-[88vh] overflow-y-auto">
        <div
          className="px-6 py-5"
          style={{
            backgroundImage: "url(/image-mesh-gradient.png)",
            backgroundSize: "200% 200%",
            backgroundPosition: "0% 100%",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-brand-950 text-xl">
              Encounter details
            </DialogTitle>
            <DialogDescription className="text-brand-950/75 text-xs">
              {detail?.encounter
                ? `${formatType(detail.encounter.type)} · ${fmtDate(detail.encounter.startedAt)}`
                : "Loading encounter…"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!detail && (
            <div className="text-sm text-brand-500 py-8 flex items-center justify-center">
              <Spinner size={18} label="Loading…" />
            </div>
          )}

          {detail?.encounter && (
            <>
              {/* Meta strip */}
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Field label="Date" value={fmtDate(detail.encounter.startedAt)} />
                <Field label="Type" value={formatType(detail.encounter.type)} />
                <Field
                  label="Duration"
                  value={`${Math.round(detail.encounter.durationSeconds / 60)} min`}
                />
                <Field
                  label="Status"
                  value={
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded uppercase ${
                        detail.encounter.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {detail.encounter.status}
                    </span>
                  }
                />
              </section>

              {/* Topics */}
              {(detail.encounter.topicTags ?? []).length > 0 && (
                <section>
                  <SectionLabel>Topics</SectionLabel>
                  <TopicChipList topics={detail.encounter.topicTags} />
                </section>
              )}

              {/* SOAP note */}
              {detail.soapNote ? (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel>SOAP note</SectionLabel>
                    <span className="text-[10px] uppercase tracking-wider text-brand-500">
                      Status: {detail.soapNote.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <SoapSection
                      label="Subjective"
                      body={detail.soapNote.subjective}
                    />
                    <SoapSection
                      label="Objective"
                      body={detail.soapNote.objective}
                    />
                    <SoapSection
                      label="Assessment"
                      body={detail.soapNote.assessment}
                    />
                    <SoapSection label="Plan" body={detail.soapNote.plan} />
                  </div>
                </section>
              ) : (
                <section>
                  <SectionLabel>SOAP note</SectionLabel>
                  <p className="text-xs text-brand-500 italic">
                    No SOAP note logged for this encounter.
                  </p>
                </section>
              )}

              {/* Transcript */}
              {detail.transcript?.text && (
                <section>
                  <SectionLabel>Call transcript</SectionLabel>
                  <div className="text-xs text-brand-700 bg-brand-50 rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {detail.transcript.text}
                  </div>
                </section>
              )}
            </>
          )}

          {detail === null && (
            <div className="text-sm text-brand-500 italic py-6 text-center">
              This encounter could not be loaded.
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold mb-1.5">
      {children}
    </h3>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-brand-500">
        {label}
      </div>
      <div className="mt-0.5 text-brand-950">{value}</div>
    </div>
  );
}

function SoapSection({ label, body }: { label: string; body: string }) {
  if (!body) return null;
  return (
    <div className="rounded-lg border border-brand-100 bg-white px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold mb-1">
        {label}
      </div>
      <div className="text-sm text-brand-950 leading-relaxed whitespace-pre-wrap">
        {body}
      </div>
    </div>
  );
}

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
