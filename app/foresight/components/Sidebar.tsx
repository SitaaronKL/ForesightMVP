"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";

export function Sidebar({ user }: { user: any }) {
  const { signOut } = useAuthActions();

  const rawName = user?.name ?? user?.email ?? "…";
  const displayName = typeof rawName === "string" ? rawName.split(",")[0].trim() : rawName;

  return (
    <aside className="sticky top-0 h-screen w-44 shrink-0 flex flex-col backdrop-blur-md bg-white/70 border-r border-brand-100 z-30">
      <div className="px-5 pt-5 pb-4">
        <Link
          href="/dashboard"
          className="text-brand-900 font-semibold tracking-tight text-lg"
        >
          Foresight
        </Link>
      </div>

      <div className="flex-1" />

      <div className="px-3 pb-4">
        <Link
          href="/admin"
          aria-label="Settings"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-brand-700 hover:bg-brand-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </Link>

        <div className="mt-2 flex items-center gap-2 px-3 py-2">
          <span className="flex-1 text-sm text-brand-900 font-medium truncate">
            {displayName}
          </span>
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            title="Sign out"
            className="p-1 rounded-md text-brand-600 hover:text-brand-900 hover:bg-brand-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
