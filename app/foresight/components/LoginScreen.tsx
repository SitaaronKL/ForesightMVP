"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LiquidGlass from "liquid-glass-react";
import { Sparkles, ArrowRight } from "lucide-react";

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
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 -z-10 gradient-mesh opacity-90" />
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(128,229,216,0.4) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(94,142,183,0.5) 0%, transparent 50%)",
        }}
      />

      <div className="max-w-md w-full">
        <LiquidGlass
          displacementScale={50}
          blurAmount={0.04}
          saturation={140}
          aberrationIntensity={2}
          elasticity={0.15}
          cornerRadius={28}
          padding="0"
          mode="standard"
        >
          <div className="p-10 w-full">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                  Foresight
                </h1>
                <p className="text-xs text-white/70">
                  Care operations
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs text-white/80">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 bg-white/15 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-teal-300"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs text-white/80">
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
                  className="mt-1 bg-white/15 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-teal-300"
                />
              </div>

              {info && (
                <div className="text-xs text-teal-200 bg-teal-500/15 border border-teal-300/30 rounded-md px-3 py-2">
                  {info}
                </div>
              )}
              {error && (
                <div className="text-xs text-red-200 bg-red-500/15 border border-red-300/30 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-white text-brand-900 hover:bg-white/90 font-medium"
              >
                {pending
                  ? "…"
                  : step === "signIn"
                    ? "Sign in (or create account)"
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
                className="w-full text-xs text-white/70 hover:text-white"
              >
                {step === "signIn"
                  ? "Need an account? Create one explicitly."
                  : "Have an account? Sign in."}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/15 text-xs text-white/60 leading-relaxed">
              <strong className="text-white/85">Demo</strong>
              <br />
              Click Sign in. No account? It's auto-created.
              <br />
              <span className="text-white/40">
                sarah@foresight.demo · admin@foresight.demo
              </span>
            </div>
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
}
