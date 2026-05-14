import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Returns the currently authenticated user row. Null if not authed.
 * In the demo, the seeded nurse/admin rows are separate from the auth user rows.
 * If the auth-user row has no role, we look for a seeded user with the same email.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    // If this user has a role, return as-is.
    if (user.role) return user;
    // Otherwise, try to find a seeded user with the same email
    if (user.email) {
      const normalizedEmail = user.email.toLowerCase().trim();
      const seeded = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", normalizedEmail))
        .filter((q) => q.neq(q.field("_id"), userId))
        .first();
      if (seeded) {
        return { ...seeded, _authId: userId };
      }
    }
    return user;
  },
});

/**
 * Fetch a user row by id, no auth check.
 * Used by node actions that need to read a user record after resolving the
 * caller id via `getAuthUserId` directly (since `ctx.runQuery` in node
 * actions doesn't always carry the caller's auth context).
 */
export const _byId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/**
 * Resolve the "primary nurse id" for an authenticated user. This is the
 * user row that patients.primaryNurseId actually points at. Logic:
 *
 *   1. If the auth user row itself has role "nurse" or "admin", use it.
 *   2. Otherwise, if the auth user has an email, find another user row with
 *      the same email and role nurse/admin (the seeded row) and use that.
 *   3. Fallback: return the auth user id unchanged.
 *
 * Without this, briefings / admin actions for a freshly-signed-up auth user
 * read from an empty panel (because their auth row owns zero patients).
 */
export const _primaryNurseIdForAuth = internalQuery({
  args: { authUserId: v.id("users") },
  handler: async (ctx, { authUserId }) => {
    const authUser = await ctx.db.get(authUserId);
    if (!authUser) return authUserId;
    if ((authUser as any).role === "nurse" || (authUser as any).role === "admin") {
      return authUserId;
    }
    const email = (authUser as any).email;
    if (typeof email === "string" && email.trim()) {
      const normalized = email.toLowerCase().trim();
      const seeded = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", normalized))
        .filter((q) => q.neq(q.field("_id"), authUserId))
        .first();
      if (seeded) return seeded._id;
    }
    return authUserId;
  },
});
