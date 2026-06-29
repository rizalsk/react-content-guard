'use client'

import React, { useCallback, useEffect } from 'react'
import { useAppClipboardStore } from './useAppClipboardStore'

export interface AppClipboardBoundaryProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  /**
   * Called when paste fails (no content in clipboard or target is not editable).
   * Defaults to console.warn.
   */
  onWarning?: (message: string) => void
}

const STORAGE_KEY = 'rnd_internal_clipboard_v1'

export default function AppClipboardBoundary({
  children,
  className,
  enabled: isEnabled = true,
  onWarning = (msg) => console.warn(msg),
}: AppClipboardBoundaryProps) {
  // eslint-disable-next-line
  const payload = useAppClipboardStore((s) => s.payload)
  const setClipboard = useAppClipboardStore((s) => s.setClipboard)
  const hydrateClipboard = useAppClipboardStore((s) => s.hydrateClipboard)
  const clearClipboard = useAppClipboardStore((s) => s.clearClipboard)
  const isExpired = useAppClipboardStore((s) => s.isExpired)

  useEffect(() => {
    hydrateClipboard()

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      hydrateClipboard()
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [hydrateClipboard])

  const pasteIntoTarget = useCallback((target: EventTarget | null, text: string) => {
    if (!target) return false

    const el = target as HTMLElement

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? el.value.length
      const before = el.value.slice(0, start)
      const after = el.value.slice(end)
      const newValue = `${before}${text}${after}`

      // Use React's nativeInputValueSetter to properly trigger controlled component update
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        el instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
        'value'
      )?.set
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, newValue)
      } else {
        el.value = newValue
      }

      const nextPosition = start + text.length
      el.setSelectionRange(nextPosition, nextPosition)

      // Dispatch both native and React-compatible events
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }

    const contentEditable = el.closest('[contenteditable="true"]') as HTMLElement | null
    if (contentEditable) {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        contentEditable.appendChild(document.createTextNode(text))
        contentEditable.dispatchEvent(new Event('input', { bubbles: true }))
        return true
      }
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      contentEditable.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    }

    return false
  }, [])

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!isEnabled) return
      const target = e.target as HTMLElement | null

      if (target?.closest('[data-allow-native-copy="true"]')) return

      // Get selected text — supports input/textarea selection too
      let selectedText = ''
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const start = target.selectionStart ?? 0
        const end = target.selectionEnd ?? 0
        selectedText = end > start ? target.value.slice(start, end) : ''
      } else {
        selectedText = window.getSelection()?.toString() || ''
      }

      if (!selectedText.trim()) return

      e.preventDefault()

      setClipboard({ source: 'global', type: 'text', text: selectedText })
    },
    [setClipboard, isEnabled]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!isEnabled) return
      const target = e.target as HTMLElement | null

      if (target?.closest('[data-allow-native-paste="true"]')) return

      const nativeText =
        e.clipboardData?.getData('text/plain') ||
        e.clipboardData?.getData('text') ||
        ''

      /**
       * Check if internal clipboard has content that was copied more recently
       * than the OS clipboard would have been populated.
       */
      const currentPayload = useAppClipboardStore.getState().payload
      const hasInternalContent = !!currentPayload?.text && !isExpired()

      /**
       * PRIORITY 1 — Internal clipboard (secure copy)
       */
      if (hasInternalContent) {
        e.preventDefault()

        const pasteText = currentPayload!.tsv || currentPayload!.text
        const pasted = pasteIntoTarget(e.target, pasteText)
        if (!pasted) {
          onWarning('Paste target is not editable')
        }
        return
      }

      /**
       * PRIORITY 2 — External/native clipboard
       */
      if (nativeText.trim()) return

      // Nothing to paste
      e.preventDefault()
      onWarning('Nothing in clipboard')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearClipboard, isExpired, pasteIntoTarget, isEnabled, onWarning]
  )

  return (
    <div
      className={className}
      onCopy={isEnabled ? handleCopy : undefined}
      onPaste={isEnabled ? handlePaste : undefined}
    >
      {children}
    </div>
  )
}
