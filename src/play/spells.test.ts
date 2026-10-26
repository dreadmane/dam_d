// Spells (play/spells.ts), on the Wizard and the Cleric / Fighter examples.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import cleric from '../save/examples/cleric-fighter.json'
import wizard from '../save/examples/wizard.json'
import type { CharacterEntity } from '../save/types.ts'
import { takeDamage } from './play.ts'
import { addClassSpell, cast, castOptions, characterSpells, classMaxSpellLevel, concentrationDc, concentrationSave, preparedCount, scaledDice, setPrepared, slotLevels } from './spells.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity
const rowOf = (e: CharacterEntity, id: string) => characterSpells(rules, e, deriveSheet(rules, e)).find((r) => r.spell.id === id)!

describe('a character’s spells', () => {
  it('gathers the class’s, the subclass’s always-prepared, a lineage’s and a feat’s, each once', () => {
    const halvard = entity(cleric)
    const rows = characterSpells(rules, halvard, deriveSheet(rules, halvard))
    const ids = rows.map((r) => r.spell.id)
    expect(new Set(ids).size).toBe(ids.length)
    // Life Domain at Cleric 5: Aid, Bless, Cure Wounds, Lesser Restoration, Mass Healing Word, Revivify.
    expect(rows.find((r) => r.spell.id === 'mass-healing-word')).toMatchObject({ from: 'Life Domain', always: true, ready: true })
    // Magic Initiate (Cleric), from Acolyte.
    expect(rows.find((r) => r.spell.id === 'healing-word')).toMatchObject({ from: 'Magic Initiate', always: true })
    const ilsabet = entity(wizard)
    const iRows = characterSpells(rules, ilsabet, deriveSheet(rules, ilsabet))
    // High Elf: Prestidigitation at 1, Detect Magic at 3, Misty Step at 5 (SRD p.84).
    expect(iRows.find((r) => r.spell.id === 'misty-step')).toMatchObject({ from: 'High Elf', always: true })
    // A spellbook spell not prepared.
    expect(iRows.find((r) => r.spell.id === 'feather-fall')).toMatchObject({ ready: false, preparable: true })
  })

  it('counts the prepared against the class’s number, the always-prepared not counted', () => {
    const ilsabet = entity(wizard)
    const sheet = deriveSheet(rules, ilsabet)
    expect(preparedCount(characterSpells(rules, ilsabet, sheet), sheet.spellcasting[0])).toMatchObject({ prepared: 9, cantrips: 4 })
  })

  it('makes the Cleric example a full caster: 9 of 9 prepared and 4 of 4 cantrips, the domain spells apart', () => {
    const halvard = entity(cleric)
    const sheet = deriveSheet(rules, halvard)
    expect(preparedCount(characterSpells(rules, halvard, sheet), sheet.spellcasting[0])).toMatchObject({ prepared: 9, cantrips: 4 })
  })

  it('prepares and unprepares a class spell, and adds one to the spellbook', () => {
    let e = setPrepared(entity(wizard), 'feather-fall', 'wizard', true)
    expect(rowOf(e, 'feather-fall').ready).toBe(true)
    e = addClassSpell(e, 'web', 'wizard', false)
    expect(rowOf(e, 'web')).toMatchObject({ ready: false, preparable: true })
  })
})

describe('slots and casting (SRD p.104)', () => {
  it('casts with a slot of the spell’s level or higher, never lower, and only one left', () => {
    let e = entity(wizard)
    const fireball = rowOf(e, 'fireball')
    expect(castOptions(rules, deriveSheet(rules, e), e, fireball)).toEqual([{ kind: 'slot', level: 3 }])
    e = cast(e, fireball, { kind: 'slot', level: 3 })
    expect(e.slotsExpended['3']).toBe(1)
    e = cast(e, fireball, { kind: 'slot', level: 3 })
    expect(castOptions(rules, deriveSheet(rules, e), e, fireball)).toEqual([])
    expect(slotLevels(deriveSheet(rules, e), e)).toEqual([
      { level: 1, max: 4, left: 4 },
      { level: 2, max: 3, left: 3 },
      { level: 3, max: 2, left: 0 },
    ])
  })

  it('offers a ritual as a ritual, with no slot, to a class that casts rituals', () => {
    const e = entity(wizard)
    const detect = rowOf(e, 'detect-magic')
    expect(castOptions(rules, deriveSheet(rules, e), e, detect)).toContainEqual({ kind: 'slot', level: 1 })
    // Detect Magic is the High Elf's, not the class's, so no ritual offer; a
    // Wizard's own ritual spell is.
    const withBook = addClassSpell(e, 'detect-magic', 'wizard', true)
    expect(castOptions(rules, deriveSheet(rules, withBook), withBook, rowOf(withBook, 'detect-magic'))).toContainEqual({ kind: 'ritual' })
  })

  it('starts Concentration, and a second Concentration spell replaces the first (SRD p.179)', () => {
    let e = entity(cleric)
    e = cast(e, rowOf(e, 'bless'), { kind: 'slot', level: 1 })
    expect(e.concentration).toEqual({ spellId: 'bless' })
    e = cast(e, rowOf(e, 'spirit-guardians'), { kind: 'slot', level: 3 })
    expect(e.concentration).toEqual({ spellId: 'spirit-guardians' })
  })

  it('sets the Concentration save at 10 or half the damage, up to 30', () => {
    expect(concentrationDc(rules, 7)).toBe(10)
    expect(concentrationDc(rules, 25)).toBe(12)
    expect(concentrationDc(rules, 90)).toBe(30)
  })

  // Spec §3.2, Take damage: the Concentration save's DC comes with a roll.
  // The damage window offers the Constitution save, its DC in the roll's name.
  it('offers the Constitution save to keep Concentration after damage', () => {
    let e = entity(cleric)
    e = cast(e, rowOf(e, 'bless'), { kind: 'slot', level: 1 })
    const sheet = deriveSheet(rules, e)
    expect(concentrationSave(rules, sheet, e, takeDamage(rules, e, sheet, 14, null))).toEqual({ spell: 'Bless', dc: 10, name: 'Constitution save for Concentration (DC 10)', total: sheet.saves.con })
    expect(concentrationSave(rules, sheet, e, takeDamage(rules, e, sheet, 30, null))?.dc).toBe(15)
    // None at 0 HP, where Concentration ends by itself, and none without it.
    expect(concentrationSave(rules, sheet, e, takeDamage(rules, e, sheet, 500, null))).toBeNull()
    const plain = entity(cleric)
    const plainSheet = deriveSheet(rules, plain)
    expect(concentrationSave(rules, plainSheet, plain, takeDamage(rules, plain, plainSheet, 14, null))).toBeNull()
  })
})

describe('what a class can prepare', () => {
  it('goes up to its own highest slot (Wizard 5: level 3; Cleric 5: 3; Paladin 5: 2; Warlock 5: 3)', () => {
    expect(classMaxSpellLevel(rules, 'wizard', 5)).toBe(3)
    expect(classMaxSpellLevel(rules, 'cleric', 5)).toBe(3)
    expect(classMaxSpellLevel(rules, 'paladin', 5)).toBe(2)
    expect(classMaxSpellLevel(rules, 'warlock', 5)).toBe(3)
    expect(classMaxSpellLevel(rules, 'fighter', 5)).toBe(0)
  })
})

describe('damage at the level cast', () => {
  it('adds a die per slot level above (Fireball at 5th: 10d6)', () => {
    const fireball = rules.spells.get('fireball')!
    expect(scaledDice(fireball, '8d6', 3, 5)).toBe('8d6')
    expect(scaledDice(fireball, '8d6', 5, 9)).toBe('10d6')
  })

  it('steps a cantrip up with character level (Fire Bolt: 2d10 at 5, 4d10 at 17)', () => {
    const fireBolt = rules.spells.get('fire-bolt')!
    expect(scaledDice(fireBolt, '1d10', 0, 4)).toBe('1d10')
    expect(scaledDice(fireBolt, '1d10', 0, 5)).toBe('2d10')
    expect(scaledDice(fireBolt, '1d10', 0, 17)).toBe('4d10')
  })
})
