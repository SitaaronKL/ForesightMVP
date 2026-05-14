import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Resolve the calling user's id, throwing if not authenticated.
 * Never accept a userId argument for authorization; always derive it here.
 */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/**
 * Resolve the calling user's effective profile. For the demo, auth users sign
 * up separately from the seeded roles; we match them by email so a freshly
 * signed-up "sarah@foresight.demo" inherits the nurse role overlay.
 *
 * Recovery path: if the auth user id no longer points at a row (e.g. an
 * admin deleted the auth row by mistake during a merge), we fall back to the
 * email reported by the auth identity and resolve to whichever surviving row
 * carries that email. This avoids hard-bricking the session.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUserId(ctx);
  let authUser = await ctx.db.get(userId);

  if (!authUser) {
    const identity = await ctx.auth.getUserIdentity();
    const identityEmail = identity?.email?.toLowerCase().trim();
    if (identityEmail) {
      const recovered = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identityEmail))
        .first();
      if (recovered) return recovered;
    }
    throw new Error("User not found");
  }

  if (authUser.role) return authUser;
  // Demo fallback: look up the seeded overlay row by email (case-insensitive)
  if (authUser.email) {
    const normalizedEmail = authUser.email.toLowerCase().trim();
    const seeded = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .filter((q) => q.neq(q.field("_id"), userId))
      .first();
    if (seeded) return seeded;
  }
  return authUser;
}

export async function requireNurse(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "nurse" && user.role !== "admin") {
    throw new Error("Forbidden: nurse role required");
  }
  return user;
}

/**
 * Historically gated admin-only actions. The demo no longer distinguishes
 * admins from nurses — every authed nurse can do "admin" things. This stays
 * as a thin alias so existing call sites keep working.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireNurse(ctx);
}

export async function requirePatientAccess(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patients">,
) {
  const user = await requireUser(ctx);
  const patient = await ctx.db.get(patientId);
  if (!patient) throw new Error("Patient not found");
  if (user.role === "admin") return { user, patient };
  if (user.role === "nurse" && patient.primaryNurseId === user._id) {
    return { user, patient };
  }
  if (user.role === "patient" && patient.portalUserId === user._id) {
    return { user, patient };
  }
  throw new Error("Forbidden: patient not in your scope");
}
