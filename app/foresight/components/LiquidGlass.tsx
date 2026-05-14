"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./liquid-glass/glass.css";

function makeFallbackSnapshot(): HTMLCanvasElement {
  const w = Math.max(window.innerWidth, 1280);
  const h = Math.max(document.documentElement.scrollHeight, 800);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

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
      const [h2c, mod] = await Promise.all([
        import("html2canvas"),
        import("./liquid-glass/liquid-glass.js"),
      ]);
      if (cancelled || !mountRef.current) return;

      const html2canvas = (h2c as any).default ?? h2c;

      // html2canvas can't parse oklab/oklch color functions emitted by
      // Tailwind v4, so wrap it and substitute a soft-gradient canvas on
      // failure. The WebGL refraction needs *some* texture to refract.
      (window as any).html2canvas = (...args: any[]) => {
        return html2canvas(...args).catch((err: any) => {
          console.warn(
            "[LiquidGlass] html2canvas failed, using gradient fallback:",
            err?.message ?? err,
          );
          return makeFallbackSnapshot();
        });
      };

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
      el.style.background = "transparent";
      el.style.border = "1px solid rgba(255, 255, 255, 0.5)";
      el.style.boxShadow = "0 8px 32px rgba(28, 36, 79, 0.08)";

      const canvas: HTMLCanvasElement | null = instance.canvas;
      if (canvas) {
        canvas.style.zIndex = "-1";
        canvas.style.boxShadow = "none";
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
