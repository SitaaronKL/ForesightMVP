"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useMe } from "../../components/useMe";
import { Sidebar } from "../../components/Sidebar";
import { AgentRail } from "../../components/AgentRail";
import { LoginScreen } from "../../components/LoginScreen";

export default function PanelLayout({ children }: { children: ReactNode }) {
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
  return (
    <div className="min-h-screen flex">
      <Sidebar user={me} />
      <main className="flex-1 min-w-0 w-full px-6 py-6">
        <div className="max-w-[960px] mx-auto">{children}</div>
      </main>
      <AgentRail user={me} />
    </div>
  );
}
