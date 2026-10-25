// The sheet's arithmetic (the spec §5.1), on the four example characters.
// Every expected number is worked by hand from the SRD 5.2.1, with its page,
// so a failure says which rule moved.

import { describe, expect, it } from 'vitest'
import { deriveSheet, type Sheet } from './derive.ts'
import { modifier } from './expr.ts'
import { characterChoices, levelGrants } from './level.ts'
import { testRules } from './test-rules.ts'
import barbarian from '../save/examples/barbarian.json'
import cleric from '../save/examples/cleric-fighter.json'
import fighter from '../save/examples/fighter.json'
import wizard from '../save/examples/wizard.json'
import type { CharacterEntity } from '../save/types.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity
const sheetOf = (record: { entities: unknown[] }) => deriveSheet(rules, entity(record))
const skill = (sheet: Sheet, id: string) => sheet.skills.find((s) => s.id === id)!
const attack = (sheet: Sheet, name: string) => sheet.attacks.find((a) => a.name === name)!
const resource = (sheet: Sheet, key: string) => sheet.resources.find((r) => r.key === key)

describe('the ability modifier', () => {
  it('matches every row of the Ability Modifiers table (p.6)', () => {
    expect(rules.data.core.abilityModifiers?.length).toBe(16)
    for (const row of rules.data.core.abilityModifiers!) for (let s = row.min; s <= row.max; s++) expect(modifier(s), `score ${s}`).toBe(row.modifier)
  })
})

describe('the level engine', () => {
  it('asks a Fighter for skills, a Fighting Style and three Weapon Masteries at level 1 (pp.47-48)', () => {
    const g = levelGrants(rules, 'fighter', 1, { first: true })
    expect(g.features.map((f) => f.id)).toEqual(['fighting-style', 'second-wind', 'weapon-mastery'])
    expect(g.choices.map((c) => [c.choice, c.count])).toEqual([['class-skills', 2], ['fighting-style', 1], ['weapon-mastery', 3]])
  })

  it('owes one more Weapon Mastery where the column rises, at Fighter 4 (3 → 4), and none at 5', () => {
    expect(levelGrants(rules, 'fighter', 4, { first: true }).choices.map((c) => [c.choice, c.count])).toEqual([['ability-score-improvement', 1], ['weapon-mastery', 1]])
    expect(levelGrants(rules, 'fighter', 5, { first: true }).choices).toEqual([])
  })

  it('asks for the subclass at level 3, and brings its features from then (Champion, p.49)', () => {
    expect(levelGrants(rules, 'fighter', 3, { first: true }).subclass).toBe(true)
    expect(levelGrants(rules, 'fighter', 3, { first: true, subclassId: 'champion' }).features.map((f) => f.id)).toEqual(['fighter-subclass', 'improved-critical', 'remarkable-athlete'])
    expect(levelGrants(rules, 'fighter', 7, { first: true, subclassId: 'champion' }).features.map((f) => f.id)).toEqual(['additional-fighting-style'])
  })

  it('gives a later class its multiclass gains, not its skills or saves (p.25)', () => {
    const g = levelGrants(rules, 'fighter', 1, { first: false })
    expect(g.choices.map((c) => c.choice)).toEqual(['fighting-style', 'weapon-mastery'])
  })

  it('makes the Ability Score Improvement feat a +2 or +1/+1 the player places (p.87)', () => {
    const owed = characterChoices(rules, entity(wizard)).find((c) => c.source === 'class:wizard:4>feat:ability-score-improvement')
    expect(owed?.increase?.patterns).toEqual([[2], [1, 1]])
    expect(owed?.made?.increases).toEqual({ int: 2 })
  })

  it('lets a background fix its feat’s spell list (Sage: Magic Initiate (Wizard), p.83)', () => {
    const list = characterChoices(rules, entity(wizard)).find((c) => c.choice === 'magic-initiate-spell-list')
    expect(list?.made?.values).toEqual(['classes:wizard'])
  })
})

describe('Maren Holt, Human Soldier, Fighter 1', () => {
  const sheet = sheetOf(fighter)

  it('owes nothing', () => expect(sheet.unmade.map((c) => `${c.source} ${c.choice}`)).toEqual([]))

  it('has the standard array plus Soldier’s +2 Str and +1 Con (p.83)', () => {
    expect(Object.fromEntries(Object.entries(sheet.abilities).map(([a, v]) => [a, v.score]))).toEqual({ str: 17, dex: 13, con: 15, int: 8, wis: 12, cha: 10 })
  })

  it('has proficiency bonus +2 at level 1 (p.23)', () => expect(sheet.proficiencyBonus).toBe(2))

  it('is proficient in Strength and Constitution saves (p.47)', () => {
    expect(sheet.saves.str).toMatchObject({ total: 5, proficient: true })
    expect(sheet.saves.con).toMatchObject({ total: 4, proficient: true })
    expect(sheet.saves.dex).toMatchObject({ total: 1, proficient: false })
  })

  it('has its skills from Soldier, Fighter and Skillful', () => {
    expect(skill(sheet, 'athletics').total).toBe(5)
    expect(skill(sheet, 'intimidation').total).toBe(2)
    expect(skill(sheet, 'perception').total).toBe(3)
    expect(skill(sheet, 'insight').total).toBe(3)
    expect(skill(sheet, 'stealth')).toMatchObject({ total: 1, proficiency: 0 })
    expect(sheet.passivePerception.total).toBe(13)
  })

  it('adds the proficiency bonus to Initiative with Alert (p.87)', () => expect(sheet.initiative.total).toBe(3))

  it('has AC 17: Chain Mail 16, +1 for Defense while wearing armor (pp.92, 88)', () => {
    expect(sheet.ac.total).toBe(17)
    expect(sheet.ac.formula).toBe('Chain Mail')
  })

  it('has 12 HP: the Fighter’s d10 at level 1 + Con +2 (p.23)', () => expect(sheet.hp.max).toBe(12))

  it('swings the Greatsword at +5 for 2d6 + 3, with its mastery, Graze (p.91)', () => {
    expect(attack(sheet, 'Greatsword')).toMatchObject({ toHit: { total: 5 }, damage: { dice: '2d6', modifier: 3, type: 'slashing' }, mastery: 'graze', proficient: true })
  })

  it('has Second Wind twice (the Fighter Features table, p.47)', () => expect(resource(sheet, 'fighter:second-wind')).toMatchObject({ max: 2, used: 0 }))

  it('walks at 30 feet', () => expect(sheet.speed.walk.total).toBe(30))
})

describe('Ilsabet Vane, High Elf Sage, Wizard 5 (Evoker)', () => {
  const sheet = sheetOf(wizard)

  it('owes nothing', () => expect(sheet.unmade.map((c) => `${c.source} ${c.choice}`)).toEqual([]))

  it('has Int 19 from 15, Sage’s +2 and the Ability Score Improvement’s +2', () => {
    expect(sheet.abilities.int).toMatchObject({ score: 19, modifier: 4 })
    expect(sheet.abilities.con.score).toBe(14)
  })

  it('has proficiency bonus +3 at level 5', () => expect(sheet.proficiencyBonus).toBe(3))

  it('doubles the bonus on Arcana with Scholar’s Expertise (p.77)', () => {
    expect(skill(sheet, 'arcana')).toMatchObject({ total: 10, proficiency: 2 })
    expect(skill(sheet, 'history')).toMatchObject({ total: 7, proficiency: 1 })
    expect(skill(sheet, 'perception').total).toBe(4)
  })

  it('has spell save DC 15 and spell attack +7 (p.104)', () => {
    expect(sheet.spellcasting).toHaveLength(1)
    expect(sheet.spellcasting[0]).toMatchObject({ ability: 'int', saveDc: { total: 15 }, attack: { total: 7 }, cantrips: 4, prepared: 9 })
  })

  it('has the Wizard’s slots at level 5: 4, 3, 2 (p.77)', () => expect(sheet.slots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]))

  it('has 32 HP: 6 + 2, then 4 levels of 4 + 2 (p.23)', () => expect(sheet.hp.max).toBe(32))

  it('has AC 12 unarmored: 10 + Dex +2', () => expect(sheet.ac).toMatchObject({ total: 12, formula: 'Unarmored' }))

  it('sees 60 feet in the dark (Elf, p.84)', () => expect(sheet.senses).toEqual([expect.objectContaining({ sense: 'darkvision', feet: 60 })]))

  it('has five d6 Hit Dice', () => expect(sheet.hitDice).toEqual([{ die: 6, count: 5, spent: 0 }]))
})

describe('Halvard Stoneward, Dwarf Acolyte, Cleric 5 (Life) / Fighter 2', () => {
  const sheet = sheetOf(cleric)

  it('owes nothing', () => expect(sheet.unmade.map((c) => `${c.source} ${c.choice}`)).toEqual([]))

  it('is level 7 with proficiency bonus +3, by character level (p.25)', () => {
    expect(sheet.level).toBe(7)
    expect(sheet.proficiencyBonus).toBe(3)
  })

  it('saves as a Cleric only, the first class (p.25)', () => {
    expect(sheet.saves.wis).toMatchObject({ total: 7, proficient: true })
    expect(sheet.saves.cha).toMatchObject({ total: 4, proficient: true })
    expect(sheet.saves.str.proficient).toBe(false)
    expect(sheet.saves.con.proficient).toBe(false)
  })

  it('has AC 19: Chain Mail 16 (heavy armor from Protector), Shield +2, Defense +1', () => {
    expect(sheet.proficiencies.armor).toContain('heavy')
    expect(sheet.ac.total).toBe(19)
  })

  it('has 54 HP: Cleric 9 + 4 × 6, Fighter 2 × 7, and Dwarven Toughness +7 (pp.23, 84)', () => expect(sheet.hp.max).toBe(54))

  it('has one caster, so the Cleric’s own slots at 5 (p.25)', () => {
    expect(sheet.slots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
    expect(sheet.spellcasting[0]).toMatchObject({ classId: 'cleric', saveDc: { total: 15 }, attack: { total: 7 } })
  })

  it('tracks each class’s resources apart', () => {
    expect(resource(sheet, 'cleric:channel-divinity')).toMatchObject({ max: 2 })
    expect(resource(sheet, 'fighter:second-wind')).toMatchObject({ max: 2 })
    expect(resource(sheet, 'fighter:action-surge')).toMatchObject({ max: 1 })
  })

  it('has Hit Dice of two sizes: five d8 and two d10', () => expect(sheet.hitDice).toEqual([{ die: 10, count: 2, spent: 0 }, { die: 8, count: 5, spent: 0 }]))

  it('resists poison and sees 120 feet in the dark (Dwarf, p.84)', () => {
    expect(sheet.defenses).toEqual([expect.objectContaining({ defense: 'resistance', damageTypes: ['poison'] })])
    expect(sheet.senses).toEqual([expect.objectContaining({ sense: 'darkvision', feet: 120 })])
  })

  it('swings the Mace at +5 for 1d6 + 2, with Sap', () => {
    expect(attack(sheet, 'Mace')).toMatchObject({ toHit: { total: 5 }, damage: { dice: '1d6', modifier: 2 }, mastery: 'sap' })
  })
})

describe('Unga-Bunga, Orc Soldier, Barbarian 5 (Berserker)', () => {
  const sheet = sheetOf(barbarian)

  it('owes nothing', () => expect(sheet.unmade.map((c) => `${c.source} ${c.choice}`)).toEqual([]))

  it('has Str 18 and Con 16: the standard array, Soldier’s +2/+1 (p.83), and the Ability Score Improvement’s +1/+1', () => {
    expect(Object.fromEntries(Object.entries(sheet.abilities).map(([a, v]) => [a, v.score]))).toEqual({ str: 18, dex: 13, con: 16, int: 8, wis: 12, cha: 10 })
  })

  it('saves with Strength and Constitution (p.28)', () => {
    expect(sheet.saves.str).toMatchObject({ total: 7, proficient: true })
    expect(sheet.saves.con).toMatchObject({ total: 6, proficient: true })
  })

  it('has AC 14 unarmored: 10 + Dex +1 + Con +3 (Unarmored Defense, p.29)', () => expect(sheet.ac.total).toBe(14))

  it('has 55 HP: 12 + 3, then 4 levels of 7 + 3 (p.23)', () => expect(sheet.hp.max).toBe(55))

  it('walks at 40 feet with Fast Movement, wearing no Heavy armor (p.29)', () => expect(sheet.speed.walk.total).toBe(40))

  it('swings the Greatclub at +7 for 1d8 + 4, with Push (p.91)', () => {
    expect(attack(sheet, 'Greatclub')).toMatchObject({ toHit: { total: 7 }, damage: { dice: '1d8', modifier: 4 }, mastery: 'push', proficient: true })
  })

  it('has three Rages at level 5 (p.28), and the Orc’s Adrenaline Rush and Relentless Endurance (p.86)', () => {
    expect(resource(sheet, 'barbarian:rage')).toMatchObject({ max: 3 })
    expect(resource(sheet, 'adrenaline-rush')).toMatchObject({ max: 3 })
    expect(resource(sheet, 'relentless-endurance')).toMatchObject({ max: 1 })
  })

  it('sees 120 feet in the dark (Orc, p.86)', () => expect(sheet.senses).toEqual([expect.objectContaining({ sense: 'darkvision', feet: 120 })]))

  it('has five d12 Hit Dice', () => expect(sheet.hitDice).toEqual([{ die: 12, count: 5, spent: 0 }]))

  it('attacks twice with the Attack action, Extra Attack (p.29)', () => expect(sheet.attackCount).toBe(2))

  describe('while raging', () => {
    // Rage on, and a Shortbow in hand: a ranged weapon attacks with Dexterity.
    const raging = entity(barbarian)
    raging.toggles = { rage: true }
    raging.inventory = [...raging.inventory, { id: 'test-shortbow', name: 'Shortbow', description: '', quantity: 1, tags: [], itemId: 'equipment:shortbow', weight: 2 }]
    const rage = deriveSheet(rules, raging)

    it('adds the Rage Damage, +2 at Barbarian 5, to an attack using Strength: Greatclub 1d8 + 6, Unarmed Strike 7 (p.28)', () => {
      expect(attack(rage, 'Greatclub').damage).toMatchObject({ dice: '1d8', modifier: 6 })
      expect(attack(rage, 'Javelin').damage).toMatchObject({ dice: '1d6', modifier: 6 })
      expect(attack(rage, 'Unarmed Strike').damage.modifier).toBe(7)
    })

    it('leaves it off an attack using Dexterity, and says when it applies', () => {
      expect(attack(rage, 'Shortbow')).toMatchObject({ ability: 'dex', damage: { modifier: 1 } })
      expect(attack(rage, 'Shortbow').damage.notes).toEqual([expect.objectContaining({ text: '+2 attack using Strength' })])
    })

    it('adds nothing while Rage is off', () => expect(attack(sheet, 'Greatclub').damage.notes).toEqual([]))
  })
})

describe('effects with a printed condition', () => {
  it('leave Defense out without armor, and say why', () => {
    const e = entity(fighter)
    e.inventory = e.inventory.map((i) => ({ ...i, worn: false }))
    const sheet = deriveSheet(rules, e)
    expect(sheet.ac).toMatchObject({ total: 11, formula: 'Unarmored' })
    expect(sheet.ac.notes).toEqual([expect.objectContaining({ from: expect.stringContaining('Defense') })])
  })

  it('keep a condition the app can’t decide as a note that reads mid-line', () => {
    const sheet = sheetOf(cleric)
    expect(sheet.saves.wis.notes).toContainEqual({ text: 'Advantage to avoid or end the Poisoned condition', from: 'Dwarf: Dwarven Resilience' })
    expect(sheet.saves.wis.total).toBe(7)
  })

  it('apply Exhaustion to every d20 Test and to Speed (p.181)', () => {
    const e = entity(fighter)
    e.exhaustion = 2
    const sheet = deriveSheet(rules, e)
    expect(sheet.saves.str.total).toBe(1)
    expect(skill(sheet, 'athletics').total).toBe(1)
    expect(sheet.speed.walk.total).toBe(20)
  })
})
