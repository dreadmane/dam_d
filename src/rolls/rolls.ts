import type { DescribedRoll } from '../dice/describe.ts'

// The rolls a character has made in play (the dice roll's log, approved by
// the user 2026-10-14): what was rolled and what for, kept on this device so
// a result can be checked if it ever comes into question. The words are the
// window's own, as the tray showed them; the dice are kept too, so a roll
// that keeps the higher of two needs no new shape. Kept beside the
// notifications, never in the roster store and never exported, so a
// character's file stays the character's. Pure: store.ts holds them.

export interface RollDie {
  sides: number
  face: number
  // Under Advantage or Disadvantage, the d20 that counts and the one that
  // does not.
  kept?: true
  dropped?: true
  // Typed from the table rather than rolled here.
  typed?: true
}

export interface Roll {
  id: string
  characterId: string
  // When it was rolled, ISO 8601.
  at: string
  // What was rolled, in sentence case: "Free roll".
  name: string
  formula: string
  // The window's own words, a line each: "Rolled 14: 29.".
  lines: string[]
  dice: RollDie[]
}

export interface RollInput {
  name: string
  formula: string
  lines: string[]
  dice: RollDie[]
}

// How many each character keeps on this device: the last hundred (the dice
// roll's call 21). No Clear: the cap is the eraser.
export const KEEP_ROLLS = 100

// A roll as the tray describes it, ready for the log: its dice without the
// tray's light and words, each marked typed where it came from the table.
export function logged(roll: DescribedRoll, typed = false): RollInput {
  return {
    name: roll.name,
    formula: roll.formula,
    lines: [roll.line],
    dice: roll.dice.map((d) => ({
      sides: d.sides,
      face: d.face,
      ...(d.kept ? { kept: true as const } : {}),
      ...(d.dropped ? { dropped: true as const } : {}),
      ...(typed ? { typed: true as const } : {}),
    })),
  }
}

// Typed from the table as a whole: TYPED after the name.
export const isTyped = (roll: Roll): boolean => roll.dice.length > 0 && roll.dice.every((d) => d.typed)

const isString = (v: unknown): v is string => typeof v === 'string'
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1

function parseDie(v: unknown): RollDie | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (!isCount(o.sides) || !isCount(o.face)) return null
  return {
    sides: o.sides,
    face: o.face,
    ...(o.kept === true ? { kept: true as const } : {}),
    ...(o.dropped === true ? { dropped: true as const } : {}),
    ...(o.typed === true ? { typed: true as const } : {}),
  }
}

// One stored entry, or null when it cannot be read: a roll with no id,
// character, name, time, lines or dice is dropped. A field this version does
// not read (Crawler Interface's floor) is ignored.
function parseRoll(v: unknown): Roll | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (!isString(o.id) || !isString(o.characterId) || !isString(o.name) || !isString(o.formula)) return null
  if (!isString(o.at) || Number.isNaN(Date.parse(o.at))) return null
  if (!Array.isArray(o.lines) || !o.lines.every(isString)) return null
  if (!Array.isArray(o.dice) || o.dice.length === 0) return null
  const dice = o.dice.map(parseDie)
  if (dice.some((d) => d === null)) return null
  return {
    id: o.id,
    characterId: o.characterId,
    at: o.at,
    name: o.name,
    formula: o.formula,
    lines: o.lines,
    dice: dice as RollDie[],
  }
}

// The stored list, newest first, read field by field: anything unreadable is
// the same as nothing, so a damaged value never stops the app.
export function parseRolls(raw: string | null): Roll[] {
  let value: unknown
  try {
    value = raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
  if (!Array.isArray(value)) return []
  const kept = value.map(parseRoll).filter((r): r is Roll => r !== null)
  kept.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return capped(kept)
}

// Each character's newest KEEP_ROLLS, in the list's order.
export function capped(list: Roll[], keep = KEEP_ROLLS): Roll[] {
  const counts = new Map<string, number>()
  return list.filter((r) => {
    const count = (counts.get(r.characterId) ?? 0) + 1
    counts.set(r.characterId, count)
    return count <= keep
  })
}

// A new roll on top; the character's oldest goes past KEEP_ROLLS.
export const withRoll = (list: Roll[], roll: Roll, keep = KEEP_ROLLS): Roll[] => capped([roll, ...list], keep)

// One character's rolls, newest first.
export const ofOwner = (list: Roll[], owner: string): Roll[] => list.filter((r) => r.characterId === owner)

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// One character's rolls today, on the device's clock: what the menu counts and
// Copy today's rolls copies.
export const todays = (list: Roll[], owner: string, now: Date): Roll[] => ofOwner(list, owner).filter((r) => sameDay(new Date(r.at), now))
