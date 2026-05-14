"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "foresight:lastOrigin";

type Origin = { path: string; label: string };

function originForPath(path: string): Origin | null {
  if (path.startsWith("/dashboard"))
    return { path: "/dashboard", label: "Back to dashboard" };
  if (path.startsWith("/panel"))
    return { path: "/panel", label: "Back to panel" };
  if (path.startsWith("/admin"))
    return { path: "/admin", label: "Back to admin" };
  return null;
}

/**
 * Persists the last "origin" page the user visited (dashboard / panel /
 * admin) into sessionStorage. Mounted once at the root so it observes
 * every client-side navigation. BackToPanelButton reads from the same
 * key to decide where the back arrow lands.
 *
 * Client-side <Link> nav doesn't update document.referrer, so we have
 * to capture origin at the source rather than at the destination.
 */
export function OriginTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;
    const origin = originForPath(pathname);
    if (!origin) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }, [pathname]);

  return null;
}
