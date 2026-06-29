"use client";

import { useEffect, useState } from "react";

/**
 * Measures the display refresh rate by counting `requestAnimationFrame`
 * callbacks over a short window. Returns 0 until the first measurement
 * completes, then a stable value (e.g. 60, 120, 144).
 */
export function useRefreshRate(sampleMs: number = 500): number {
  const [hz, setHz] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let frames = 0;
    const start = performance.now();

    const tick = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed >= sampleMs) {
        const measured = Math.round((frames * 1000) / elapsed);
        // Snap to common refresh rates to avoid jitter.
        const snapTargets = [60, 75, 90, 120, 144, 165, 240];
        const snapped =
          snapTargets.find((t) => Math.abs(measured - t) <= 4) ?? measured;
        setHz(snapped);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sampleMs]);

  return hz;
}
