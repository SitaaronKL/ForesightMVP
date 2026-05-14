"use client";

import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type PatientTabKey =
  | "overview"
  | "carePlan"
  | "encounters"
  | "serviceElements"
  | "messages";

const TABS: { key: PatientTabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "carePlan", label: "Care Plan" },
  { key: "encounters", label: "Encounters" },
  { key: "serviceElements", label: "Service Elements" },
  { key: "messages", label: "Messages" },
];

/**
 * Patient detail tab bar. Big outer pill, mini pill indicator that animates
 * between tabs on click and is also draggable — release to snap to the
 * nearest tab.
 */
export function PatientTabs({
  value,
  onChange,
}: {
  value: PatientTabKey;
  onChange: (v: PatientTabKey) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });

  const activeIdx = Math.max(
    0,
    TABS.findIndex((t) => t.key === value),
  );

  // Sync indicator position to active tab
  useLayoutEffect(() => {
    const btn = buttonRefs.current[activeIdx];
    if (!btn || !containerRef.current) return;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      x: btnRect.left - containerLeft,
      width: btnRect.width,
    });
  }, [activeIdx, value]);

  // Reposition on resize (label widths can shift)
  useEffect(() => {
    function reflow() {
      const btn = buttonRefs.current[activeIdx];
      if (!btn || !containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const btnRect = btn.getBoundingClientRect();
      setIndicator({
        x: btnRect.left - containerLeft,
        width: btnRect.width,
      });
    }
    window.addEventListener("resize", reflow);
    return () => window.removeEventListener("resize", reflow);
  }, [activeIdx]);

  function snapToNearest(currentX: number) {
    // currentX is the indicator's left edge in container coords; use its center
    const indicatorCenter = currentX + indicator.width / 2;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    buttonRefs.current.forEach((btn, i) => {
      if (!btn || !containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const btnRect = btn.getBoundingClientRect();
      const btnCenter = btnRect.left - containerLeft + btnRect.width / 2;
      const dist = Math.abs(btnCenter - indicatorCenter);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    });
    onChange(TABS[nearestIdx].key);
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex p-1 bg-white/70 border border-brand-100 rounded-[100px] shadow-sm select-none overflow-hidden"
      role="tablist"
    >
      {/* Sliding mini pill */}
      <motion.div
        layout
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={(_, info) => snapToNearest(indicator.x + info.offset.x)}
        animate={{ x: indicator.x, width: indicator.width }}
        transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.5 }}
        className="absolute top-1 bottom-1 left-0 bg-foresight rounded-full shadow-sm cursor-grab active:cursor-grabbing z-0"
        aria-hidden
      />

      {/* Tab labels */}
      {TABS.map((t, i) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            onClick={() => onChange(t.key)}
            role="tab"
            aria-selected={active}
            className={`relative z-10 px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 ${
              active ? "text-white" : "text-brand-700 hover:text-brand-950"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
