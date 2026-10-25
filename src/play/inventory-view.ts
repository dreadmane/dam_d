// How this device sorts the inventory (Crawler Interface's §3.2; kept on the
// device, user 2026-09-28). A preference of the device, like settings.ts, so
// localStorage rather than the roster store, and never in an export. Every
// read and write is guarded; the default always works.

import { DEFAULT_VIEW, SORTS, type InventoryView } from './inventory.ts'

const KEY = 'd-amp-d:inventory-view'

// A sort this version does not offer (Crawler Interface's Type or Value,
// stored on the same device) reads as the default.
export function parseInventoryView(raw: string | null): InventoryView {
  let value: Partial<InventoryView> = {}
  try {
    value = raw ? (JSON.parse(raw) as Partial<InventoryView>) : {}
  } catch {
    // A damaged value is the same as none.
  }
  return { sort: SORTS.some((s) => s.key === value?.sort) ? value.sort! : DEFAULT_VIEW.sort }
}

export function loadInventoryView(): InventoryView {
  try {
    return parseInventoryView(localStorage.getItem(KEY))
  } catch {
    return DEFAULT_VIEW
  }
}

export function saveInventoryView(view: InventoryView): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(view))
  } catch {
    // Unsaved, but still applied for this visit.
  }
}
