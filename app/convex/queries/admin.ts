import { query } from "../_generated/server";
import { requireUser } from "../lib/auth";

/**
 * Return all users (for the admin page to pick a nurse to act as in the demo).
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    if (me.role !== "admin" && me.role !== "nurse") {
      throw new Error("Forbidden");
    }
    return await ctx.db.query("users").collect();
  },
});
