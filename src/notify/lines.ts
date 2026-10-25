// The plain words for routine notifications: a label, the kicker, and short
// lines saying what happened. The few that speak in the Handbook's register
// (the spec §6.1), a character imported and a level gained, take their lines
// from voice.ts; their kickers stay plain.

export const KICKER = {
  added: 'Added',
  deleted: 'Deleted',
  imported: 'Imported',
  copied: 'Copied',
  restored: 'Restored',
} as const

// Something arriving in the Inventory.
export function addedLines(name: string, quantity: number): string[] {
  const called = name.trim() || 'An unnamed item'
  return [quantity > 1 ? `${called} × ${quantity}.` : `${called}.`]
}
