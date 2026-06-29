"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Screen protection hook.
 *
 * The web platform CANNOT prevent PrintScreen from capturing the
 * screen on Windows. The OS captures PrtScr in the kernel and
 * routes it to the Snipping Tool BEFORE the browser sees a key
 * event. On Windows 11 the only thing that lands in the page is
 * `keyup` (sometimes) and `blur` (after the snip session ends).
 *
 * This hook tracks state only and exposes:
 *   - `screenshotLatched` so the consumer (React) renders a single
 *     overlay when triggered.
 *   - `dismissLatch()` to clear the latch.
 *
 * The visual cover is drawn entirely by the React tree using
 * `ProtectorCanvas`, so we don't get two layers fighting each
 * other.
 */
export interface ScreenProtectionState {
  devtoolsOpen: boolean;
  printScreenSuspected: boolean;
  /** Hard latch: persists until `dismissLatch()` is called. */
  screenshotLatched: boolean;
  /** Programmatically dismiss the latch. */
  dismissLatch: () => void;
}

const WIPE_TICK_MS = 200;
const WIPE_DURATION_MS = 2000;
const SUSPECT_FLASH_MS = 1500;

export function useScreenProtection(
  enabled: boolean,
  options: { devTools?: boolean } = {}
): ScreenProtectionState {
  const { devTools: devToolsDetectionEnabled = true } = options;
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const [printScreenSuspected, setPrintScreenSuspected] = useState(false);
  const [screenshotLatched, setScreenshotLatched] = useState(false);

  // Toggle to enable verbose console diagnostics.
  const DEBUG = false;

  const latchedRef = useRef(false);
  const dismissRef = useRef<() => void>(() => {});
  const dismissLatch = useCallback(() => dismissRef.current(), []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    /* ------------------------------------------------------------
     * Print stylesheet — discourage screenshots via the print path.
     * ------------------------------------------------------------ */
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-screen-protector-print", "true");
    styleEl.textContent = `@media print { body { display: none !important; } }`;
    document.head.appendChild(styleEl);

    /* ------------------------------------------------------------
     * Lock primitives — pure state, no DOM cover.
     * ------------------------------------------------------------ */
    const lockNow = () => {
      if (!latchedRef.current) {
        latchedRef.current = true;
        setScreenshotLatched(true);
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.log(
            "%c[SP] SCREEN LOCK ACTIVE",
            "color:#ef4444;font-weight:bold;font-size:13px;background:#1a0000;padding:2px 6px;border-radius:3px"
          );
        }
      } else if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
          "%c[SP] lock attempt (already locked)",
          "color:#64748b;font-style:italic"
        );
      }
    };

    const unlock = () => {
      if (latchedRef.current) {
        latchedRef.current = false;
        setScreenshotLatched(false);
        if (DEBUG) {
          const stack = new Error("unlock").stack
            ?.split("\n")
            .slice(2, 6)
            .join("\n");
          // eslint-disable-next-line no-console
          console.log(
            "%c[SP] SCREEN LOCK RELEASED",
            "color:#22c55e;font-weight:bold;font-size:13px;background:#001a00;padding:2px 6px;border-radius:3px"
          );
          // eslint-disable-next-line no-console
          console.log(
            `%c[SP] unlock called from:\n${stack ?? "(no stack)"}`,
            "color:#22c55e"
          );
        }
      }
    };

    dismissRef.current = unlock;

    /* ------------------------------------------------------------
     * Suspected flash.
     * ------------------------------------------------------------ */
    let suspectTimer: number | null = null;
    const flashSuspected = () => {
      setPrintScreenSuspected(true);
      if (suspectTimer !== null) window.clearTimeout(suspectTimer);
      suspectTimer = window.setTimeout(() => {
        setPrintScreenSuspected(false);
        suspectTimer = null;
      }, SUSPECT_FLASH_MS);
    };

    /* ------------------------------------------------------------
     * Lightweight clipboard wipe.
     * ------------------------------------------------------------ */
    const TRANSPARENT_PNG = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
      0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
      0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00,
      0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    let wipeInFlight = false;
    let wipeUntil = 0;
    let wipeTimer: number | null = null;

    const doAsyncWipe = () => {
      if (wipeInFlight) return;
      if (!document.hasFocus()) return;
      wipeInFlight = true;
      (async () => {
        try {
          if (
            navigator?.clipboard?.write &&
            typeof window.ClipboardItem === "function"
          ) {
            const pngBlob = new Blob([TRANSPARENT_PNG], { type: "image/png" });
            const textBlob = new Blob([""], { type: "text/plain" });
            await navigator.clipboard.write([
              new window.ClipboardItem({
                "image/png": pngBlob,
                "text/plain": textBlob,
              }),
            ]);
          } else if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          /* ignore */
        } finally {
          wipeInFlight = false;
        }
      })();
    };

    const armWipe = () => {
      const now = Date.now();
      wipeUntil = Math.max(wipeUntil, now + WIPE_DURATION_MS);
      if (wipeTimer !== null) return;
      doAsyncWipe();
      wipeTimer = window.setInterval(() => {
        doAsyncWipe();
        if (Date.now() >= wipeUntil) {
          if (wipeTimer !== null) {
            window.clearInterval(wipeTimer);
            wipeTimer = null;
          }
        }
      }, WIPE_TICK_MS);
    };

    const hardLock = () => {
      lockNow();
      armWipe();
    };

    /* ------------------------------------------------------------
     * Event log helper.
     * ------------------------------------------------------------ */
    const log = (label: string, color = "#60a5fa", detail?: string) => {
      if (!DEBUG) return;
      // eslint-disable-next-line no-console
      console.log(
        `%c[SP] ${label}%c${detail ? "  " + detail : ""}`,
        `color:${color};font-weight:bold`,
        "color:#cbd5e1"
      );
    };

    /* ------------------------------------------------------------
     * Keyboard.
     * ------------------------------------------------------------ */
    const isPrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") return true;
      if (e.code === "PrintScreen") return true;
      if (e.code === "Snapshot") return true;
      const legacy = (e as KeyboardEvent & { keyCode?: number }).keyCode;
      return legacy === 44;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isPrintScreen(e)) {
        log("PrtScr KEYDOWN", "#f59e0b", `repeat=${e.repeat}`);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        flashSuspected();
        hardLock();
        return;
      }

      if (e.repeat) return;

      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (key === "F12") {
        log("F12 blocked");
        e.preventDefault();
        return;
      }
      if (ctrl && shift && ["I", "J", "C", "K"].includes(key.toUpperCase())) {
        log("DevTools shortcut blocked", "#a78bfa", `key=${key}`);
        e.preventDefault();
        return;
      }
      if (ctrl && ["U", "S", "P"].includes(key.toUpperCase())) {
        log("Save/View/Print blocked", "#a78bfa", `key=${key}`);
        e.preventDefault();
        return;
      }
      if (e.metaKey && shift && key.toUpperCase() === "S") {
        log("Win+Shift+S detected", "#ef4444");
        hardLock();
        flashSuspected();
      }
      if (e.altKey && (key === "PrintScreen" || e.code === "Snapshot")) {
        log("Alt+PrtScr detected", "#ef4444");
        e.preventDefault();
        flashSuspected();
        hardLock();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isPrintScreen(e)) {
        log("PrtScr KEYUP", "#f59e0b");
        e.preventDefault();
        flashSuspected();
        hardLock();
      }
    };

    /* ------------------------------------------------------------
     * Focus / visibility / page lifecycle.
     * ------------------------------------------------------------ */
    const onBlur = () => {
      log("window.blur", "#ef4444");
      hardLock();
    };
    const onFocus = () => {
      log("window.focus", "#22c55e");
      if (Date.now() < wipeUntil) doAsyncWipe();
    };
    const onVisibility = () => {
      log(
        "document.visibilitychange",
        "#a78bfa",
        `state=${document.visibilityState}`
      );
      if (document.visibilityState !== "visible") {
        hardLock();
      } else if (Date.now() < wipeUntil) {
        doAsyncWipe();
      }
    };
    const onPointerOut = (e: PointerEvent) => {
      if (
        e.clientY <= 0 ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        log("viewport mouseleave", "#fb923c");
        flashSuspected();
      }
    };
    const onPageHide = () => {
      log("window.pagehide", "#ef4444");
      hardLock();
    };
    const onClipboardChange = () => {
      log("clipboardchange", "#a78bfa");
      if (Date.now() < wipeUntil) doAsyncWipe();
    };

    const opts = { capture: true } as const;
    window.addEventListener("keydown", onKeyDown, opts);
    window.addEventListener("keyup", onKeyUp, opts);
    document.addEventListener("keydown", onKeyDown, opts);
    document.addEventListener("keyup", onKeyUp, opts);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerout", onPointerOut, opts);
    document.documentElement.addEventListener("mouseleave", onBlur);
    window.addEventListener("pagehide", onPageHide);

    let clipboardChangeBound = false;
    try {
      const clip = navigator?.clipboard as
        | (Clipboard & EventTarget)
        | undefined;
      if (clip && typeof clip.addEventListener === "function") {
        clip.addEventListener("clipboardchange", onClipboardChange);
        clipboardChangeBound = true;
      }
    } catch {
      /* not supported */
    }

    if (!document.hasFocus()) lockNow();

    /* ------------------------------------------------------------
     * Lifecycle diagnostics — detect if the page is reloading or
     * navigating (which clears the console and would explain "logs
     * disappear suddenly").
     * ------------------------------------------------------------ */
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[SP] HOOK MOUNTED at ${location.href}`,
        "color:#22d3ee;font-weight:bold;background:#001a1a;padding:2px 6px;border-radius:3px"
      );
    }

    const onBeforeUnload = () => {
      if (!DEBUG) return;
      // eslint-disable-next-line no-console
      console.warn(
        "%c[SP] PAGE BEFOREUNLOAD — page is reloading/navigating!",
        "color:#fbbf24;font-weight:bold;background:#332200;padding:2px 6px;border-radius:3px"
      );
    };
    const onPopState = () => {
      if (!DEBUG) return;
      // eslint-disable-next-line no-console
      console.warn(
        `%c[SP] popstate → ${location.href}`,
        "color:#fbbf24;font-weight:bold"
      );
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    // Heartbeat — if you stop seeing this, console was cleared.
    const heartbeat = DEBUG
      ? window.setInterval(() => {
          // eslint-disable-next-line no-console
          console.log(
            `%c[SP] heartbeat ${new Date().toLocaleTimeString()}`,
            "color:#475569"
          );
        }, 5000)
      : null;

    /* ------------------------------------------------------------
     * DevTools detection (opt-in).
     * ------------------------------------------------------------ */
    const THRESHOLD = 160;
    let timingDetected = false;
    let sizeInterval: number | null = null;
    let timingInterval: number | null = null;
    const checkDevtools = () => {
      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;
      const sizeDetected = widthGap > THRESHOLD || heightGap > THRESHOLD;
      setDevtoolsOpen(sizeDetected || timingDetected);
    };
    const timingProbe = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const elapsed = performance.now() - start;
      timingDetected = elapsed > 100;
      checkDevtools();
    };
    if (devToolsDetectionEnabled) {
      checkDevtools();
      sizeInterval = window.setInterval(checkDevtools, 1000);
      timingInterval = window.setInterval(timingProbe, 2000);
      window.addEventListener("resize", checkDevtools);
    } else {
      setDevtoolsOpen(false);
    }

    /* ------------------------------------------------------------ */
    return () => {
      window.removeEventListener("keydown", onKeyDown, opts as never);
      window.removeEventListener("keyup", onKeyUp, opts as never);
      document.removeEventListener("keydown", onKeyDown, opts as never);
      document.removeEventListener("keyup", onKeyUp, opts as never);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerout", onPointerOut, opts as never);
      document.documentElement.removeEventListener("mouseleave", onBlur);
      window.removeEventListener("pagehide", onPageHide);

      if (clipboardChangeBound) {
        try {
          (navigator.clipboard as Clipboard & EventTarget).removeEventListener(
            "clipboardchange",
            onClipboardChange
          );
        } catch {
          /* ignore */
        }
      }

      window.removeEventListener("resize", checkDevtools);
      if (sizeInterval !== null) window.clearInterval(sizeInterval);
      if (timingInterval !== null) window.clearInterval(timingInterval);

      if (wipeTimer !== null) window.clearInterval(wipeTimer);
      if (suspectTimer !== null) window.clearTimeout(suspectTimer);

      if (styleEl.isConnected) styleEl.remove();
      latchedRef.current = false;
      dismissRef.current = () => {};

      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      if (heartbeat !== null) window.clearInterval(heartbeat);
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
          "%c[SP] HOOK UNMOUNTED",
          "color:#22d3ee;font-weight:bold;background:#001a1a;padding:2px 6px;border-radius:3px"
        );
      }
    };
  }, [enabled, devToolsDetectionEnabled]);

  return {
    devtoolsOpen,
    printScreenSuspected,
    screenshotLatched,
    dismissLatch,
  };
}
