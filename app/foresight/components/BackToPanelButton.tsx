"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpLeftIcon, type ArrowUpLeftIconHandle } from "./ArrowUpLeftIcon";

export function BackToPanelButton({ href = "/panel" }: { href?: string }) {
  const iconRef = useRef<ArrowUpLeftIconHandle>(null);
  return (
    <Link
      href={href}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-900 hover:bg-brand-800 text-white text-xs font-medium pl-2.5 pr-3.5 py-1.5 transition shadow-sm"
    >
      <ArrowUpLeftIcon
        ref={iconRef}
        size={14}
        className="flex items-center"
      />
      Back to panel
    </Link>
  );
}
