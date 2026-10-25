import { deviceStore, useDeviceStore } from './device-store.ts'

// The sheet's order as the player arranged it (user, 2026-10-13): a preference
// of this device, as the pins are (device-store.ts), the whole order of every
// section, those off the sheet included (play/sheet-layout.ts, fullOrder).
// Nothing stored is the sheet's own order.

// The stored order, read leniently: anything but a list of names is nothing
// stored, and each name counts once.
export function parseOrder(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]')
    return Array.isArray(parsed) ? [...new Set(parsed.filter((x): x is string => typeof x === 'string'))] : []
  } catch {
    return []
  }
}

const store = deviceStore('d-amp-d:sheet-order', parseOrder)

export const setOrder = (order: readonly string[]) => store.set([...order])

// Put back the original order: the pins are left as they are.
export const resetOrder = () => store.set(null)

export const useOrder = (): readonly string[] => useDeviceStore(store)
