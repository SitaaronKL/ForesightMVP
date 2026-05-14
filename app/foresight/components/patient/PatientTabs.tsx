"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

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
 * Big outer pill with a draggable mini-pill indicator.
 *
 * - Outer container: rounded-full, translucent white, soft border + shadow
 * - Mini pill indicator: sits BEHIND labels (no z-index), in foresight blue
 *   with a slightly smaller corner radius so it reads as nested
 * - Labels are always visible (z-10 above the indicator)
 * - Text color of each label is controlled by hoverIdx — the tab whose
 *   center is currently closest to the indicator's center. So as you
 *   drag the pill, the label currently under it becomes white and the
 *   one it left becomes dark again. No "white on white" disappearing act.
 * - Click a label to jump. Drag the pill to slide. On drag release, snap.
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

  const x = useMotionValue(0);
  const [width, setWidth] = useState(0);

  const activeIdx = Math.max(
    0,
    TABS.findIndex((t) => t.key === value),
  );

  // hoverIdx is which tab the indicator visually sits on right now.
  // Driven both by user drag and by programmatic position changes.
  const [hoverIdx, setHoverIdx] = useState(activeIdx);

  const measureAndPlace = useCallback(
    (idx: number, opts: { animateX?: boolean } = { animateX: true }) => {
      const btn = buttonRefs.current[idx];
      if (!btn || !containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const btnRect = btn.getBoundingClientRect();
      const targetX = btnRect.left - containerLeft;
      setWidth(btnRect.width);
      if (opts.animateX) {
        animate(x, targetX, {
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 0.5,
        });
      } else {
        x.set(targetX);
      }
    },
    [x],
  );

  // Sync indicator to the active tab whenever it changes (click or external).
  useLayoutEffect(() => {
    // First mount: snap without animation so we don't flash from 0.
    measureAndPlace(activeIdx, { animateX: x.get() !== 0 });
    setHoverIdx(activeIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Reposition on resize.
  useEffect(() => {
    const onResize = () => measureAndPlace(activeIdx, { animateX: false });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIdx, measureAndPlace]);

  // Real-time: update hoverIdx as x changes (drag or animate).
  useMotionValueEvent(x, "change", (latest) => {
    if (!containerRef.current || width === 0) return;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    const indicatorCenter = latest + width / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    buttonRefs.current.forEach((btn, i) => {
      if (!btn) return;
      const btnRect = btn.getBoundingClientRect();
      const btnCenter = btnRect.left - containerLeft + btnRect.width / 2;
      const dist = Math.abs(btnCenter - indicatorCenter);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    if (nearest !== hoverIdx) setHoverIdx(nearest);
  });

  function handleDragEnd() {
    onChange(TABS[hoverIdx].key);
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center p-1 bg-white/70 border border-brand-100 rounded-full shadow-sm select-none"
      role="tablist"
    >
      {/* Mini pill indicator — sits BEHIND labels. No z-index = default
          stacking, labels' z-10 puts them on top. Rounded a bit less than
          the outer pill so it reads as nested. */}
      <motion.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, width }}
        className="absolute top-1 bottom-1 left-0 bg-foresight rounded-[28px] shadow-sm cursor-grab active:cursor-grabbing"
        aria-hidden
      />

      {/* Labels — always visible above the indicator */}
      {TABS.map((t, i) => {
        const isOver = hoverIdx === i;
        return (
          <button
            key={t.key}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            onClick={() => onChange(t.key)}
            role="tab"
            aria-selected={t.key === value}
            className={`relative z-10 px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 ${
              isOver ? "text-white" : "text-brand-700 hover:text-brand-950"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
