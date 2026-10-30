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

export function defenseRows(rules: Rules, sheet: Sheet): DefenseRow[] {
  const byLabel = new Map(sheet.features.map((g) => [featureLabel(g), g]))
  const row = (key: string, kind: string, what: string, from: string, when?: string): DefenseRow => ({ key, kind, what, from, ...(when ? { when } : {}), ...(byLabel.has(from) ? { feature: byLabel.get(from) } : {}) })
  return [
    ...sheet.senses.map((s) => row(`sense:${s.sense}`, 'Sense', `${titled(s.sense)} ${s.feet} ft`, s.from)),
    ...sheet.speed.other.map((s, i) => row(`speed:${s.mode}:${i}`, 'Speed', `${titled(s.mode)} ${s.feet} ft`, s.from)),
    ...sheet.defenses.map((d, i) => row(`defense:${i}`, KIND[d.defense] ?? titled(d.defense), d.damageTypes.includes('all') ? 'All damage' : listed(d.damageTypes.map(titled)), d.from, d.when)),
    ...sheet.conditionImmunities.map((c, i) => row(`condition:${i}`, 'Condition immunity', listed(c.conditions.map((id) => rules.conditions.get(id)?.name ?? titled(id))), c.from, c.when)),
  ]
}
