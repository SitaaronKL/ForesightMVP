import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Email + password for the demo. The createOrUpdateUser callback links any
// new signup to an existing user row with the same email (so the seeded
// "Sarah Chen, RN" row is reused instead of getting duplicated by Convex
// Auth on first sign-in). Brand-new emails get a nurse-role row created
// directly — every authed user in this demo is a nurse with full powers.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;

      const rawEmail = args.profile?.email;
      const email =
        typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : null;

      if (email) {
        const match = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), email))
          .first();
        if (match) {
          // Patch in role/status if the row is missing them so signin lands
          // on a usable nurse identity even when the seed hasn't run.
          const patch: any = {};
          if (!(match as any).role) patch.role = "nurse";
          if (!(match as any).status) patch.status = "active";
          if (Object.keys(patch).length > 0) {
            await ctx.db.patch(match._id, patch);
          }
          return match._id;
        }
      }

      // Brand-new email — create a nurse user.
      return await ctx.db.insert("users", {
        email: email ?? undefined,
        role: "nurse",
        status: "active",
      } as any);
    },
  },
});
