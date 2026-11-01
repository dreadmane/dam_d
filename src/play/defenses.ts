// Defenses and senses (dam_d#76, the defenses concept's direction C): what
// the sheet works out and the table needs to see, one row each, for
// Conditions and effects. Senses, then speeds other than walking, then
// damage defenses, then condition immunities; each with what granted it,
// that feature where there is one (its card opens from the row), and a
// printed condition the app can't decide.

import { featureLabel, type GainedFeature } from '../rules/effects.ts'
import type { Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'

export interface DefenseRow {
  key: string
  kind: string
  what: string
  from: string
  when?: string
  feature?: GainedFeature
}

const titled = (id: string) => id.charAt(0).toUpperCase() + id.slice(1)
const listed = (names: string[]) => names.join(', ')
const KIND: Record<string, string> = { resistance: 'Resistance', immunity: 'Immunity', vulnerability: 'Vulnerability' }

// A sense from more than one grant names each with its feet, as a total's
// working does ("Orc: Darkvision 120 ft, Barbarian 6: Owl +60 ft"), and
// opens the card of what extended it last, whose text says how it adds
// (dam_d#82).
const senseFrom = (parts: Sheet['senses'][number]['parts']) =>
  parts.length > 1 ? parts.map((p, i) => `${p.from} ${i ? '+' : ''}${p.feet} ft`).join(', ') : (parts[0]?.from ?? '')

export function defenseRows(rules: Rules, sheet: Sheet): DefenseRow[] {
  const byLabel = new Map(sheet.features.map((g) => [featureLabel(g), g]))
  const row = (key: string, kind: string, what: string, from: string, when?: string, card = from): DefenseRow => ({ key, kind, what, from, ...(when ? { when } : {}), ...(byLabel.has(card) ? { feature: byLabel.get(card) } : {}) })
  return [
    ...sheet.senses.map((s) => row(`sense:${s.sense}`, 'Sense', `${titled(s.sense)} ${s.feet} ft`, senseFrom(s.parts), undefined, s.parts.at(-1)?.from)),
    ...sheet.speed.other.map((s, i) => row(`speed:${s.mode}:${i}`, 'Speed', `${titled(s.mode)} ${s.feet} ft`, s.from)),
    ...sheet.defenses.map((d, i) => row(`defense:${i}`, KIND[d.defense] ?? titled(d.defense), d.damageTypes.includes('all') ? 'All damage' : listed(d.damageTypes.map(titled)), d.from, d.when)),
    ...sheet.conditionImmunities.map((c, i) => row(`condition:${i}`, 'Condition immunity', listed(c.conditions.map((id) => rules.conditions.get(id)?.name ?? titled(id))), c.from, c.when)),
  ]
}
