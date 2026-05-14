"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./liquid-glass/glass.css";

interface LiquidGlassProps {
  children: ReactNode;
  borderRadius?: number;
  tintOpacity?: number;
  className?: string;
  startDelayMs?: number;
}

export function LiquidGlass({
  children,
  borderRadius = 24,
  tintOpacity = 0.15,
  className,
  startDelayMs = 350,
}: LiquidGlassProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<any>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let startTimer: number | null = null;

    async function start() {
      const [{ default: html2canvas }, mod] = await Promise.all([
        import("html2canvas"),
        import("./liquid-glass/liquid-glass.js"),
      ]);
      if (cancelled || !mountRef.current) return;

      (window as any).html2canvas = html2canvas;

      const instance = new (mod as any).Container({
        borderRadius,
        type: "rounded",
        tintOpacity,
      });

      const el: HTMLElement = instance.element;
      el.style.display = "block";
      el.style.padding = "0";
      el.style.gap = "0";
      el.style.width = "100%";
      el.style.boxSizing = "border-box";
      el.style.isolation = "isolate";

      const canvas: HTMLCanvasElement | null = instance.canvas;
      if (canvas) {
        canvas.style.zIndex = "0";
        canvas.style.boxShadow = "0 8px 24px rgba(11, 59, 92, 0.12)";
      }

      mountRef.current.appendChild(el);
      containerRef.current = instance;
      setTarget(el);

      observer = new ResizeObserver(() => {
        instance.updateSizeFromDOM();
        requestAnimationFrame(() => instance.render?.());
      });
      observer.observe(el);
    }

    startTimer = window.setTimeout(start, startDelayMs);

    return () => {
      cancelled = true;
      if (startTimer != null) clearTimeout(startTimer);
      observer?.disconnect();
      const inst = containerRef.current;
      if (inst?.element?.parentNode) {
        inst.element.parentNode.removeChild(inst.element);
      }
      containerRef.current = null;
      setTarget(null);
    };
  }, [borderRadius, tintOpacity, startDelayMs]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ position: "relative", minHeight: 76 }}
    >
      {target && createPortal(children, target)}
    </div>
  );
}
