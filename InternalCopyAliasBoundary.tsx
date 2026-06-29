'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAppClipboardStore } from './useAppClipboardStore'

export interface InternalCopyAliasBoundaryProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  restoreDelay?: number
}

type MenuState = {
  open: boolean
  x: number
  y: number
}

const menuStyle: React.CSSProperties = {
  minWidth: 140,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
  padding: 6,
}

const menuButtonStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 8,
  fontSize: 13,
  color: '#333',
  cursor: 'pointer',
}

export default function InternalCopyAliasBoundary({
  children,
  className,
  enabled = true,
  restoreDelay = 100,
}: InternalCopyAliasBoundaryProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const restoreTimerRef = useRef<number | null>(null)
  const [menuHover, setMenuHover] = useState(false)

  const setClipboard = useAppClipboardStore((s) => s.setClipboard)

  const [menu, setMenu] = useState<MenuState>({ open: false, x: 0, y: 0 })

  const isNodeInsideRoot = useCallback((node: Node | null) => {
    const root = rootRef.current
    if (!root || !node) return false
    const el = node instanceof HTMLElement ? node : node.parentElement
    return !!el && root.contains(el)
  }, [])

  const isSelectionInside = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false
    return (
      isNodeInsideRoot(selection.anchorNode) ||
      isNodeInsideRoot(selection.focusNode)
    )
  }, [isNodeInsideRoot])

  const getSelectedText = useCallback((target?: EventTarget | null): string => {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const start = target.selectionStart ?? 0
      const end = target.selectionEnd ?? 0
      if (end > start) return target.value.slice(start, end)
      return ''
    }
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return ''
    if (!isSelectionInside()) return ''
    return selection.toString()
  }, [isSelectionInside])

  const wipeOsClipboard = useCallback(() => {
    if (restoreTimerRef.current) window.clearTimeout(restoreTimerRef.current)
    restoreTimerRef.current = window.setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('')
      } catch {
        // browser may block async clipboard write without user gesture
      }
    }, restoreDelay)
  }, [restoreDelay])

  const copyToInternal = useCallback((text: string) => {
    if (!text.trim()) return false
    setClipboard({ source: 'global', type: 'text', text })
    return true
  }, [setClipboard])

  const handleReactCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!enabled) return
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-allow-native-copy="true"]')) return
      const selectedText = getSelectedText(target)
      if (!selectedText.trim()) return
      e.preventDefault()
      e.stopPropagation()
      try {
        e.clipboardData.setData('text/plain', '')
        e.clipboardData.setData('text/html', '')
      } catch { /* read-only in some browsers */ }
      copyToInternal(selectedText)
      wipeOsClipboard()
    },
    [copyToInternal, enabled, getSelectedText, wipeOsClipboard]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) return
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-allow-native-contextmenu="true"]')) return
      e.preventDefault()
      setMenu({ open: true, x: e.clientX, y: e.clientY })
    },
    [enabled]
  )

  const handleCopyFromMenu = useCallback(() => {
    const selection = window.getSelection()
    const activeEl = document.activeElement
    let text = ''
    if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
      text = getSelectedText(activeEl)
    } else {
      text = selection?.toString() ?? ''
    }
    if (text.trim()) {
      copyToInternal(text)
      wipeOsClipboard()
    }
    setMenu((prev) => ({ ...prev, open: false }))
  }, [copyToInternal, getSelectedText, wipeOsClipboard])

  const handleCloseMenu = useCallback(() => {
    setMenu((prev) => ({ ...prev, open: false }))
  }, [])

  useEffect(() => {
    if (!menu.open) return
    const close = () => handleCloseMenu()
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [handleCloseMenu, menu.open])

  useEffect(() => {
    if (!enabled) return
    const handleNativeCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-allow-native-copy="true"]')) return
      const root = rootRef.current
      if (!root || !target) return
      const el = target instanceof HTMLElement ? target : (target as Node as HTMLElement)
      if (!root.contains(el)) return
      const selectedText = getSelectedText(target)
      if (!selectedText.trim()) return
      e.preventDefault()
      e.stopImmediatePropagation()
      try {
        e.clipboardData?.setData('text/plain', '')
        e.clipboardData?.setData('text/html', '')
      } catch { /* read-only */ }
      copyToInternal(selectedText)
      wipeOsClipboard()
    }
    document.addEventListener('copy', handleNativeCopy, true)
    document.addEventListener('cut', handleNativeCopy, true)
    return () => {
      document.removeEventListener('copy', handleNativeCopy, true)
      document.removeEventListener('cut', handleNativeCopy, true)
      if (restoreTimerRef.current) window.clearTimeout(restoreTimerRef.current)
    }
  }, [copyToInternal, enabled, getSelectedText, wipeOsClipboard])

  if (!enabled) return <>{children}</>

  return (
    <div
      ref={rootRef}
      className={className}
      onCopy={handleReactCopy}
      onCut={handleReactCopy}
      onContextMenu={handleContextMenu}
      style={{ position: 'relative' }}
    >
      {children}

      {menu.open && (
        <div
          style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 99999, ...menuStyle }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            style={menuHover ? { ...menuButtonStyle, background: '#f8f3f7' } : menuButtonStyle}
            onMouseEnter={() => setMenuHover(true)}
            onMouseLeave={() => setMenuHover(false)}
            onClick={handleCopyFromMenu}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  )
}
