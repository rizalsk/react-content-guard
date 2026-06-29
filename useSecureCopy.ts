'use client'

import { useCallback, useRef } from 'react'
import { useAppClipboardStore } from './useAppClipboardStore'
import type { AppClipboardPayload } from './useAppClipboardStore'

type SecureCopyPayload = Omit<
  AppClipboardPayload,
  'copiedAt' | 'expiresAt'
> & { ttl?: number }

/**
 * useSecureCopy
 *
 * Copies data to the internal clipboard store AND wipes the OS clipboard
 * so the data cannot be pasted outside the application.
 *
 * Use this instead of `navigator.clipboard.writeText` inside components
 * that live under SECURE_CONTENT protection.
 *
 * Cross-tab paste works because the internal store is backed by localStorage
 * and AppClipboardBoundary hydrates from it via the `storage` event.
 */
export function useSecureCopy(wipeDelay = 80) {
  const setClipboard = useAppClipboardStore((s) => s.setClipboard)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wipeOsClipboard = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('')
      } catch {
        // browser may block without user gesture — acceptable
      }
    }, wipeDelay)
  }, [wipeDelay])

  /**
   * secureCopy — store payload internally and clear OS clipboard.
   * Returns true so callers can await/chain if needed.
   */
  const secureCopy = useCallback(
    (payload: SecureCopyPayload) => {
      setClipboard(payload)
      wipeOsClipboard()
      return true
    },
    [setClipboard, wipeOsClipboard]
  )

  return { secureCopy, wipeOsClipboard }
}
