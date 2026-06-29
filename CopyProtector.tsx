'use client'

import React from 'react'

export interface CopyProtectorProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  /**
   * Called when a copy attempt is blocked.
   * Defaults to console.warn.
   */
  onWarning?: (message: string) => void
}

export default function CopyProtector({
  children,
  className,
  enabled = true,
  onWarning = (msg) => console.warn(msg),
}: CopyProtectorProps) {
  const preventCopy = (e: React.ClipboardEvent) => {
    e.preventDefault()
    onWarning('Copying is disabled on this section!')
  }

  if (!enabled) return <>{children}</>

  return (
    <div
      onCopy={preventCopy}
      onContextMenu={(e) => e.preventDefault()}
      className={className}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {children}
    </div>
  )
}
