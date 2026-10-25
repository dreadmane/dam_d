// The band's vitals (the spec §3.3): the class line under the name, then HP,
// AC, Initiative and Speed, read from the derived sheet. Plain functions, so
// the words are tested apart from the band.

import type { Rules } from '../rules/load.ts'
import { classSummary, type Part, type Sheet, type Total } from '../rules/derive.ts'
import { unresolved } from '../rules/unresolved.ts'
import type { CharacterEntity } from '../save/record.ts'

// A modifier as the sheet writes it: +3, +0, −1 (a true minus sign).
export const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`)

// "Level 7 · Cleric 5 / Fighter 2 · Dwarf", the lineage where one is chosen
// ("Wood Elf"). A character with no class yet says so.
export function bandLine(sheet: Sheet, entity: CharacterEntity, rules: Rules): string {
  const parts: string[] = []
  parts.push(sheet.level ? `Level ${sheet.level}` : 'No class yet')
  if (sheet.level) parts.push(classSummary(sheet))
  const species = entity.species && rules.species.get(entity.species.speciesId)
  if (species) {
    const lineageId = sheet.choices.find((c) => c.grants === 'lineage')?.made?.values[0]
    const lineage = species.lineages?.options.find((o) => o.id === lineageId)
    parts.push(lineage?.name ?? species.name)
  } else if (entity.species) {
    parts.push(unresolved(entity.species.speciesId))
  }
  return parts.join(' · ')
}

export interface ReadoutItem {
  label: string
  value: string
  // A figure the band rolls: Initiative, a Dexterity check (spec §3.2).
  roll?: Total
}

// Two lines: HP (with temporary HP when there are any), then AC, Initiative
// and Speed. HP reads without colour, always "44 / 52" (§6.3). Initiative
// carries its total, with its Advantage and Disadvantage, to roll.
export function bandReadout(sheet: Sheet, entity: CharacterEntity): ReadoutItem[][] {
  const hp: ReadoutItem[] = [{ label: 'HP', value: `${entity.hp.current} / ${sheet.hp.max}` }]
  if (entity.hp.temp > 0) hp.push({ label: 'Temp HP', value: String(entity.hp.temp) })
  return [
    hp,
    [
      { label: 'AC', value: String(sheet.ac.total) },
      { label: 'Initiative', value: signed(sheet.initiative.total), roll: sheet.initiative },
      { label: 'Speed', value: `${sheet.speed.walk.total} ft` },
    ],
  ]
}

// A total's working, one line per part ("STR modifier +3"), for the card
// that says why a number is what it is (§5.2: explains why).
export const working = (parts: readonly Part[]) => parts.map((p) => `${p.label} ${signed(p.value)}`)

// What bears on a roll without being added in: Advantage, Disadvantage, and
// the conditional bonuses, each with what grants it (derive.ts writes their
// conditions to read mid-line).
export function rollNotes(t: Total): string[] {
  return [
    ...t.advantage.map((n) => `Advantage${n.text ? ` ${n.text}` : ''} (${n.from})`),
    ...t.disadvantage.map((n) => `Disadvantage${n.text ? ` ${n.text}` : ''} (${n.from})`),
    ...t.notes.map((n) => `${n.text} (${n.from})`),
  ]
}

// Whether the band offers Level up (the spec §3.2, C2): with milestone
// levelling, always below 20; with XP, once the XP reaches the next level's
// threshold in the Character Advancement table (core.json, SRD p.23).
export function levelReady(rules: Rules, entity: CharacterEntity, level: number): boolean {
  if (level >= 20) return false
  if (entity.levelling.mode === 'milestone') return true
  const next = rules.data.core.advancement.find((a) => a.level === level + 1)
  return next !== undefined && entity.levelling.xp >= next.xp
}
