"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function LoginScreen() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("sarah@foresight.demo");
  const [password, setPassword] = useState("foresight-demo-2026");
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function describeError(err: any): string {
    const raw = String(err?.message ?? err ?? "");
    if (raw.includes("InvalidAccountId")) {
      return "No account exists for that email. Switch to Create one to sign up.";
    }
    if (raw.includes("InvalidSecret") || raw.includes("InvalidPassword")) {
      return "Wrong password.";
    }
    if (raw.includes("password") && raw.includes("min")) {
      return "Password must be at least 8 characters.";
    }
    if (raw.includes("AlreadyExists") || raw.includes("already exists")) {
      return "Account already exists. Switch to Sign in.";
    }
    return raw.replace(/^\[CONVEX[^\]]+\]\s*/, "").slice(0, 240) || "Authentication failed.";
  }

  async function attempt(currentStep: "signIn" | "signUp"): Promise<void> {
    const formData = new FormData();
    formData.set("email", email.toLowerCase().trim());
    formData.set("password", password);
    formData.set("flow", currentStep);
    await signIn("password", formData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      await attempt(step);
    } catch (err: any) {
      const msg = describeError(err);
      // If user was trying to sign in and the account doesn't exist, automatically
      // promote to signUp so the demo flow is single-click.
      const raw = String(err?.message ?? "");
      if (step === "signIn" && raw.includes("InvalidAccountId")) {
        try {
          setInfo("No account yet, creating one…");
          await attempt("signUp");
          setInfo("Account created. You're signed in.");
          return;
        } catch (err2: any) {
          setError(describeError(err2));
          return;
        }
      }
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="glass p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-brand-900 tracking-tight">
              Foresight
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              Care operations for chronic and primary care management.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-brand-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/70 border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                required
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-brand-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/70 border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                required
                minLength={8}
                autoComplete={step === "signUp" ? "new-password" : "current-password"}
              />
            </label>

            {info && (
              <div className="text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded-md px-3 py-2">
                {info}
              </div>
            )}
            {error && (
              <div className="text-xs text-red-warning bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-lg bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-50"
            >
              {pending
                ? "…"
                : step === "signIn"
                  ? "Sign in (or create account)"
                  : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(step === "signIn" ? "signUp" : "signIn");
                setError(null);
                setInfo(null);
              }}
              className="w-full text-xs text-brand-600 hover:text-brand-900"
            >
              {step === "signIn"
                ? "Need an account? Create one explicitly."
                : "Have an account? Sign in."}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-brand-100 text-xs text-brand-500 leading-relaxed">
            <strong className="text-brand-700">Demo</strong>
            <br />
            Click <strong>Sign in</strong> with the prefilled credentials. If no
            account exists yet, one is created automatically.
            <br />
            <span className="text-brand-400">
              sarah@foresight.demo · admin@foresight.demo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
