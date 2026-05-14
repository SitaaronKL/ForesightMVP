import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireNurse, requirePatientAccess } from "../lib/auth";

/**
 * Apply a SOAP draft created by Sage. Opens the review modal client-side;
 * the actual sign happens via mutations/soapNotes.sign. This mutation just
 * marks the action card as applied so the rail UI reflects state.
 */
export const applySoapDraft = mutation({
  args: {
    messageId: v.id("agentMessages"),
    cardIndex: v.number(),
    soapNoteId: v.id("soapNotes"),
  },
  handler: async (ctx, args) => {
    await requireNurse(ctx);
    const note = await ctx.db.get(args.soapNoteId);
    if (!note) throw new Error("Draft not found");
    await requirePatientAccess(ctx, note.patientId);
    const msg = await ctx.db.get(args.messageId);
    if (!msg?.actionCards) return { patientId: note.patientId, soapNoteId: args.soapNoteId };
    const cards = [...msg.actionCards];
    cards[args.cardIndex] = { ...cards[args.cardIndex], status: "applied" };
    await ctx.db.patch(args.messageId, { actionCards: cards });
    return { patientId: note.patientId, soapNoteId: args.soapNoteId };
  },
});

/**
 * Apply a care plan revision suggestion (sets the version reviewStatus to approved
 * and points the care plan at this version).
 */
export const applyCarePlanRevision = mutation({
  args: {
    messageId: v.id("agentMessages"),
    cardIndex: v.number(),
    versionId: v.id("carePlanVersions"),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");
    await requirePatientAccess(ctx, version.patientId);

    await ctx.db.patch(args.versionId, {
      reviewStatus: "approved",
      approvedAt: Date.now(),
      approvedBy: nurse._id,
    });
    await ctx.db.patch(version.carePlanId, { currentVersionId: args.versionId });

    const msg = await ctx.db.get(args.messageId);
    if (msg?.actionCards) {
      const cards = [...msg.actionCards];
      cards[args.cardIndex] = { ...cards[args.cardIndex], status: "applied" };
      await ctx.db.patch(args.messageId, { actionCards: cards });
    }
    return { ok: true };
  },
});

/**
 * Apply a drafted patient message by sending it to the portal.
 */
export const applyPatientMessage = mutation({
  args: {
    messageId: v.id("agentMessages"),
    cardIndex: v.number(),
    patientId: v.id("patients"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);
    await ctx.db.insert("portalMessages", {
      patientId: args.patientId,
      senderType: "nurse",
      senderId: nurse._id,
      content: args.content,
    });
    const msg = await ctx.db.get(args.messageId);
    if (msg?.actionCards) {
      const cards = [...msg.actionCards];
      cards[args.cardIndex] = { ...cards[args.cardIndex], status: "applied" };
      await ctx.db.patch(args.messageId, { actionCards: cards });
    }
    return { ok: true };
  },
});
