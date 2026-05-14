"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { LogoutIcon, type LogoutIconHandle } from "./LogoutIcon";
import { SettingsIcon, type SettingsIconHandle } from "./SettingsIcon";
import { LayoutGridIcon, type LayoutGridIconHandle } from "./LayoutGridIcon";
import { UsersIcon, type UsersIconHandle } from "./UsersIcon";

export function Sidebar({ user }: { user: any }) {
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const settingsRef = useRef<SettingsIconHandle>(null);
  const logoutRef = useRef<LogoutIconHandle>(null);
  const dashRef = useRef<LayoutGridIconHandle>(null);
  const panelRef = useRef<UsersIconHandle>(null);

  const rawName = user?.name ?? user?.email ?? "…";
  const displayName = typeof rawName === "string" ? rawName.split(",")[0].trim() : rawName;

  const dashActive = pathname === "/dashboard";
  const panelActive = pathname?.startsWith("/panel") ?? false;

  return (
    <aside className="fixed left-3 top-3 bottom-3 w-44 flex flex-col backdrop-blur-md bg-white/70 border border-brand-100 rounded-[100px] shadow-[0_8px_32px_rgba(11,59,92,0.08)] py-4 z-30">
      <div className="px-5 pt-5 pb-4">
        <Link
          href="/dashboard"
          className="text-brand-900 font-semibold tracking-tight text-lg"
        >
          Foresight
        </Link>
      </div>

      <nav className="px-3 flex flex-col gap-1">
        <Link
          href="/dashboard"
          onMouseEnter={() => dashRef.current?.startAnimation()}
          onMouseLeave={() => dashRef.current?.stopAnimation()}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
            dashActive
              ? "bg-brand-900 text-white"
              : "text-brand-700 hover:bg-brand-50"
          }`}
        >
          <LayoutGridIcon
            ref={dashRef}
            size={16}
            className="flex items-center flex-shrink-0"
          />
          Dashboard
        </Link>

        <Link
          href="/panel"
          onMouseEnter={() => panelRef.current?.startAnimation()}
          onMouseLeave={() => panelRef.current?.stopAnimation()}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
            panelActive
              ? "bg-brand-900 text-white"
              : "text-brand-700 hover:bg-brand-50"
          }`}
        >
          <UsersIcon
            ref={panelRef}
            size={16}
            className="flex items-center flex-shrink-0"
          />
          Full panel
        </Link>
      </nav>

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
