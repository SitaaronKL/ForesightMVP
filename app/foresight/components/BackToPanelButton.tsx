"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpLeftIcon, type ArrowUpLeftIconHandle } from "./ArrowUpLeftIcon";

/**
 * Context-aware back button. Uses router.back() so the user lands on
 * whichever page they actually came from (dashboard, panel, etc.) and
 * adapts its label to match the referrer.
 */
export function BackToPanelButton() {
  const router = useRouter();
  const iconRef = useRef<ArrowUpLeftIconHandle>(null);
  const [label, setLabel] = useState("Back");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const ref = document.referrer;
    try {
      if (!ref) {
        setLabel("Back to dashboard");
        return;
      }
      const url = new URL(ref);
      const path = url.pathname;
      if (path.startsWith("/dashboard")) setLabel("Back to dashboard");
      else if (path.startsWith("/panel")) setLabel("Back to full panel");
      else if (path.startsWith("/admin")) setLabel("Back to admin");
      else if (path === "/" || path === "") setLabel("Back to dashboard");
      else setLabel("Back");
    } catch {
      setLabel("Back");
    }
  }, []);

  function handleBack() {
    // router.back() respects the browser session history, so the user lands
    // on whichever page actually linked here (dashboard, panel, etc.).
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Deep-link fallback when there's no prior history.
      router.push("/dashboard");
    }
  }

  return (
    <button
      onClick={handleBack}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium pl-2.5 pr-3.5 py-1.5 transition shadow-sm"
      aria-label={label}
    >
      <ArrowUpLeftIcon ref={iconRef} size={14} className="flex items-center" />
      {label}
    </button>
  );
}
