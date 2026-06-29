'use client'

import React from 'react'

export interface NoDragDropBoundaryProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
}

export default function NoDragDropBoundary({
  children,
  className,
  enabled = true,
}: NoDragDropBoundaryProps) {
  if (!enabled) return <>{children}</>

  const preventDrag = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-allow-drag="true"]')) return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      className={className}
      draggable={false}
      onDragStart={preventDrag}
      onDrag={preventDrag}
      onDragEnd={preventDrag}
      onDrop={preventDrag}
      onDragOver={preventDrag}
      style={{
        width: '100%',
        height: '100%',
        WebkitUserDrag: 'none',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
