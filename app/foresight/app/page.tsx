"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginScreen } from "../components/LoginScreen";
import { useMe } from "../components/useMe";
import { Spinner } from "../components/Spinner";

export default function Home() {
  return (
    <>
      <AuthLoading>
        <Splash text="Loading…" />
      </AuthLoading>
      <Unauthenticated>
        <LoginScreen />
      </Unauthenticated>
      <Authenticated>
        <RoleRouter />
      </Authenticated>
    </>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-brand-700">
      <div className="glass px-8 py-6">
        <Spinner size={20} label={text} />
      </div>
    </div>
  );
}

function RoleRouter() {
  const router = useRouter();
  const me = useMe();
  useEffect(() => {
    if (!me) return;
    const role = (me as any).role;
    if (role === "patient") router.replace("/portal");
    else router.replace("/dashboard");
  }, [me, router]);
  return <Splash text="Loading workspace…" />;
}
