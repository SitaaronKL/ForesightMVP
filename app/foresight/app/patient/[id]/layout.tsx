"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useMe } from "../../../components/useMe";
import { Sidebar } from "../../../components/Sidebar";
import { AgentRail } from "../../../components/AgentRail";
import { AgentRailProvider, useAgentRail } from "../../../components/AgentRailContext";
import { SageProvider } from "../../../components/SageRuntime";
import { LoginScreen } from "../../../components/LoginScreen";
import { Spinner } from "../../../components/Spinner";
import { useParams } from "next/navigation";
import { Id } from "@convex/_generated/dataModel";

export default function PatientLayout({ children }: { children: ReactNode }) {
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
  const params = useParams();
  const patientId = params.id as Id<"patients">;
  const { collapsed, width } = useAgentRail();
  return (
    <SageProvider contextPatientId={patientId}>
      <div className="min-h-screen">
        <Sidebar user={me} />
        <main
          style={{ paddingRight: collapsed ? 24 : width + 60 }}
          className="min-h-screen pl-[13.5rem] py-6 max-lg:!pr-6"
        >
          <div className="max-w-[960px] mx-auto">{children}</div>
        </main>
        <AgentRail user={me} contextPatientId={patientId} />
      </div>
    </SageProvider>
  );
}
