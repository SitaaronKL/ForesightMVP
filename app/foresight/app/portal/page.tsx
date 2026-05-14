"use client";

import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { LoginScreen } from "../../components/LoginScreen";
import { useMe } from "../../components/useMe";
import { Spinner } from "../../components/Spinner";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function PortalPage() {
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
        <Portal />
      </Authenticated>
    </>
  );
}

function Portal() {
  const me = useMe();
  const { signOut } = useAuthActions();
  // In the demo we don't have a per-patient auth user; show the demo content for Maria.
  // A fuller build would map portalUserId → patient.
  // For demo: list patients accessible to this auth user (admin can see all).
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-brand-950">My Care</h1>
          <button
            onClick={() => signOut()}
            className="text-xs px-3 py-1.5 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700"
          >
            Sign out
          </button>
        </header>

        <div className="glass p-6 text-center">
          <h2 className="text-lg font-semibold text-brand-950 mb-2">
            Portal preview
          </h2>
          <p className="text-sm text-brand-600 leading-relaxed">
            The patient portal renders a plain-English care plan, monthly statements,
            and a message thread with the nurse. In the demo, sign in as the seeded nurse
            ({me?.email ?? "sarah@foresight.demo"}) to see the full nurse workspace,
            or open a patient detail page to see what a patient's care plan looks like
            (the Care Plan tab is the same data shown plain-English here in production).
          </p>
        </div>
      </div>
    </div>
  );
}
