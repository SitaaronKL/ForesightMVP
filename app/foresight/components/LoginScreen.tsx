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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", step);
      await signIn("password", formData);
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
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
              />
            </label>

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
              {pending ? "…" : step === "signIn" ? "Sign in" : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
              className="w-full text-xs text-brand-600 hover:text-brand-900"
            >
              {step === "signIn"
                ? "Need an account? Create one."
                : "Have an account? Sign in."}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-brand-100 text-xs text-brand-500">
            <strong className="text-brand-700">Demo credentials</strong>
            <br />
            sarah@foresight.demo / foresight-demo-2026 (sign up first)
            <br />
            admin@foresight.demo / foresight-demo-2026
          </div>
        </div>
      </div>
    </div>
  );
}
