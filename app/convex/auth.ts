import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// MVP: password provider (email + password). For the demo, seed creates
// the nurse + admin users with known credentials. Production would
// swap to email + one-time code via the Email provider with a Resend
// or SendGrid mailer.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
