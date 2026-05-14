"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";
import { useMe } from "../../components/useMe";
import { Header } from "../../components/Header";
import { AgentRail } from "../../components/AgentRail";
import { LoginScreen } from "../../components/LoginScreen";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center text-brand-700">
          <div className="glass px-8 py-6">Loading…</div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LoginScreen />
      </Unauthenticated>
      <Authenticated>
        <Workspace>{children}</Workspace>
      </Authenticated>
    </>
  );
}

function Workspace({ children }: { children: ReactNode }) {
  const me = useMe();
  // me is undefined while loading, an object after.
  const role = (me as any)?.role;
  const needsSeed = me !== undefined && role !== "nurse" && role !== "admin";

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={me} />
      <div className="flex-1 flex">
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-6">
          {needsSeed ? <SeedFirstNotice /> : children}
        </main>
        {needsSeed ? null : <AgentRail user={me} />}
      </div>
    </div>
  );
}

function SeedFirstNotice() {
  return (
    <div className="glass p-8 max-w-2xl mx-auto mt-12">
      <h2 className="text-lg font-semibold text-brand-900 mb-2">
        Set up your demo workspace
      </h2>
      <p className="text-sm text-brand-700 leading-relaxed">
        Your account exists but no patient panel has been seeded yet. The dashboard
        is empty until you create one.
      </p>
      <p className="text-sm text-brand-600 mt-3 leading-relaxed">
        Head to the admin console and click <strong>Seed 50 patients</strong>. This
        creates Sarah Chen (nurse), Maria Rodriguez (demo patient), and 49 other
        realistic patients with encounters, care plans, and service-element
        coverage. After seeding, your account picks up the nurse role
        automatically via email match.
      </p>
      <div className="mt-5">
        <Link
          href="/admin"
          className="inline-block px-4 py-2 rounded-lg bg-brand-900 text-white text-sm font-medium hover:bg-brand-800"
        >
          Go to admin →
        </Link>
      </div>
    </div>
  );
}
