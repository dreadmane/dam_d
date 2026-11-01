// Defenses and senses (defenses.ts, dam_d#76): the rows Conditions and
// effects lists, on the repo's own examples.

import { describe, expect, it } from 'vitest'
import { defenseRows } from './defenses.ts'
import { deriveSheet } from '../rules/derive.ts'
import { indexRules } from '../rules/load.ts'
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

describe('a sense two grants make (dam_d#82)', () => {
  // An invented subclass whose option extends Darkvision, as the books' Owl
  // (Aspect of the Wilds) does: the books never enter this repo.
  const source = { ref: 'srd-5.2.1', section: 'Test', page: 1 }
  const path = {
    id: 'test-path',
    classId: 'barbarian',
    name: 'Test Path',
    features: [{ id: 'test-aspect', name: 'Test Aspect', level: 3, text: 'Invented for a test.', effects: [{ type: 'choice', id: 'test-aspect', label: 'Aspect', count: 1, kind: 'option', options: ['test-owl'] }], source, confidence: 'printed' }],
    optionLists: [{ id: 'test-aspect', name: 'Test Aspect', options: [{ id: 'test-owl', name: 'Owl', text: 'Invented.', effects: [{ type: 'sense', sense: 'darkvision', feet: 60, extends: true }], source, confidence: 'printed' }] }],
    source,
    confidence: 'printed',
  }
  const data = structuredClone(rules.data)
  ;(data.classes as unknown as { subclasses?: unknown[] }).subclasses = [path]
  const withPath = indexRules(data)
  const owlRows = (change: (e: CharacterEntity) => void = () => {}) => {
    const e = structuredClone(unga.entities[0]) as unknown as CharacterEntity
    e.classes = [{ ...e.classes[0], subclassId: 'test-path' }]
    e.choices.push({ source: 'class:barbarian:3', choice: 'test-aspect', values: ['test-owl'] })
    change(e)
    return defenseRows(withPath, deriveSheet(withPath, e)).map(({ feature, key: _key, ...r }) => ({ ...r, card: feature?.feature.name }))
  }

  it('names both an Orc’s Darkvision and the Owl’s 60 feet added to it, and opens the Owl’s card', () => {
    expect(owlRows()).toEqual([{ kind: 'Sense', what: 'Darkvision 180 ft', from: 'Orc: Darkvision 120 ft, Barbarian 3: Owl +60 ft', card: 'Owl' }])
  })

  it('adds the Owl’s 60 feet to a longer Darkvision that comes after it, from an item', () => {
    const rows = owlRows((e) => e.inventory.push({ id: 'goggles', name: 'Test Goggles', description: '', quantity: 1, tags: [], worn: true, effects: [{ type: 'sense', sense: 'darkvision', feet: 150 }] }))
    expect(rows).toEqual([{ kind: 'Sense', what: 'Darkvision 210 ft', from: 'Test Goggles 150 ft, Barbarian 3: Owl +60 ft', card: 'Owl' }])
  })
})
