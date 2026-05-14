import type { InputGuardrail } from "@openai/agents";

/**
 * Hard rule: the agent never directly contacts a patient.
 * Tripwire short-circuits the run before tokens are spent.
 */
export const noDirectPatientContact: InputGuardrail = {
  name: "no_direct_patient_contact",
  execute: async ({ input }) => {
    const raw = typeof input === "string" ? input : JSON.stringify(input);
    const lower = raw.toLowerCase();
    const tripwires = [
      /\b(text|sms|message|email|call|phone)\s+(the\s+)?patient\b/,
      /\bsend\s+(this\s+|that\s+)?to\s+(the\s+)?patient\b/,
      /\bnotify\s+(the\s+)?patient\b/,
      /\breach\s+out\s+to\s+(the\s+)?patient\s+(directly|now|immediately)\b/,
    ];
    if (tripwires.some((r) => r.test(lower))) {
      return {
        tripwireTriggered: true,
        outputInfo: {
          reason:
            "Sage cannot contact patients directly. Use draftPatientMessage and review before sending.",
        },
      };
    }
    return { tripwireTriggered: false, outputInfo: {} };
  },
};
