import { mutation } from "../_generated/server";
import { requireNurse } from "../lib/auth";

/**
 * Generate a short-lived upload URL for browser file uploads (audio).
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireNurse(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
