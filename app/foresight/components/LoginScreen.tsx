"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

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
    return (
      raw.replace(/^\[CONVEX[^\]]+\]\s*/, "").slice(0, 240) ||
      "Authentication failed."
    );
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
    // Surface a clear error if Convex auth hangs for more than 15s so the
    // button doesn't appear silently stuck.
    const timeout = setTimeout(() => {
      setError(
        "Sign-in is taking longer than expected. Check your network and try again.",
      );
      setPending(false);
    }, 15000);

    try {
      await attempt(step);
    } catch (err: any) {
      console.error("[LoginScreen] sign-in failed:", err);
      const raw = String(err?.message ?? "");
      if (step === "signIn" && raw.includes("InvalidAccountId")) {
        try {
          setInfo("No account yet, creating one…");
          await attempt("signUp");
          setInfo("Account created. You're signed in.");
          return;
        } catch (err2: any) {
          console.error("[LoginScreen] auto sign-up failed:", err2);
          setError(describeError(err2));
          return;
        }
      }
      setError(describeError(err));
    } finally {
      clearTimeout(timeout);
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center p-6"
      style={{
        backgroundImage: "url(/image-mesh-gradient.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      {/* White sign-in card */}
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-white/60 p-8">
        <div className="mb-7">
          <h1 className="text-4xl font-semibold text-brand-950 tracking-tight">
            ForesightHealth
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs text-brand-700 font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1.5 border-brand-100 focus-visible:ring-foresight"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs text-brand-700 font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={step === "signUp" ? "new-password" : "current-password"}
              className="mt-1.5 border-brand-100 focus-visible:ring-foresight"
            />
          </div>

          {info && (
            <div className="text-xs text-foresight bg-foresight/10 border border-foresight/20 rounded-md px-3 py-2">
              {info}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-warning bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-foresight hover:bg-foresight-dark text-white font-medium shadow-sm h-10"
          >
            {pending
              ? "…"
              : step === "signIn"
                ? "Sign in"
                : "Create account"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep(step === "signIn" ? "signUp" : "signIn");
              setError(null);
              setInfo(null);
            }}
            className="w-full text-xs text-brand-600 hover:text-foresight transition-colors"
          >
            {step === "signIn"
              ? "Need an account? Create one."
              : "Have an account? Sign in."}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-brand-100 text-[11px] text-brand-500 leading-relaxed">
          <strong className="text-brand-700">Demo:</strong> click Sign in. No
          account? It&apos;s auto-created.
          <div className="mt-1 text-brand-400 truncate">
            sarah@foresight.demo · admin@foresight.demo
          </div>
        </div>
      </div>
    </div>
  );
}
