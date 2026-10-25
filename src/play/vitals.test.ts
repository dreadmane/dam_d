// The band's words and the list's line, on the example characters.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import cleric from '../save/examples/cleric-fighter.json'
import fighter from '../save/examples/fighter.json'
import wizard from '../save/examples/wizard.json'
import { newRoster } from '../save/new-roster.ts'
import { classLine } from '../save/store.ts'
import type { CharacterEntity } from '../save/types.ts'
import { bandLine, bandReadout, signed } from './vitals.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity

describe('the band', () => {
  it('says the level, the classes in the order taken, and the lineage where one is chosen', () => {
    const e = entity(cleric)
    expect(bandLine(deriveSheet(rules, e), e, rules)).toBe('Level 7 · Cleric 5 / Fighter 2 · Dwarf')
    const w = entity(wizard)
    expect(bandLine(deriveSheet(rules, w), w, rules)).toBe('Level 5 · Wizard 5 · High Elf')
  })

  it('reads HP as current / max in text, then AC, Initiative and Speed', () => {
    const e = entity(fighter)
    e.hp = { current: 7, temp: 3 }
    const sheet = deriveSheet(rules, e)
    expect(bandReadout(sheet, e)).toEqual([
      [
        { label: 'HP', value: '7 / 12' },
        { label: 'Temp HP', value: '3' },
      ],
      [
        { label: 'AC', value: '17' },
        { label: 'Initiative', value: '+3', roll: sheet.initiative },
        { label: 'Speed', value: '30 ft' },
      ],
    ])
  })

  // Spec §3.2, Ability checks: Initiative is a Dexterity check, on the band.
  // The band's Initiative is a roll, with what counts toward it.
  it('rolls Initiative from the band, with what bears on a Dexterity check', () => {
    const e = entity(fighter)
    const sheet = deriveSheet(rules, e)
    const item = bandReadout(sheet, e)[1].find((i) => i.label === 'Initiative')!
    expect(item.roll).toBe(sheet.initiative)
    const roll = (conditionId: string) => {
      const c = { ...e, conditions: [{ id: 'c', conditionId }] }
      return bandReadout(deriveSheet(rules, c), c)[1].find((i) => i.label === 'Initiative')!.roll!
    }
    // Poisoned: Disadvantage on ability checks, counted (SRD p.186).
    expect(roll('poisoned').disadvantage.map((n) => n.from)).toContain('Poisoned')
    // Invisible: Advantage "if you're Invisible when you roll Initiative"
    // (SRD p.184), listed for the table.
    expect(roll('invisible').notes.map((n) => n.from)).toContain('Invisible')
  })

  it('says a character with no class yet', () => {
    const e = newRoster({ name: 'New' }).entities[0]
    expect(bandLine(deriveSheet(rules, e), e, rules)).toBe('No class yet')
  })

  it('writes a minus as a minus sign', () => {
    expect(signed(-1)).toBe('−1')
    expect(signed(0)).toBe('+0')
  })
})

describe('the list’s line', () => {
  it('names the classes in the order taken and the species, from the saved ids alone', () => {
    expect(classLine(entity(cleric))).toBe('Level 7 · Cleric 5 / Fighter 2 · Dwarf')
    expect(classLine(entity(fighter))).toBe('Level 1 · Fighter 1 · Human')
    expect(classLine(newRoster({ name: '' }).entities[0])).toBeUndefined()
  })
})
