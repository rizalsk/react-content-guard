"use client";

import React, { useEffect, useRef } from "react";

export type ProtectorCanvasVariant =
  /** Animated diagonal stripes that scroll across the canvas. */
  | "stripes"
  /** Subtle noise field that shifts each frame. */
  | "noise"
  /** Concentric rings pulsing from center. */
  | "rings"
  /** Grid pattern with an animated highlight sweep. */
  | "grid"
  /** Static solid color, no animation. */
  | "solid";

export interface ProtectorCanvasProps {
  /** Visual style. Default "grid". */
  variant?: ProtectorCanvasVariant;
  /** Base background color (CSS color string). */
  background?: string;
  /** Foreground / pattern color (CSS color string). */
  foreground?: string;
  /** Foreground opacity 0..1. Default 0.08. */
  patternOpacity?: number;
  /** Pause animation. Default false. */
  paused?: boolean;
  /** Honor `prefers-reduced-motion`. Default true. */
  respectReducedMotion?: boolean;
  /** Optional ARIA label. */
  ariaLabel?: string;
  /** Inline style overrides for the canvas element. */
  style?: React.CSSProperties;
  /** Class name applied to the canvas. */
  className?: string;
}

/**
 * Native HTMLCanvas background renderer for the screen protector.
 *
 * Fills its parent (parent must be `position: relative` or similar)
 * with a subtle animated pattern. Intended as a backdrop for the
 * latch / dismiss overlay when content is hidden.
 *
 * Implementation notes:
 * - Uses a single `requestAnimationFrame` loop tied to a frame counter.
 * - Honors devicePixelRatio for crisp rendering on HiDPI displays.
 * - Pauses cleanly via the `paused` prop or reduced-motion preference.
 * - Repaints on resize using a `ResizeObserver` so the canvas tracks
 *   parent size, not the viewport.
 */
export default function ProtectorCanvas({
  variant = "grid",
  background = "#0b0f1a",
  foreground = "#4f9eff",
  patternOpacity = 0.08,
  paused = false,
  respectReducedMotion = true,
  ariaLabel,
  style,
  className,
}: ProtectorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = !paused && !reduceMotion && variant !== "solid";

    let raf = 0;
    let frame = 0;
    let width = 0;
    let height = 0;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** Convert a hex/css color + alpha into rgba(). */
    const withAlpha = (color: string, alpha: number): string => {
      // Pass through non-hex colors (rgb, hsl, named) — append alpha via color-mix or just return as-is
      if (!color.startsWith("#")) return color;
      const hex = color.slice(1);
      // Normalize: 3-char → 6-char, 8-char → strip alpha channel, anything else → fallback
      let full: string;
      if (hex.length === 3) {
        full = hex.split("").map((c) => c + c).join("");
      } else if (hex.length === 6) {
        full = hex;
      } else if (hex.length === 8) {
        full = hex.slice(0, 6); // strip existing alpha
      } else {
        full = "4f9eff"; // fallback to default blue instead of white
      }
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    const drawBackground = () => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    };

    const drawStripes = () => {
      drawBackground();
      const stripeSize = 40;
      const offset = animate ? (frame * 0.5) % (stripeSize * 2) : 0;
      ctx.save();
      ctx.translate(-stripeSize, -stripeSize);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = withAlpha(foreground, patternOpacity);
      const total = Math.max(width, height) * 2;
      for (let x = -offset; x < total; x += stripeSize * 2) {
        ctx.fillRect(x, 0, stripeSize, total);
      }
      ctx.restore();
    };

    const drawNoise = () => {
      drawBackground();
      const cell = 3;
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const seed = animate ? frame : 0;
      ctx.fillStyle = withAlpha(foreground, patternOpacity);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Cheap pseudo-random based on coords + seed.
          const v = ((x * 374761393 + y * 668265263 + seed * 0x85ebca6b) >>> 0) % 1000;
          if (v < 80) {
            ctx.fillRect(x * cell, y * cell, cell, cell);
          }
        }
      }
    };

    const drawRings = () => {
      drawBackground();
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.hypot(cx, cy);
      const rings = 8;
      const phase = animate ? (frame % 120) / 120 : 0;
      for (let i = 0; i < rings; i++) {
        const t = (i + phase) / rings;
        const r = t * maxR;
        const alpha = patternOpacity * (1 - t);
        ctx.strokeStyle = withAlpha(foreground, alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawGrid = () => {
      drawBackground();
      const cell = 32;
      ctx.strokeStyle = withAlpha(foreground, patternOpacity);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += cell) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += cell) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      if (animate) {
        // Diagonal sweep highlight.
        const period = 240;
        const phase = (frame % period) / period;
        const sweepX = phase * (width + height) - height;
        const gradient = ctx.createLinearGradient(
          sweepX,
          0,
          sweepX + 200,
          height
        );
        gradient.addColorStop(0, withAlpha(foreground, 0));
        gradient.addColorStop(0.5, withAlpha(foreground, patternOpacity * 1.5));
        gradient.addColorStop(1, withAlpha(foreground, 0));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const drawSolid = () => {
      drawBackground();
    };

    const draw = () => {
      switch (variant) {
        case "stripes":
          drawStripes();
          break;
        case "noise":
          drawNoise();
          break;
        case "rings":
          drawRings();
          break;
        case "solid":
          drawSolid();
          break;
        case "grid":
        default:
          drawGrid();
          break;
      }
      frame++;
      if (animate) {
        raf = requestAnimationFrame(draw);
      }
    };

    fit();
    draw();

    const observer = new ResizeObserver(() => {
      fit();
      // Ensure a non-animated variant still repaints to the new size.
      if (!animate) draw();
    });
    observer.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [
    variant,
    background,
    foreground,
    patternOpacity,
    paused,
    respectReducedMotion,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : "presentation"}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        ...style,
      }}
    />
  );
}
