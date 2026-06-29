"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useScreenProtection } from "./useScreenProtection";
import RecordingFlicker from "./RecordingFlicker";
import ProtectorCanvas, { ProtectorCanvasVariant } from "./ProtectorCanvas";

export interface ScreenProtectorProps {
  children: React.ReactNode;
  /**
   * Enable or disable all protection. Defaults to `true`.
   */
  enabled?: boolean;
  devtoolsMessage?: string;
  devtoolsTitle?: string;
  latchTitle?: string;
  latchMessage?: string;
  /** Background pattern variant for the overlay canvas. Default "grid". */
  latchBackgroundVariant?: ProtectorCanvasVariant;
  /** Overlay background color. Default "#0b0f1a". */
  latchBackgroundColor?: string;
  /** Overlay pattern/foreground color. Default "#4f9eff". */
  latchPatternColor?: string;
  /** Overlay pattern opacity 0..1. Default 0.08. */
  latchPatternOpacity?: number;
  /** Pause the overlay animation. Default false. */
  latchAnimationPaused?: boolean;
  /** Text and icon color for all overlays. Default "#f5f5f5". */
  overlayTextColor?: string;
  recordingFlicker?: boolean;
  recordingFlickerText?: string;
  recordingFlickerMode?: "auto" | "temporal" | "chromatic" | "scan" | "static";
  recordingFlickerIntensity?: number;
  /**
   * Enable DevTools detection. Default true.
   */
  devTools?: boolean;
}

const DEFAULT_TITLE = "Protected Content";
const DEFAULT_MESSAGE =
  "Developer tools detected. Close the developer tools to continue using the application.";
const DEFAULT_LATCH_TITLE = "Content Hidden";
const DEFAULT_LATCH_MESSAGE = "Click to show the content again.";

const css: Record<string, React.CSSProperties> = {
  root: {
    position: "relative",
    minHeight: "100vh",
  },
  blurred: {
    filter: "blur(18px) brightness(0.4)",
    transition: "filter 200ms ease-in-out",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483647,
    background: "transparent",
    display: "block",
    textAlign: "center",
    padding: 0,
    fontFamily: "inherit",
    overflow: "hidden",
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  overlayMessage: {
    fontSize: 14,
    opacity: 0.75,
    maxWidth: 480,
    lineHeight: 1.6,
  },
  overlayIcon: {
    width: 56,
    height: 56,
    marginBottom: 16,
    opacity: 0.85,
  },
  dismissOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483646,
    background: "transparent",
    display: "block",
    textAlign: "center",
    padding: 0,
    fontFamily: "inherit",
    border: "none",
    cursor: "pointer",
    WebkitAppearance: "none",
    overflow: "hidden",
  },
  dismissContent: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 1,
    pointerEvents: "none",
  },
};

export default function ScreenProtector({
  children,
  enabled = true,
  devtoolsMessage = DEFAULT_MESSAGE,
  devtoolsTitle = DEFAULT_TITLE,
  latchTitle = DEFAULT_LATCH_TITLE,
  latchMessage = DEFAULT_LATCH_MESSAGE,
  latchBackgroundVariant = "grid",
  latchBackgroundColor = "#0b0f1a",
  latchPatternColor = "#4f9eff",
  latchPatternOpacity = 0.08,
  latchAnimationPaused = false,
  overlayTextColor = "#f5f5f5",
  recordingFlicker = true,
  recordingFlickerText,
  recordingFlickerMode,
  recordingFlickerIntensity,
  devTools = true,
}: ScreenProtectorProps) {
  const active = useMemo(() => enabled, [enabled]);

  const { devtoolsOpen, screenshotLatched, dismissLatch } = useScreenProtection(
    active,
    { devTools }
  );

  // Add meta + print stylesheet to discourage screen-capture flows.
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, noarchive, nosnippet";
    document.head.appendChild(meta);
    const style = document.createElement("style");
    style.setAttribute("data-screen-protector", "true");
    style.textContent = `@media print { body { display: none !important; } }`;
    document.head.appendChild(style);
    return () => {
      meta.remove();
      style.remove();
    };
  }, [active]);

  const lastLatchAtRef = React.useRef(0);
  React.useEffect(() => {
    if (screenshotLatched) lastLatchAtRef.current = Date.now();
  }, [screenshotLatched]);

  const handleDismiss = useCallback(() => {
    const sinceLatch = Date.now() - lastLatchAtRef.current;
    if (sinceLatch < 500) return;
    dismissLatch();
  }, [dismissLatch]);

  if (!active) {
    return <>{children}</>;
  }

  const showOverlay = screenshotLatched && !devtoolsOpen;

  return (
    <div style={css.root}>
      <div style={showOverlay ? css.blurred : undefined}>{children}</div>

      {recordingFlicker && (
        <RecordingFlicker
          text={recordingFlickerText}
          mode={recordingFlickerMode}
          intensity={recordingFlickerIntensity}
        />
      )}

      {showOverlay && (
        <button
          type="button"
          style={{ ...css.dismissOverlay, color: overlayTextColor }}
          onClick={handleDismiss}
          aria-label={latchTitle}
        >
          <ProtectorCanvas
            variant={latchBackgroundVariant}
            background={latchBackgroundColor}
            foreground={latchPatternColor}
            patternOpacity={latchPatternOpacity}
            paused={latchAnimationPaused}
          />
          <div style={css.dismissContent}>
            <svg
              style={css.overlayIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <path d="M3 3l18 18" />
            </svg>
            <div style={css.overlayTitle}>{latchTitle}</div>
            <div style={css.overlayMessage}>{latchMessage}</div>
          </div>
        </button>
      )}

      {devtoolsOpen && (
        <div style={{ ...css.overlay, color: overlayTextColor }} role="alert" aria-live="assertive">
          <ProtectorCanvas
            variant={latchBackgroundVariant}
            background={latchBackgroundColor}
            foreground={latchPatternColor}
            patternOpacity={latchPatternOpacity}
            paused={latchAnimationPaused}
          />
          <div style={css.dismissContent}>
            <svg
              style={css.overlayIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 13l-2 2 2 2" />
              <path d="M15 13l2 2-2 2" />
            </svg>
            <div style={css.overlayTitle}>{devtoolsTitle}</div>
            <div style={css.overlayMessage}>{devtoolsMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
