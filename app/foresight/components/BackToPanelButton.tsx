"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpLeftIcon, type ArrowUpLeftIconHandle } from "./ArrowUpLeftIcon";

const STORAGE_KEY = "foresight:lastOrigin";

type Origin = {
  path: string;
  label: string;
};

const DEFAULT_ORIGIN: Origin = { path: "/dashboard", label: "Back to dashboard" };

/**
 * Context-aware back button. Tracks the last non-patient page the user
 * visited in sessionStorage so that patient → patient navigation still
 * shows the original origin (dashboard vs panel) rather than collapsing
 * to a generic "Back".
 */
export function BackToPanelButton() {
  const router = useRouter();
  const iconRef = useRef<ArrowUpLeftIconHandle>(null);
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Source of truth is OriginTracker's sessionStorage entry, written
    // whenever the user lands on /dashboard, /panel, or /admin. We don't
    // look at document.referrer because client-side Next.js <Link> nav
    // doesn't update it (it stays pinned to the initial page-load URL).
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Origin;
        if (parsed?.path && parsed?.label) {
          setOrigin(parsed);
          return;
        }
      }
    } catch {
      // ignore parse / storage errors
    }
    setOrigin(DEFAULT_ORIGIN);
  }, []);

  function handleBack() {
    router.push(origin.path);
  }

  return (
    <button
      onClick={handleBack}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium pl-2.5 pr-3.5 py-1.5 transition shadow-sm"
      aria-label={origin.label}
    >
      <ArrowUpLeftIcon ref={iconRef} size={14} className="flex items-center" />
      {origin.label}
    </button>
  );
}
