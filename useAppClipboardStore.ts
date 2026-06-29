'use client'

import { create } from 'zustand'

const STORAGE_KEY = 'rnd_internal_clipboard_v1'
const DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes

export type AppClipboardSource = 'global' | 'nara' | 'table' | 'code'

export type AppClipboardPayload = {
  source: AppClipboardSource
  type: 'text' | 'markdown' | 'html' | 'table' | 'code'
  text: string
  html?: string
  tsv?: string
  // eslint-disable-next-line
  meta?: Record<string, any>
  copiedAt: number
  expiresAt: number
}

type SetClipboardPayload = Omit<AppClipboardPayload, 'copiedAt' | 'expiresAt'> & {
  ttl?: number
}

type AppClipboardStore = {
  payload: AppClipboardPayload | null
  hydrateClipboard: () => void
  setClipboard: (payload: SetClipboardPayload) => void
  clearClipboard: () => void
  isExpired: () => boolean
}

function safeRead(): AppClipboardPayload | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as AppClipboardPayload

    if (!parsed?.text) return null
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function safeWrite(payload: AppClipboardPayload) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

function safeRemove() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export const useAppClipboardStore = create<AppClipboardStore>((set, get) => ({
  payload: null,

  hydrateClipboard: () => {
    const payload = safeRead()
    set({ payload })
  },

  setClipboard: (payload) => {
    const ttl = payload.ttl ?? DEFAULT_TTL

    const nextPayload: AppClipboardPayload = {
      ...payload,
      copiedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    }

    safeWrite(nextPayload)
    set({ payload: nextPayload })
  },

  clearClipboard: () => {
    safeRemove()
    set({ payload: null })
  },

  isExpired: () => {
    const payload = get().payload

    if (!payload) return true

    const expired = Date.now() > payload.expiresAt

    if (expired) {
      safeRemove()
      set({ payload: null })
    }

    return expired
  },
}))