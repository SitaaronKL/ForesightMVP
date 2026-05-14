import { query } from "../_generated/server";
import { requireUserId } from "../lib/auth";

/**
 * Return all users. Available to any authenticated user because the admin page
 * needs this on first visit (before any seed has been run, the caller has no
 * role yet). This is a demo console; in production it would be admin-only.
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.db.query("users").collect();
  },
});
