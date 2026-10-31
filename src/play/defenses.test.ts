// Defenses and senses (defenses.ts, dam_d#76): the rows Conditions and
// effects lists, on the repo's own examples.

import { describe, expect, it } from 'vitest'
import { defenseRows } from './defenses.ts'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import type { CharacterEntity } from '../save/types.ts'
import unga from '../save/examples/barbarian.json'
import halvard from '../save/examples/cleric-fighter.json'
import maren from '../save/examples/fighter.json'

const rules = testRules()
const rowsOf = (record: { entities: unknown[] }, change: (e: CharacterEntity) => void = () => {}) => {
  const e = structuredClone(record.entities[0]) as unknown as CharacterEntity
  change(e)
  return defenseRows(rules, deriveSheet(rules, e)).map(({ feature, key: _key, ...r }) => ({ ...r, card: feature?.feature.name }))
}

describe('defenseRows', () => {
  it('lists a raging Berserker 6’s sense, Resistances and condition immunity, in that order, each from its feature (SRD pp.84, 28, 30)', () => {
    const rows = rowsOf(unga, (e) => {
      const c = e.classes[0]
      c.hp = Array.from({ length: 6 }, (_, i) => c.hp[i] ?? { level: i + 1, method: 'fixed' })
      c.level = 6
      e.toggles = { ...e.toggles, rage: true }
    })
    expect(rows).toEqual([
      { kind: 'Sense', what: 'Darkvision 120 ft', from: 'Orc: Darkvision', card: 'Darkvision' },
      { kind: 'Resistance', what: 'Bludgeoning, Piercing, Slashing', from: 'Barbarian 1: Rage', card: 'Rage' },
      { kind: 'Condition immunity', what: 'Charmed, Frightened', from: 'Path of the Berserker 6: Mindless Rage', when: 'While your Rage is active', card: 'Mindless Rage' },
    ])
  })

  it('lists Rage’s Resistance only while Rage is on', () => {
    expect(rowsOf(unga).map((r) => r.kind)).toEqual(['Sense'])
  })

  it('lists a Dwarf’s Poison Resistance and Darkvision (SRD p.85)', () => {
    expect(rowsOf(halvard)).toEqual([
      { kind: 'Sense', what: 'Darkvision 120 ft', from: 'Dwarf: Darkvision', card: 'Darkvision' },
      { kind: 'Resistance', what: 'Poison', from: 'Dwarf: Dwarven Resilience', card: 'Dwarven Resilience' },
    ])
  })

  it('lists nothing for a character with none: no block', () => {
    expect(rowsOf(maren)).toEqual([])
  })
})
