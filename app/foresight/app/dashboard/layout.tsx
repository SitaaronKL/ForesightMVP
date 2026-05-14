"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";
import { useMe } from "../../components/useMe";
import { Sidebar } from "../../components/Sidebar";
import { AgentRail } from "../../components/AgentRail";
import { AgentRailProvider, useAgentRail } from "../../components/AgentRailContext";
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
  return (
    <AgentRailProvider>
      <WorkspaceInner>{children}</WorkspaceInner>
    </AgentRailProvider>
  );
}

function WorkspaceInner({ children }: { children: ReactNode }) {
  const me = useMe();
  const { collapsed, width } = useAgentRail();
  const role = (me as any)?.role;
  const needsSeed = me !== undefined && role !== "nurse" && role !== "admin";
  const railOpen = !needsSeed && !collapsed;

  return (
    <div className="min-h-screen">
      <Sidebar user={me} />
      <main
        style={{ paddingRight: railOpen ? width + 60 : 24 }}
        className="min-h-screen pl-[13.5rem] py-6 max-lg:!pr-6"
      >
        <div className="max-w-[960px] mx-auto">
          {needsSeed ? <SeedFirstNotice /> : children}
        </div>
      </main>
      {needsSeed ? null : <AgentRail user={me} />}
    </div>
  );
}

function SeedFirstNotice() {
  return (
    <div className="glass p-8 max-w-2xl mx-auto mt-12">
      <h2 className="text-lg font-semibold text-brand-950 mb-2">
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
