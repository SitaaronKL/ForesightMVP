"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRef } from "react";
import { LogoutIcon, type LogoutIconHandle } from "./LogoutIcon";
import { SettingsIcon, type SettingsIconHandle } from "./SettingsIcon";

export function Sidebar({ user }: { user: any }) {
  const { signOut } = useAuthActions();
  const settingsRef = useRef<SettingsIconHandle>(null);
  const logoutRef = useRef<LogoutIconHandle>(null);

  const rawName = user?.name ?? user?.email ?? "…";
  const displayName = typeof rawName === "string" ? rawName.split(",")[0].trim() : rawName;

  return (
    <aside className="self-start sticky top-0 h-screen w-44 shrink-0 flex flex-col backdrop-blur-md bg-white/70 border-r border-brand-100 z-30">
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
          onMouseEnter={() => settingsRef.current?.startAnimation()}
          onMouseLeave={() => settingsRef.current?.stopAnimation()}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-brand-700 hover:bg-brand-50"
        >
          <SettingsIcon
            ref={settingsRef}
            size={16}
            className="text-brand-700 flex items-center"
          />
          Settings
        </Link>

        <div className="mt-2 flex items-center gap-2 px-3 py-2">
          <span className="flex-1 text-sm text-brand-900 font-medium truncate">
            {displayName}
          </span>
          <button
            onClick={() => signOut()}
            onMouseEnter={() => logoutRef.current?.startAnimation()}
            onMouseLeave={() => logoutRef.current?.stopAnimation()}
            aria-label="Sign out"
            title="Sign out"
            className="p-1 rounded-md text-brand-600 hover:text-brand-900 hover:bg-brand-50"
          >
            <LogoutIcon ref={logoutRef} size={16} className="flex items-center" />
          </button>
        </div>
      </div>
    </aside>
  );
}
