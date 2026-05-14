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
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUserId(ctx);
  const authUser = await ctx.db.get(userId);
  if (!authUser) throw new Error("User not found");
  if (authUser.role) return authUser;
  // Demo fallback: look up the seeded overlay row by email
  if (authUser.email) {
    const seeded = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", authUser.email))
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

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
  return user;
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
