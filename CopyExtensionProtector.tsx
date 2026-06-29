'use client'

import React, { useEffect, useRef } from 'react'

export interface CopyExtensionProtectorProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  clearDelay?: number
}

export default function CopyExtensionProtector({
  children,
  className,
  enabled = true,
  clearDelay = 120,
}: CopyExtensionProtectorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    const clearProtectedSelection = () => {
      const root = rootRef.current
      const selection = window.getSelection()
      if (!root || !selection || selection.rangeCount === 0) return

      const anchor = selection.anchorNode
      const focus = selection.focusNode
      const anchorEl = anchor instanceof HTMLElement ? anchor : anchor?.parentElement
      const focusEl = focus instanceof HTMLElement ? focus : focus?.parentElement
      const isInside =
        (anchorEl && root.contains(anchorEl)) ||
        (focusEl && root.contains(focusEl))
      if (!isInside) return

      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const latest = window.getSelection()
        if (!latest || latest.rangeCount === 0) return
        latest.removeAllRanges()
      }, clearDelay)
    }

    document.addEventListener('selectionchange', clearProtectedSelection)
    return () => {
      document.removeEventListener('selectionchange', clearProtectedSelection)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [enabled, clearDelay])

  const preventClipboard = (e: React.ClipboardEvent) => {
    if (!enabled) return
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-allow-native-copy="true"]')) return
    e.preventDefault()
    e.stopPropagation()
  }

  const preventNative = (e: React.SyntheticEvent) => {
    if (!enabled) return
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-allow-native-copy="true"]')) return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      ref={rootRef}
      onCopy={preventClipboard}
      onCut={preventClipboard}
      onContextMenu={preventNative}
      onDragStart={preventNative}
      className={className}
      style={{
        WebkitUserDrag: 'none',
        WebkitTouchCallout: 'none',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
