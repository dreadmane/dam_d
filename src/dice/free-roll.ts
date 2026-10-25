import { rollFaces, type Random } from './roll.ts'
import { SIDES, type Sides } from './shapes.ts'

// The free roll (user, 2026-10-14; the design the user shaped, 2026-10-17,
// Crawler Interface's notes/2026-10-17-free-roll): a roll the table calls for
// that nothing on the sheet covers, of any dice the game uses, in any mix, with a modifier. A
// pool is how many of each die and the modifier; its formula is written in
// dice notation, the dice in the keys' order. A tap on a die
// adds one; after a roll the pool stays, so Roll repeats it, and the next
// die tapped starts a new roll with no modifier.

export interface Pool {
  // How many of each die, by its sides; a die not in the roll is absent.
  counts: Partial<Record<Sides, number>>
  modifier: number
}

export const EMPTY_POOL: Pool = { counts: {}, modifier: 0 }

// The most dice one roll holds, and the largest modifier either way: a GM's
// call needs no more, and a cap keeps the tray's dice legible.
export const MOST_DICE = 20
export const MOST_MODIFIER = 99

export const diceIn = (p: Pool): number => SIDES.reduce((n, s) => n + (p.counts[s] ?? 0), 0)

export function addDie(p: Pool, sides: Sides): Pool {
  if (diceIn(p) >= MOST_DICE) return p
  return { ...p, counts: { ...p.counts, [sides]: (p.counts[sides] ?? 0) + 1 } }
}

export function stepModifier(p: Pool, by: 1 | -1): Pool {
  const modifier = Math.max(-MOST_MODIFIER, Math.min(MOST_MODIFIER, p.modifier + by))
  return modifier === p.modifier ? p : { ...p, modifier }
}

// Each die in the pool as the rules write dice, "2d6", in the keys' order.
export const notationsOf = (p: Pool): string[] => SIDES.filter((s) => (p.counts[s] ?? 0) > 0).map((s) => `${p.counts[s]}d${s}`)

// "2d6 + 1d4 + 2", a minus written as one; nothing for an empty pool.
export function formulaOf(p: Pool): string {
  const dice = notationsOf(p).join(' + ')
  if (!dice || p.modifier === 0) return dice
  return `${dice} ${p.modifier < 0 ? '−' : '+'} ${Math.abs(p.modifier)}`
}

// Every die rolled, in the formula's order, and their sum with the modifier.
export function rollPool(p: Pool, random?: Random): { faces: number[]; total: number } {
  const faces = notationsOf(p).flatMap((n) => rollFaces(n, random).faces)
  return { faces, total: faces.reduce((a, b) => a + b, 0) + p.modifier }
}

// The window's pool, and whether it has just been rolled: then the next die
// tapped starts a new roll, while the modifier still changes the one rolled,
// so "that again, plus one" is a tap and Roll.
export interface FreeRoll {
  pool: Pool
  rolled: boolean
}

export const tapDie = (s: FreeRoll, sides: Sides): FreeRoll => ({ pool: addDie(s.rolled ? EMPTY_POOL : s.pool, sides), rolled: false })

export const tapModifier = (s: FreeRoll, by: 1 | -1): FreeRoll => ({ pool: stepModifier(s.pool, by), rolled: false })

// The last pool rolled, as this device keeps it, read leniently: counts of
// the dice the app draws, whole and within the limits, or nothing.
export function parsePool(raw: string | null): Pool {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null')
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_POOL
    const { counts, modifier } = parsed as { counts?: unknown; modifier?: unknown }
    let pool: Pool = { counts: {}, modifier: 0 }
    if (typeof counts === 'object' && counts !== null) {
      for (const s of SIDES) {
        const n = (counts as Record<string, unknown>)[s]
        if (typeof n === 'number' && Number.isInteger(n) && n > 0) for (let i = 0; i < n; i++) pool = addDie(pool, s)
      }
    }
    if (typeof modifier === 'number' && Number.isInteger(modifier)) pool = { ...pool, modifier: Math.max(-MOST_MODIFIER, Math.min(MOST_MODIFIER, modifier)) }
    return pool
  } catch {
    return EMPTY_POOL
  }
}
