// The extreme fixture (the spec §3.3 and §7.1 item 8): the sheet is designed
// and tested against a level-20 character with three classes, several dozen
// spells, a full inventory and two companions. Oriel Ashcombe, Wizard 12 /
// Cleric 5 / Fighter 3, is built by the m1/finish notes' make-extreme.ts from
// SRD records alone; these tests hold the save and every derived section to
// her.

import { describe, expect, it } from 'vitest'
import { anyLevelUnfinished } from '../play/build.ts'
import { attunement, barSlots, reactions } from '../play/kit.ts'
import { characterSpells, preparedCount, slotLevels } from '../play/spells.ts'
import { deriveSheet } from '../rules/derive.ts'
import { characterChoices, isMade } from '../rules/level.ts'
import { testRules } from '../rules/test-rules.ts'
import extreme from './fixtures/roster-v1-extreme.json'
import schema from './schemas/roster-v1.schema.json'
import type { CharacterEntity } from './types.ts'
import { validate } from './validate.ts'

const rules = testRules()
const oriel = () => structuredClone(extreme.entities[0]) as unknown as CharacterEntity

describe('the extreme fixture', () => {
  it('is a valid save at the current schema', () => {
    expect(validate(schema, extreme)).toEqual([])
  })

  it('is level 20 in three classes, each with its subclass, every choice made', () => {
    const e = oriel()
    const sheet = deriveSheet(rules, e)
    expect(sheet.level).toBe(20)
    expect(sheet.classes.map((c) => [c.classId, c.level, c.subclass])).toEqual([
      ['wizard', 12, 'Evoker'],
      ['cleric', 5, 'Life Domain'],
      ['fighter', 3, 'Champion'],
    ])
    expect(characterChoices(rules, e).filter((c) => !isMade(c) && !c.fixed)).toEqual([])
    expect(anyLevelUnfinished(rules, e, 0)).toEqual([])
    // Proficiency bonus +6 at level 20 (SRD p.23).
    expect(sheet.proficiencyBonus).toBe(6)
  })

  it('takes the Multiclass Spellcaster table’s slots for caster level 17 (SRD p.25)', () => {
    const sheet = deriveSheet(rules, oriel())
    // Wizard 12 and Cleric 5 are full casters; Fighter 3 (Champion) is none.
    const row = rules.data.spellcasting.multiclassSlots.rows.find((r) => r.casterLevel === 17)!
    expect(sheet.slots).toEqual(row.slots)
    expect(slotLevels(sheet, oriel()).length).toBe(row.slots.filter((n) => n > 0).length)
  })

  it('holds several dozen spells, each resolved, the prepared within each class’s number', () => {
    const e = oriel()
    const sheet = deriveSheet(rules, e)
    const rows = characterSpells(rules, e, sheet)
    expect(rows.length).toBeGreaterThanOrEqual(36)
    expect(e.spells.every((s) => rules.spells.has(s.spellId))).toBe(true)
    for (const caster of sheet.spellcasting) {
      const { prepared } = preparedCount(rows, caster)
      expect(prepared).toBeLessThanOrEqual(caster.prepared ?? Infinity)
    }
  })

  it('carries a full inventory: three items attuned, a Weapon, +2 attacking with its +2', () => {
    const e = oriel()
    const sheet = deriveSheet(rules, e)
    expect(e.inventory.length).toBeGreaterThanOrEqual(25)
    expect(attunement(rules, e).items.map((i) => i.name)).toEqual(['Ring of Protection', 'Cloak of Protection', 'Amulet of Health'])
    const sword = sheet.attacks.find((a) => a.name === 'Weapon, +2 (Longsword)')!
    expect(sword.toHit.parts).toContainEqual({ label: 'Weapon, +2 (Longsword)', value: 2 })
    expect(sheet.carrying.carried).toBeLessThanOrEqual(sheet.carrying.capacity)
  })

  it('fills the quick bar with nothing missing, and has her Reactions', () => {
    const e = oriel()
    const sheet = deriveSheet(rules, e)
    const { slots, suggested } = barSlots(rules, e, sheet)
    expect(suggested).toBe(false)
    expect(slots.some((s) => s?.kind === 'missing')).toBe(false)
    expect(reactions(rules, e, sheet).map((r) => r.name)).toContain('Opportunity Attack')
  })

  it('has two companions', () => {
    expect(oriel().companions.map((c) => c.name)).toHaveLength(2)
  })
})
