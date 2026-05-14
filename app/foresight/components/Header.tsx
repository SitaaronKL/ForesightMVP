"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";

export function Header({ user }: { user: any }) {
  const { signOut } = useAuthActions();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-brand-100">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-brand-900 font-semibold tracking-tight text-lg">
            Foresight
          </Link>
          <span className="text-xs text-brand-500 hidden md:inline">
            {user?.role === "admin" ? "Admin console" : "Care operations"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-brand-700 hidden sm:inline">
            {user?.name ?? user?.email ?? "…"}
          </span>
          <Link href="/admin" className="text-xs text-brand-600 hover:text-brand-900">
            Admin
          </Link>
          <button
            onClick={() => signOut()}
            className="text-xs px-3 py-1.5 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
