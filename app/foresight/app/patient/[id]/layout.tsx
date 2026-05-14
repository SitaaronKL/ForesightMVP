"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useMe } from "../../../components/useMe";
import { Header } from "../../../components/Header";
import { AgentRail } from "../../../components/AgentRail";
import { LoginScreen } from "../../../components/LoginScreen";
import { useParams } from "next/navigation";
import { Id } from "@convex/_generated/dataModel";

export default function PatientLayout({ children }: { children: ReactNode }) {
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
  const params = useParams();
  const patientId = params.id as Id<"patients">;
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={me} />
      <div className="flex-1 flex">
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-6">
          {children}
        </main>
        <AgentRail user={me} contextPatientId={patientId} />
      </div>
    </div>
  );
}
