import { query } from "../_generated/server";
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
