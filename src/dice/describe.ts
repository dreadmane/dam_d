import { isSides, type Sides } from './shapes.ts'

// A roll as the tray shows it (the dice roll, approved by the user
// 2026-10-14): what was rolled, its formula, every die with its face, and the
// window's own words for the result, so no roll site builds faces or words by
// hand. The faces come from the rolls the app already makes (roll.ts);
// nothing here rolls.
//
// The marks on a die are the d20 kept under Advantage or Disadvantage, and a
// natural 20 or a natural 1 on the d20 that counts (user, 2026-10-23, the
// dice total concept; until then a 20 alone was marked, and only caught a
// little more light). A die dropped under Advantage or Disadvantage is never
// a natural. The tray says what the die shows, and adds the rules' own result
// only where the SRD 5.2.1 prints one, an attack roll's and a death saving
// throw's (naturalWords). It never says a check or a save succeeded: the
// table calls the result.

// A formula with its rolled part kept as notation, so a check reads
// "d20 + 5". Whether the app rolls it, or the player does, is decided where
// the formula is used, not here.
export interface Evaluated {
  flat: number
  dice: string[]
}

// "d20 + 2", "d20 − 1", "20". Uses a true minus sign.
export function formatEvaluated({ flat, dice }: Evaluated): string {
  if (!dice.length) return String(flat).replace('-', '−')
  const rolled = dice.join(' + ')
  if (flat === 0) return rolled
  return `${rolled} ${flat < 0 ? '−' : '+'} ${Math.abs(flat)}`
}

export type Natural = 20 | 1
export const isNatural = (face: number | undefined): face is Natural => face === 20 || face === 1

export interface TrayDie {
  sides: Sides
  face: number
  // Advantage or Disadvantage: the d20 that counts, and the one that does not.
  kept?: boolean
  dropped?: boolean
  // The face of the d20 that counts, where it shows a 20 or a 1.
  natural?: Natural
  // A word under the die: kept.
  word?: string
}

export interface DescribedRoll {
  // What was rolled, in sentence case; the tray sets it in capitals.
  name: string
  formula: string
  dice: TrayDie[]
  // The window's own words for the result.
  line: string
  // The part of the line set in bold: the total.
  bold: string | null
  // A natural 20 or 1 on the d20 that counts, and the tray's words for it;
  // or, on an attack roll, a lower face in the crit range (Improved
  // Critical's 19), with its words.
  natural?: { face: number; words: string }
}

// What a d20 is rolled for, which picks the words for a natural: the two
// rolls the rules act on at a 20 or a 1, and every other d20.
export type RollKind = 'attack' | 'death-save' | 'other'

// The words for a natural (user, 2026-10-23), factual only:
// - an attack roll: SRD 5.2.1, Attack Rolls, "Rolling 20 or 1" (p.7): a 20
//   hits whatever the AC and is a Critical Hit; a 1 misses whatever the AC;
// - a death saving throw: Death Saving Throws, "Rolling a 1 or 20" (p.17): a
//   20 regains 1 Hit Point, a 1 counts as two failures (core.json's
//   playRules.deathSaves holds both numbers; describe.test.ts holds the words
//   to them);
// - any other d20 says what it shows: on a check or a save a 20 or a 1 is a
//   house rule, so nothing is said of the result.
export function naturalWords(kind: RollKind, face: Natural): string {
  if (kind === 'attack') return face === 20 ? 'Natural 20 · Critical Hit' : 'Natural 1 · the attack misses'
  if (kind === 'death-save') return face === 20 ? 'Natural 20 · you regain 1 Hit Point' : 'Natural 1 · two failures'
  return `Natural ${face}`
}

// The roll with its d20 that counts, the die at `at`, marked where it shows a
// 20 or a 1, and the words for it. A dropped die is never marked. On an
// attack roll, a face from critMin up is a Critical Hit too (the sheet's
// crit range: Improved Critical, SRD p.49), said in words with no mark, as
// the die shows no 20.
function withNatural(roll: DescribedRoll, at: number, kind: RollKind, critMin = 20): DescribedRoll {
  const die = roll.dice[at]
  const face = die?.face
  if (!die || die.dropped || die.sides !== 20) return roll
  if (face === 20 || face === 1) return { ...roll, dice: roll.dice.map((d, i) => (i === at ? { ...d, natural: face } : d)), natural: { face, words: naturalWords(kind, face) } }
  if (kind === 'attack' && face >= critMin) return { ...roll, natural: { face, words: `Natural ${face} · Critical Hit` } }
  return roll
}

export type Mode = 'normal' | 'advantage' | 'disadvantage'

export interface CheckRoll {
  faces: number[]
  kept: number
  total: number
}

export interface PoolRoll {
  faces: number[]
  total: number
}

// "d20", "1d20" or "2d8": the die's sides, or null for one the tray cannot draw.
export function sidesOf(notation: string): Sides | null {
  const m = /^(\d*)d(\d+)$/.exec(notation.trim())
  const sides = m ? Number(m[2]) : NaN
  return isSides(sides) ? sides : null
}

// The window's words for a check's d20.
export function checkLine(r: CheckRoll): string {
  return r.faces.length > 1 ? `Rolled ${r.faces.join(' and ')}, kept ${r.kept}: ${r.total}.` : `Rolled ${r.kept}: ${r.total}.`
}

// "d20 + 15", or "2 × d20 + 15, Advantage".
export function checkFormula(check: Evaluated, mode: Mode): string {
  const formula = formatEvaluated(check)
  if (mode === 'normal') return formula
  return `2 × ${formula}, ${mode === 'advantage' ? 'Advantage' : 'Disadvantage'}`
}

// kind: what the d20 is rolled for, which words a natural on it takes;
// critMin: an attack's crit range, where it starts below 20.
export function describeCheck(name: string, check: Evaluated, mode: Mode, r: CheckRoll, kind: RollKind = 'other', critMin = 20): DescribedRoll {
  const sides = sidesOf(check.dice[0] ?? 'd20') ?? 20
  // With two equal faces the first is kept.
  const counts = r.faces.length > 1 ? r.faces.indexOf(r.kept) : 0
  const pair = r.faces.length > 1
  const dice = r.faces.map(
    (face, i): TrayDie => ({
      sides,
      face,
      ...(pair && i === counts ? { kept: true, word: 'kept' } : {}),
      ...(pair && i !== counts ? { dropped: true } : {}),
    }),
  )
  return withNatural({ name, formula: checkFormula(check, mode), dice, line: checkLine(r), bold: String(r.total) }, counts, kind, critMin)
}

// Every die of a formula in order, "2d8" as two d8s, each with its face: the
// order rollDamage rolls them in.
export function poolDice(notations: string[], faces: number[]): TrayDie[] {
  const dice: TrayDie[] = []
  let next = 0
  for (const notation of notations) {
    const m = /^(\d*)d(\d+)$/.exec(notation.trim())
    const count = m ? Number(m[1] || 1) : 0
    const sides = sidesOf(notation)
    for (let i = 0; i < count; i++) {
      const face = faces[next++]
      if (sides !== null && face !== undefined) dice.push({ sides, face })
    }
  }
  return dice
}

// The window's words for rolled damage: "Rolled 2, 1, 2, 1: 11 Bludgeoning."
export function poolLine(faces: number[], total: string): string {
  return `Rolled ${faces.join(', ')}: ${total}.`
}

// A pool of dice added up: damage, a debuff's damage, a table's dice.
export function describePool(name: string, formula: string, notations: string[], r: PoolRoll, total = String(r.total)): DescribedRoll {
  return { name, formula, dice: poolDice(notations, r.faces), line: poolLine(r.faces, total), bold: total }
}

// A roll that only fills a field: "Rolled 3." for one die, or the faces and
// their sum, "Rolled 3, 4: 7.", for more. kind: given only for a roll that is
// a d20 rolled alone as a D20 Test, a death saving throw, whose d20 then
// takes a natural; a table's or a field's die never does.
export function describeRoll(name: string, notation: string, r: PoolRoll, kind?: RollKind): DescribedRoll {
  const line = r.faces.length > 1 ? poolLine(r.faces, String(r.total)) : `Rolled ${r.total}.`
  const roll: DescribedRoll = { name, formula: notation, dice: poolDice([notation], r.faces), line, bold: String(r.total) }
  return kind && roll.dice.length === 1 ? withNatural(roll, 0, kind) : roll
}

// Anything else: the dice and the words given.
export function describeDice(name: string, formula: string, dice: TrayDie[], line: string, bold: string | null = null): DescribedRoll {
  return { name, formula, dice, line, bold }
}

// Results typed from the table (the dice roll's log, 2026-10-14). The
// window says them in its own words and shows no dice; the log keeps them,
// marked typed, so they are described the same way.

// The window's words for a d20 typed in: "14 on the d20: 29."
export const typedCheckLine = (face: number, die: string, total: number): string => `${face} on the ${die}: ${total}.`

// The d20 typed is the one that counts, so a 20 or a 1 on it is a natural.
export function describeTypedCheck(name: string, check: Evaluated, mode: Mode, face: number, kind: RollKind = 'other', critMin = 20): DescribedRoll {
  const die = check.dice[0] ?? 'd20'
  const total = face + check.flat
  return withNatural({ name, formula: checkFormula(check, mode), dice: [{ sides: sidesOf(die) ?? 20, face }], line: typedCheckLine(face, die, total), bold: String(total) }, 0, kind, critMin)
}

// The sides of every die of a formula, in order: "2d8" as two 8s.
export function diceSides(notations: string[]): number[] {
  return notations.flatMap((n) => {
    const m = /^(\d*)d(\d+)$/.exec(n.trim())
    return m ? Array.from({ length: Number(m[1] || 1) }, () => Number(m[2])) : []
  })
}

// A formula's dice in short, alike ones counted together: "4d2", "2d8 + 1d6".
export function diceText(notations: string[]): string {
  const counts = new Map<number, number>()
  for (const s of diceSides(notations)) counts.set(s, (counts.get(s) ?? 0) + 1)
  return [...counts].map(([sides, n]) => `${n}d${sides}`).join(' + ')
}

const COUNT = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty']
const counted = (n: number) => COUNT[n] ?? String(n)

// What the typed field asks for when the faces do not fit the dice: "Four
// faces, each 1 to 2." or "Three faces: two 1 to 8, then one 1 to 6."
export function facesWanted(notations: string[]): string {
  const sides = diceSides(notations)
  const runs: { sides: number; n: number }[] = []
  for (const s of sides) {
    const last = runs.at(-1)
    if (last && last.sides === s) last.n++
    else runs.push({ sides: s, n: 1 })
  }
  const faces = `${counted(sides.length)} face${sides.length === 1 ? '' : 's'}`
  if (runs.length === 1) return sides.length === 1 ? `${faces}, 1 to ${runs[0].sides}.` : `${faces}, each 1 to ${runs[0].sides}.`
  return `${faces}: ${runs.map((r) => `${counted(r.n).toLowerCase()} 1 to ${r.sides}`).join(', then ')}.`
}

// The faces typed in, in the formula's order, or null where they are not one
// whole number for each die, each on its die: "2, 1, 2, 1" for 4d2.
export function parseFaces(text: string, notations: string[]): number[] | null {
  const sides = diceSides(notations)
  const parts = text.split(/[\s,]+/).filter(Boolean)
  if (sides.length === 0 || parts.length !== sides.length || !parts.every((p) => /^\d+$/.test(p))) return null
  const faces = parts.map(Number)
  return faces.every((f, i) => f >= 1 && f <= sides[i]) ? faces : null
}

// The window's words for damage typed in: "2, 1, 2, 1 on 4d2: 11 Bludgeoning."
export const typedPoolLine = (faces: number[], notations: string[], total: string): string => `${faces.join(', ')} on ${diceText(notations)}: ${total}.`

export function describeTypedPool(name: string, formula: string, notations: string[], faces: number[], total: string): DescribedRoll {
  return { name, formula, dice: poolDice(notations, faces), line: typedPoolLine(faces, notations, total), bold: total }
}

// The total the tray presses into its seal, beside the dice (the dice total
// concept, user 2026-10-23): the line's bold total split at its first space,
// the numeral and the word after it, "11 Bludgeoning" as 11 and Bludgeoning.
// A roll with no bold has no seal.
export interface SealTotal {
  value: string
  kind: string | null
}

export function sealOf(bold: string | null): SealTotal | null {
  const text = bold?.trim()
  if (!text) return null
  const at = text.indexOf(' ')
  return at < 0 ? { value: text, kind: null } : { value: text.slice(0, at), kind: text.slice(at + 1).trim() || null }
}
