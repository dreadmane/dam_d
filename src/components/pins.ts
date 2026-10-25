import type { Pins } from '../play/sheet-layout.ts'
import { deviceStore, useDeviceStore } from './device-store.ts'

// The menus the player has pinned to the sheet, or sent back to the Character
// Menu (user, 2026-10-13): a preference of this device (device-store.ts).

// The stored choices, read leniently: anything but sections named with true
// or false is no choice.
export function parsePins(raw: string | null): Pins {
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}')
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, pinned]) => typeof pinned === 'boolean'))
  } catch {
    return {}
  }
}

// A section pinned or sent back. The choice is kept unless it puts the section
// where the character on screen has it anyway, so pinning and unpinning again
// leaves every character as it was.
export function withPin(pins: Pins, id: string, pinned: boolean, byDefault: boolean): Pins {
  const next = { ...pins }
  delete next[id]
  if (pinned !== byDefault) next[id] = pinned
  return next
}

const store = deviceStore('d-amp-d:pinned-sections', parsePins)

export function setPinned(id: string, pinned: boolean, byDefault: boolean) {
  store.set(withPin(store.get(), id, pinned, byDefault))
}

export const usePins = (): Pins => useDeviceStore(store)
