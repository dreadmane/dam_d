import { useSyncExternalStore } from 'react'

// A preference of this device kept in localStorage under one key, beside the
// settings and never in a character's file, so it holds for every character: the
// pinned menus and the sheet's order (user, 2026-10-13). Read once, then kept
// here, so every reader sees the same value until it is set again; another tab
// of the app setting it is caught by the storage event. Storage can refuse
// (settings.ts); then a change holds for this visit only.

export interface DeviceStore<T> {
  get: () => T
  // Null forgets the stored value, so the key reads as nothing stored.
  set: (value: T | null) => void
  subscribe: (listener: () => void) => () => void
}

export function deviceStore<T>(key: string, parse: (raw: string | null) => T): DeviceStore<T> {
  let cached: { value: T } | null = null
  const listeners = new Set<() => void>()

  function get(): T {
    if (cached === null) {
      let raw: string | null = null
      try {
        raw = localStorage.getItem(key)
      } catch {
        // Refused: nothing stored, as far as this visit knows.
      }
      cached = { value: parse(raw) }
    }
    return cached.value
  }

  function set(value: T | null) {
    cached = { value: value ?? parse(null) }
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // This visit only; see above.
    }
    for (const listener of listeners) listener()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    const elsewhere = (e: StorageEvent) => {
      if (e.key !== key) return
      cached = null
      listener()
    }
    window.addEventListener('storage', elsewhere)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', elsewhere)
    }
  }

  return { get, set, subscribe }
}

export function useDeviceStore<T>(store: DeviceStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
