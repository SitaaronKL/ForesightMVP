"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleHelpIcon, type CircleHelpIconHandle } from "./CircleHelpIcon";

interface HelpHintProps {
  children: ReactNode;
  size?: number;
  /** Tooltip width in px. */
  width?: number;
  className?: string;
}

export function HelpHint({
  children,
  size = 13,
  width = 240,
  className,
}: HelpHintProps) {
  const iconRef = useRef<CircleHelpIconHandle>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    let left = rect.right + gap; // anchor to bottom-right of icon
    let top = rect.bottom + gap;
    // Clamp to viewport so the tooltip doesn't escape the screen.
    if (left + width + margin > window.innerWidth) {
      left = Math.max(margin, window.innerWidth - width - margin);
    }
    setCoords({ top, left });
  }, [open, width]);

  function handleEnter() {
    iconRef.current?.startAnimation();
    setOpen(true);
  }

  function handleLeave() {
    iconRef.current?.stopAnimation();
    setOpen(false);
  }

  const tooltip =
    open && coords && mounted
      ? createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width,
            }}
            className="z-[1000] px-3 py-2 rounded-xl text-[11px] leading-relaxed text-brand-950 whitespace-normal pointer-events-none bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 shadow-[0_8px_32px_rgba(11,59,92,0.18),0_1px_0_rgba(255,255,255,0.8)_inset]"
          >
            {children}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative inline-flex items-center align-middle ${className ?? ""}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <CircleHelpIcon
          ref={iconRef}
          size={size}
          className="text-brand-400 hover:text-brand-700 transition-colors flex items-center cursor-help"
        />
      </span>
      {tooltip}
    </>
  );
}
