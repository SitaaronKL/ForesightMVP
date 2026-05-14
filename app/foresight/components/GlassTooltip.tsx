"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface GlassTooltipProps {
  content: ReactNode;
  /** Tooltip width in px. Default 240. */
  width?: number;
  /** Hover delay in ms before showing. Default 60. */
  delay?: number;
  children: ReactNode;
}

/**
 * Liquid-glass hover tooltip that wraps any trigger element. Same visual
 * recipe as HelpHint but accepts arbitrary children as the trigger so any
 * pill / button / chip can opt into the consistent tooltip style.
 *
 * Renders via portal so it can escape clipped containers (dialogs, scroll
 * regions, dropdowns). Position clamps to the viewport.
 */
export function GlassTooltip({
  content,
  width = 240,
  delay = 60,
  children,
}: GlassTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    let left = rect.left + rect.width / 2 - width / 2;
    let top = rect.bottom + gap;
    if (left + width + margin > window.innerWidth) {
      left = Math.max(margin, window.innerWidth - width - margin);
    }
    if (left < margin) left = margin;
    if (top + 80 > window.innerHeight) {
      top = rect.top - 80 - gap;
    }
    setCoords({ top, left });
  }, [open, width]);

  function handleEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  }
  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }

  const tooltip =
    open && coords && mounted && content
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
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        className="inline-flex items-center"
      >
        {children}
      </span>
      {tooltip}
    </>
  );
}
