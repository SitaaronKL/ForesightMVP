"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useMe } from "../../components/useMe";
import { Sidebar } from "../../components/Sidebar";
import { AgentRail } from "../../components/AgentRail";
import { AgentRailProvider, useAgentRail } from "../../components/AgentRailContext";
import { LoginScreen } from "../../components/LoginScreen";
import { Spinner } from "../../components/Spinner";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center text-brand-700">
          <div className="glass px-8 py-6">
            <Spinner size={20} label="Loading…" />
          </div>
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
  return (
    <div className="min-h-screen">
      <Sidebar user={me} />
      <main
        style={{ paddingRight: collapsed ? 24 : width + 60 }}
        className="min-h-screen pl-[13.5rem] py-6 max-lg:!pr-6"
      >
        <div className="max-w-[960px] mx-auto">{children}</div>
      </main>
      <AgentRail user={me} />
    </div>
  );
}
