"use client";

import { useEffect, useRef } from "react";
import {
  LoaderCircleIcon,
  type LoaderCircleIconHandle,
} from "./LoaderCircleIcon";

/**
 * Always-spinning loader for app loading states.
 * Wraps LoaderCircleIcon and auto-starts animation on mount.
 */
export function Spinner({
  size = 18,
  className,
  label,
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  const ref = useRef<LoaderCircleIconHandle>(null);
  useEffect(() => {
    ref.current?.startAnimation();
    return () => ref.current?.stopAnimation();
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircleIcon
        ref={ref}
        size={size}
        className="flex items-center text-foresight"
      />
      {label && <span>{label}</span>}
    </span>
  );
}
