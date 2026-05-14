import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin, requireUserId } from "../lib/auth";
import { Id } from "../_generated/dataModel";

/**
 * Delete a user record by id.
 *
 * Authorization:
 *  - Any authenticated user can delete an orphan row (no role assigned).
 *    These are usually stale auth-provider records left behind by signups
 *    that happened before the seed assigned a role.
 *  - Deleting a role-bearing user (nurse / admin / patient) requires an
 *    admin caller.
 *  - Nobody can delete their own row.
 */
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const caller = await requireUserId(ctx);
    if (caller === userId) {
      throw new Error("Cannot delete your own user record.");
    }
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found.");

    if ((user as any).role) {
      // Role-bearing user → admin only.
      await requireAdmin(ctx);
    }
    // Orphan row → any authed user.

    await ctx.db.delete(userId);
    return { ok: true };
  },
});

/**
 * Merge a "donor" user row's identity (role / name / status / practiceId /
 * avatarUrl) into the calling user, then delete the donor. Used to repair the
 * common demo case where Convex Auth created an orphan row at signup and the
 * seed created a separate role-bearing row for the same email.
 *
 * Also re-parents any rows that referenced the donor: patients
 * (primaryNurseId), encounters (nurseId), agentBriefings (userId),
 * agentThreads (userId), and timeLogs (nurseId).
 */
export const mergeFromDonor = mutation({
  args: { donorUserId: v.id("users") },
  handler: async (ctx, { donorUserId }) => {
    const callerId = await requireUserId(ctx);
    if (callerId === donorUserId) {
      throw new Error("Donor cannot be yourself.");
    }
    const caller = await ctx.db.get(callerId);
    const donor = await ctx.db.get(donorUserId);
    if (!caller || !donor) throw new Error("User not found.");
    if ((caller as any).email !== (donor as any).email) {
      throw new Error(
        "Refusing to merge: caller and donor have different emails.",
      );
    }

    // Copy identity fields from donor → caller (only when caller is missing them).
    const patch: any = {};
    const c: any = caller;
    const d: any = donor;
    if (!c.role && d.role) patch.role = d.role;
    if (!c.name && d.name) patch.name = d.name;
    if (!c.status && d.status) patch.status = d.status;
    if (!c.practiceId && d.practiceId) patch.practiceId = d.practiceId;
    if (!c.avatarUrl && d.avatarUrl) patch.avatarUrl = d.avatarUrl;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(callerId, patch);
    }

    // Re-point references from donor to caller.
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_primary_nurse", (q) =>
        q.eq("primaryNurseId", donorUserId as unknown as Id<"users">),
      )
      .collect();
    for (const p of patients) {
      await ctx.db.patch(p._id, { primaryNurseId: callerId });
    }

    const encounters = await ctx.db
      .query("encounters")
      .withIndex("by_nurse_and_date", (q) => q.eq("nurseId", donorUserId))
      .collect();
    for (const e of encounters) {
      await ctx.db.patch(e._id, { nurseId: callerId });
    }

    const briefings = await ctx.db
      .query("agentBriefings")
      .withIndex("by_user_and_date", (q) => q.eq("userId", donorUserId))
      .collect();
    for (const b of briefings) {
      await ctx.db.patch(b._id, { userId: callerId });
    }

    const threads = await ctx.db
      .query("agentThreads")
      .withIndex("by_user_recent", (q) => q.eq("userId", donorUserId))
      .collect();
    for (const t of threads) {
      await ctx.db.patch(t._id, { userId: callerId });
    }

    const timeLogs = await ctx.db
      .query("timeLogs")
      .withIndex("by_nurse_and_month", (q) => q.eq("nurseId", donorUserId))
      .collect();
    for (const t of timeLogs) {
      await ctx.db.patch(t._id, { nurseId: callerId });
    }

    await ctx.db.delete(donorUserId);
    return { ok: true, migrated: { patients: patients.length, encounters: encounters.length, briefings: briefings.length, threads: threads.length, timeLogs: timeLogs.length } };
  },
});

/**
 * Update a user's role. Demo-grade: any authenticated user can promote/demote.
 * Status is set to "active" if it was previously unset, so the row reads as
 * a fully provisioned account afterwards.
 */
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("nurse"), v.literal("patient")),
  },
  handler: async (ctx, { userId, role }) => {
    await requireUserId(ctx);
    const u = await ctx.db.get(userId);
    if (!u) throw new Error("User not found.");
    const patch: any = { role };
    if (!(u as any).status) patch.status = "active";
    await ctx.db.patch(userId, patch);
    return { ok: true };
  },
});
