// An ability's card (cards.ts, opened from Abilities and saves): what bears
// on its check and its save without being added in, each said with the
// roll it is for (dam_d#8).

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import fighter from '../save/examples/fighter.json'
import wizard from '../save/examples/wizard.json'
import type { CharacterEntity } from '../save/types.ts'
import { abilityWorking } from './cards.ts'

const rules = testRules()
const notesOf = (record: { entities: unknown[] }, ability: 'str' | 'wis', change: (e: CharacterEntity) => void = () => {}) => {
  const e = structuredClone(record.entities[0]) as unknown as CharacterEntity
  change(e)
  return abilityWorking(deriveSheet(rules, e), rules, ability).notes
}

describe('an ability’s card', () => {
  it('names Powerful Build’s Advantage on the check (SRD p.86)', () => {
    expect(notesOf(fighter, 'str', (e) => (e.species = { ...e.species, speciesId: 'goliath' }))).toContain('Strength check: Advantage to end the Grappled condition (Goliath: Powerful Build)')
  })

  it('names Fey Ancestry’s Advantage on the save (SRD p.85)', () => {
    expect(notesOf(wizard, 'wis')).toContain('Wisdom saving throw: Advantage to avoid or end the Charmed condition (Elf: Fey Ancestry)')
  })

  it('has no notes where nothing bears on either roll', () => {
    expect(notesOf(fighter, 'str')).toEqual([])
  })
})
