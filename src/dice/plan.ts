// The tumble, planned when a roll shows (the dice roll, approved by the user
// 2026-10-14): when each die starts and the faces it flickers through on the
// way. Nothing here is a roll. The faces were decided by the crypto-backed
// rollDie before the tray was told, and the decoys come from a small seeded
// generator that decides nothing, is never stored, and never shows the final
// face before the die lands.

// Each die tumbles for TUMBLE_MS, then settles for SETTLE_MS; the first starts
// FIRST_MS after the tap, each next one STAGGER_MS later. The number itself is
// printed at the tap (law 6): only the die's face waits for the landing.
export const TUMBLE_MS = 400
export const SETTLE_MS = 80
export const FIRST_MS = 40
export const STAGGER_MS = 25
// Decoy faces per die, each shown for TUMBLE_MS / DECOYS.
export const DECOYS = 5

export const delayOf = (index: number) => FIRST_MS + STAGGER_MS * index

// When the last of a roll's dice is at rest, from the tap.
export const landsAfter = (count: number) => delayOf(Math.max(0, count - 1)) + TUMBLE_MS + SETTLE_MS

// mulberry32: small, fast and repeatable, which is all a decoy needs.
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Faces for the tumble, none of them the final one.
export function decoysFor(sides: number, face: number, random: () => number): number[] {
  if (sides < 2) return []
  return Array.from({ length: DECOYS }, () => {
    const other = 1 + Math.floor(random() * (sides - 1))
    return other >= face ? other + 1 : other
  })
}
