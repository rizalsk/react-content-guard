"use client";

import React, { useEffect, useRef } from "react";
import { useRefreshRate } from "./useRefreshRate";

export type RecordingFlickerMode =
  /**
   * Two-phase luminance flicker. Only invisible on 120Hz+ displays.
   * On 60Hz panels the alternation drops to 30Hz which IS perceptible.
   */
  | "temporal"
  /**
   * Isoluminant chromatic flicker — alternates color channels at
   * constant perceived luminance. Human chromatic flicker fusion
   * threshold is ~25Hz (much lower than luminance), so this stays
   * invisible at 60Hz alternation. Recorders capture the color
   * differences directly.
   *
   * RECOMMENDED for 60Hz displays.
   */
  | "chromatic"
  /**
   * Horizontal scanning band of watermark text. Most visible to the
   * eye but the most reliable against vsync-locked capture.
   */
  | "scan"
  /**
   * Static persistent watermark, no flicker. Use this when accessibility
   * or photosensitivity matters more than recorder asymmetry. Provides
   * traceability only — appears in screenshots and recordings equally.
   */
  | "static";

export interface RecordingFlickerProps {
  /** Watermark text. */
  text?: string;
  /** Disable rendering. */
  disabled?: boolean;
  /**
   * Flicker mode. Default "auto" — selects based on detected refresh rate:
   *   - >=120Hz: "temporal"
   *   - 60..119Hz: "chromatic"
   *   - prefers-reduced-motion: "static"
   */
  mode?: RecordingFlickerMode | "auto";
  /**
   * Intensity (0..1). Higher = stronger on recordings, more visible to eye.
   */
  intensity?: number;
  fontSize?: number;
  spacing?: number;
  rotation?: number;
  /**
   * Minimum refresh rate required for flicker modes. Below this, the
   * component falls back to `static`. Default 90Hz.
   */
  minRefreshRateForFlicker?: number;
  /** Honor `prefers-reduced-motion`. Default true. */
  respectReducedMotion?: boolean;
}

/**
 * Anti-screen-recording watermark overlay.
 *
 * Trade-off note:
 * Browser-side flicker watermarks rely on the display refresh rate
 * exceeding the recorder's frame rate AND the eye's flicker fusion
 * threshold. On a 60Hz display, alternating frames produce 30Hz
 * flicker which is physiologically perceptible — there is no way
 * around this with luminance flicker alone.
 *
 * For 60Hz displays this component defaults to "chromatic" mode which
 * uses isoluminant color flicker (~25Hz fusion threshold). If even
 * chromatic flicker is perceptible on your hardware, set `mode="static"`
 * — you lose recorder asymmetry but keep traceability through the
 * persistent watermark.
 */
export default function RecordingFlicker({
  text = "PROTECTED",
  disabled,
  mode = "auto",
  intensity = 0.06,
  fontSize = 28,
  spacing = 220,
  rotation = -Math.PI / 8,
  minRefreshRateForFlicker = 90,
  respectReducedMotion = true,
}: RecordingFlickerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const refreshRate = useRefreshRate();

  const reducedMotion =
    typeof window !== "undefined" && respectReducedMotion
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Resolve the actual mode from "auto".
  const resolvedMode: RecordingFlickerMode =
    mode !== "auto"
      ? mode
      : reducedMotion
        ? "static"
        : refreshRate === 0
          ? "static" // wait for measurement, no flicker yet
          : refreshRate >= 120
            ? "temporal"
            : refreshRate >= minRefreshRateForFlicker
              ? "chromatic"
              : "static";

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    if (resolvedMode === "static" && refreshRate === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let frame = 0;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawWatermarkGrid = (style: string) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.fillStyle = style;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let y = spacing / 2; y < h + spacing; y += spacing) {
        for (let x = spacing / 2; x < w + spacing; x += spacing) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    };

    const drawTemporal = () => {
      const delta = Math.round(255 * intensity);
      const lum = frame % 2 === 0 ? 128 + delta : 128 - delta;
      drawWatermarkGrid(`rgb(${lum},${lum},${lum})`);
    };

    /**
     * Isoluminant chromatic swap.
     *
     * Y_709 = 0.2126 R + 0.7152 G + 0.0722 B
     *
     * Phase A: pure red at boosted level + matching cyan dim
     * Phase B: pure cyan at matching level + matching red dim
     *
     * Tuned so both phases hit the same luminance Y.
     * Eye sees constant luminance + chroma flicker fusing to gray;
     * camera/codec records the color difference directly.
     */
    const drawChromatic = () => {
      const a = Math.round(255 * intensity);
      // Pick complementary colors that produce equal luminance:
      // Red (1,0,0) → Y = 0.2126
      // Cyan (0,1,1) → Y = 0.7874  (much brighter)
      // To equalize, scale cyan down: cyan_scaled = (0, 0.27, 0.27) gives Y ≈ 0.213
      // We use semi-transparent fills mixed with mid-gray so the *deltas* are isoluminant.
      const phaseA = `rgba(${a * 4},0,0,0.5)`; // boost red channel
      const phaseB = `rgba(0,${Math.round(a * 1.08)},${Math.round(a * 1.08)},0.5)`;
      drawWatermarkGrid(frame % 2 === 0 ? phaseA : phaseB);
    };

    const drawScan = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const bandHeight = fontSize * 3;
      const period = 16;
      const phase = (frame % period) / period;
      const bandY = Math.floor(phase * (h + bandHeight)) - bandHeight;
      const delta = Math.round(255 * intensity);

      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const stripes: Array<{ y: number; lum: number }> = [
        { y: bandY, lum: 128 + delta },
        { y: bandY + bandHeight / 2, lum: 128 - delta },
      ];
      for (const stripe of stripes) {
        ctx.fillStyle = `rgb(${stripe.lum},${stripe.lum},${stripe.lum})`;
        for (let x = spacing / 2; x < w + spacing; x += spacing) {
          ctx.fillText(text, x, stripe.y + bandHeight / 4);
        }
      }
    };

    const drawStatic = () => {
      const lum = 200;
      drawWatermarkGrid(`rgba(${lum},${lum},${lum},${intensity * 0.5})`);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      switch (resolvedMode) {
        case "temporal":
          drawTemporal();
          break;
        case "chromatic":
          drawChromatic();
          break;
        case "scan":
          drawScan();
          break;
        case "static":
        default:
          drawStatic();
          break;
      }
      frame++;
      // For "static" we only need to render once on resize.
      if (resolvedMode !== "static") {
        raf = requestAnimationFrame(draw);
      }
    };

    fit();
    window.addEventListener("resize", fit);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [
    text,
    disabled,
    resolvedMode,
    intensity,
    fontSize,
    spacing,
    rotation,
    refreshRate,
  ]);

  if (disabled) return null;

  // For chromatic mode, `difference` blend mode preserves the
  // color delta strongly while still being subtle on screen.
  // Static and temporal use `overlay` for minimal visual impact.
  const blendMode: React.CSSProperties["mixBlendMode"] =
    resolvedMode === "chromatic"
      ? "difference"
      : resolvedMode === "scan"
        ? "difference"
        : "overlay";

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-flicker-mode={resolvedMode}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        pointerEvents: "none",
        mixBlendMode: blendMode,
      }}
    />
  );
}
