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

function originFor(path: string): Origin | null {
  if (path.startsWith("/dashboard"))
    return { path: "/dashboard", label: "Back to dashboard" };
  if (path.startsWith("/panel"))
    return { path: "/panel", label: "Back to panel" };
  if (path.startsWith("/admin"))
    return { path: "/admin", label: "Back to admin" };
  return null;
}

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

    // 1. If the referrer is a dashboard/panel/admin page on this origin,
    //    treat that as the origin and persist it.
    let next: Origin | null = null;
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin) {
          next = originFor(ref.pathname);
        }
      }
    } catch {
      // ignore bad referrer
    }

    // 2. If the referrer wasn't usable (e.g. navigated patient → patient),
    //    fall back to whatever we stashed last time.
    if (!next) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Origin;
          if (parsed?.path && parsed?.label) next = parsed;
        }
      } catch {
        // ignore parse error
      }
    }

    const resolved = next ?? DEFAULT_ORIGIN;
    setOrigin(resolved);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
    } catch {
      // ignore quota / disabled storage
    }
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
