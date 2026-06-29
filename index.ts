// Components
export { default as ScreenProtector } from './ScreenProtector'
export { default as RecordingFlicker } from './RecordingFlicker'
export { default as ProtectorCanvas } from './ProtectorCanvas'
export { default as AppClipboardBoundary } from './AppClipboardBoundary'
export { default as InternalCopyAliasBoundary } from './InternalCopyAliasBoundary'
export { default as CopyExtensionProtector } from './CopyExtensionProtector'
export { default as CopyProtector } from './CopyProtector'
export { default as NoDragDropBoundary } from './NoDragDropBoundary'

// Hooks
export { useScreenProtection } from './useScreenProtection'
export { useRefreshRate } from './useRefreshRate'
export { useAppClipboardStore } from './useAppClipboardStore'
export { useSecureCopy } from './useSecureCopy'

// Types
export type { ScreenProtectorProps } from './ScreenProtector'
export type { ScreenProtectionState } from './useScreenProtection'
export type { RecordingFlickerProps, RecordingFlickerMode } from './RecordingFlicker'
export type { ProtectorCanvasProps, ProtectorCanvasVariant } from './ProtectorCanvas'
export type { AppClipboardBoundaryProps } from './AppClipboardBoundary'
export type { InternalCopyAliasBoundaryProps } from './InternalCopyAliasBoundary'
export type { CopyExtensionProtectorProps } from './CopyExtensionProtector'
export type { CopyProtectorProps } from './CopyProtector'
export type { NoDragDropBoundaryProps } from './NoDragDropBoundary'
export type { AppClipboardPayload, AppClipboardSource } from './useAppClipboardStore'
