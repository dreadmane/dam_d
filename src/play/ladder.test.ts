// The level ladder's data and edits (play/ladder.ts) and what each choice can
// pick from (play/options.ts), on the example characters and a blank one.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { characterChoices } from '../rules/level.ts'
import { testRules } from '../rules/test-rules.ts'
import cleric from '../save/examples/cleric-fighter.json'
import wizard from '../save/examples/wizard.json'
import { blankCharacter } from '../save/new-roster.ts'
import type { CharacterEntity } from '../save/types.ts'
import { addClass, backgroundIncreaseFits, levelUp, removeClass, rungs, setBackground, setBaseScore, setChoice, setClassLevel, setHp, setSpecies, setSubclass } from './ladder.ts'
import { optionsFor } from './options.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity
const blank = () => blankCharacter('c', 'New')
const owedOf = (e: CharacterEntity, choice: string) => characterChoices(rules, e).find((c) => c.choice === choice)!
const optionIds = (e: CharacterEntity, choice: string) => optionsFor(rules, e, deriveSheet(rules, e), owedOf(e, choice))?.map((o) => o.id)

describe('the ladder', () => {
  it('has a rung per class level, in the order taken, each with that level’s choices', () => {
    const r = rungs(rules, entity(cleric))
    expect(r.map((x) => `${x.className} ${x.level}`)).toEqual(['Cleric 1', 'Cleric 2', 'Cleric 3', 'Cleric 4', 'Cleric 5', 'Fighter 1', 'Fighter 2'])
    expect(r[0].choices.map((c) => c.choice)).toEqual(['class-skills', 'divine-order'])
    expect(r[2].subclass).toBe(true)
    // Cleric 4's feat and the increase the feat asks for, both on its rung.
    expect(r[3].choices.map((c) => c.choice)).toEqual(['ability-score-improvement', 'ability-increase'])
    expect(r[0].hp).toEqual({ method: 'max', value: undefined, first: true })
    expect(r[5].hp.first).toBe(false)
  })

  it('adds a first class at level 1 with the die’s maximum, a later one with the fixed value', () => {
    let e = addClass(blank(), 'fighter')
    expect(e.classes).toEqual([{ classId: 'fighter', level: 1, hp: [{ level: 1, method: 'max' }] }])
    e = addClass(e, 'rogue')
    expect(e.classes[1]).toEqual({ classId: 'rogue', level: 1, hp: [{ level: 1, method: 'fixed' }] })
    expect(e.classOrder).toEqual(['fighter', 'rogue'])
  })

  it('raises a level with fixed HP for each new level, and keeps the character at 20', () => {
    let e = setClassLevel(addClass(blank(), 'wizard'), 'wizard', 4)
    expect(e.classes[0].hp.map((h) => h.method)).toEqual(['max', 'fixed', 'fixed', 'fixed'])
    e = setClassLevel(addClass(e, 'cleric'), 'cleric', 30)
    expect(e.classes.find((c) => c.classId === 'cleric')!.level).toBe(16)
  })

  it('keeps a lower level’s picks when a level is lowered, so raising it brings them back', () => {
    const e = setClassLevel(entity(cleric), 'cleric', 3)
    expect(e.choices.some((c) => c.source === 'class:cleric:4')).toBe(true)
    expect(deriveSheet(rules, e).abilities.wis.score).toBe(17)
    expect(deriveSheet(rules, setClassLevel(e, 'cleric', 5)).abilities.wis.score).toBe(19)
  })

  it('makes the next class first, with the die’s maximum, when the first is removed', () => {
    const e = removeClass(entity(cleric), 'cleric')
    expect(e.classes).toHaveLength(1)
    expect(e.classes[0].hp[0]).toEqual({ level: 1, method: 'max' })
    expect(deriveSheet(rules, e).hp.max).toBe(10 + 1 + 6 + 1 + 2)
  })

  it('keeps a rolled level’s roll, and never changes the first class’s level 1', () => {
    let e = setHp(entity(cleric), 'cleric', 2, 'rolled', 8)
    expect(e.classes[0].hp[1]).toEqual({ level: 2, method: 'rolled', value: 8 })
    expect(deriveSheet(rules, e).hp.max).toBe(54 - 6 + 9)
    e = setHp(e, 'cleric', 1, 'rolled', 3)
    expect(e.classes[0].hp[0]).toEqual({ level: 1, method: 'max' })
  })

  it('levels up in a class held, or into a new one (spec §3.2)', () => {
    const up = levelUp(entity(cleric), 'cleric', { method: 'fixed' })
    expect(deriveSheet(rules, up)).toMatchObject({ level: 8, hp: { max: 61 } })
    const rolled = levelUp(entity(cleric), 'fighter', { method: 'rolled', value: 10 })
    expect(rolled.classes.find((c) => c.classId === 'fighter')!.hp[2]).toEqual({ level: 3, method: 'rolled', value: 10 })
    expect(deriveSheet(rules, rolled).hp.max).toBe(54 + 11 + 1)
    const wizardToo = levelUp(entity(cleric), 'wizard', { method: 'fixed' })
    expect(wizardToo.classOrder).toEqual(['cleric', 'fighter', 'wizard'])
  })

  it('records a pick, replaces it, and removes it when emptied', () => {
    const owed = owedOf(entity(cleric), 'divine-order')
    let e = setChoice(entity(cleric), owed, ['thaumaturge'])
    expect(e.choices.filter((c) => c.choice === 'divine-order')).toEqual([{ source: 'class:cleric:1', choice: 'divine-order', values: ['thaumaturge'] }])
    e = setChoice(e, owed, [])
    expect(e.choices.some((c) => c.choice === 'divine-order')).toBe(false)
  })

  it('clears a species’ picks with the species, and starts a background at +2/+1 on its abilities', () => {
    let e = setSpecies(entity(wizard), 'dwarf', rules)
    expect(e.choices.some((c) => c.source.startsWith('species:'))).toBe(false)
    e = setBackground(blank(), 'soldier', rules)
    expect(e.background).toEqual({ backgroundId: 'soldier', abilityIncreases: { str: 2, dex: 1 } })
    expect(backgroundIncreaseFits({ str: 2, dex: 1 }, ['str', 'dex', 'con'])).toBe(true)
    expect(backgroundIncreaseFits({ str: 1, dex: 1, con: 1 }, ['str', 'dex', 'con'])).toBe(true)
    expect(backgroundIncreaseFits({ str: 2, int: 1 }, ['str', 'dex', 'con'])).toBe(false)
  })

  it('takes a typed base score, marked entered, within 1 to 30', () => {
    const e = setBaseScore(blank(), 'str', 33)
    expect(e.abilities).toEqual({ base: { str: 30, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, generation: { method: 'entered', rolls: [] } })
  })

  it('sets and clears a subclass', () => {
    expect(setSubclass(entity(cleric), 'fighter', 'champion').classes[1].subclassId).toBe('champion')
    expect(setSubclass(entity(cleric), 'cleric', null).classes[0].subclassId).toBeUndefined()
  })
})

describe('what a choice can pick from', () => {
  it('lists a choice’s own options by name', () => {
    expect(optionsFor(rules, entity(cleric), deriveSheet(rules, entity(cleric)), owedOf(entity(cleric), 'divine-order'))?.map((o) => o.name)).toEqual(['Protector', 'Thaumaturge'])
  })

  it('lists the Fighting Style feats, and every Simple or Martial weapon with its mastery', () => {
    expect(optionIds(entity(cleric), 'fighting-style')?.sort()).toEqual(['archery', 'defense', 'great-weapon-fighting', 'two-weapon-fighting'])
    const sheet = deriveSheet(rules, entity(cleric))
    const weapons = optionsFor(rules, entity(cleric), sheet, owedOf(entity(cleric), 'weapon-mastery'))!
    expect(weapons).toHaveLength(38)
    expect(weapons.find((w) => w.id === 'mace')?.detail).toBe('Sap')
  })

  it('offers Expertise only in a skill already proficient (Scholar, p.77)', () => {
    const ids = optionIds(entity(wizard), 'scholar')
    expect(ids).toEqual(expect.arrayContaining(['arcana', 'history']))
    expect(ids).not.toContain('athletics')
  })

  it('reads the spell queries: a list a background fixes, a class and level, a school with a cap', () => {
    const cantrips = optionIds(entity(wizard), 'magic-initiate-cantrips')!
    expect(cantrips).toContain('fire-bolt')
    expect(cantrips).not.toContain('sacred-flame')
    const book = optionIds(entity(wizard), 'spellbook-initial')!
    expect(book).toContain('magic-missile')
    expect(book.every((id) => rules.spells.get(id)!.level === 1 && rules.spells.get(id)!.classes.includes('wizard'))).toBe(true)
    const savant = optionIds(entity(wizard), 'evocation-savant')!
    expect(savant).toEqual(expect.arrayContaining(['magic-missile', 'scorching-ray']))
    expect(savant.every((id) => rules.spells.get(id)!.school === 'evocation' && rules.spells.get(id)!.level <= 2)).toBe(true)
    expect(savant).not.toContain('fireball')
  })

  it('shows a feat whose prerequisite is unmet, with the reason, rather than hiding it', () => {
    const e = entity(wizard)
    // Str 8 and Dex 8: Grappler wants 13 in either.
    e.abilities.base.dex = 8
    const feats = optionsFor(rules, e, deriveSheet(rules, e), owedOf(e, 'ability-score-improvement'))!
    expect(feats.find((f) => f.id === 'grappler')?.unmet).toBe('Level 4+, Strength or Dexterity 13+')
    expect(feats.find((f) => f.id === 'boon-of-fate')?.unmet).toBe('Level 19+')
    expect(feats.find((f) => f.id === 'ability-score-improvement')?.unmet).toBeUndefined()
  })

  it('offers every category at an Ability Score Improvement, which names none (SRD p.87, Parts of a Feat)', () => {
    const e = entity(wizard)
    const feats = optionsFor(rules, e, deriveSheet(rules, e), owedOf(e, 'ability-score-improvement'))!
    expect(new Set(feats.map((f) => f.detail))).toEqual(new Set(['Origin', 'General', 'Fighting Style', 'Epic Boon']))
    expect(feats.find((f) => f.id === 'alert')?.unmet).toBeUndefined()
    // A Fighting Style feat wants the Fighting Style feature: the Wizard
    // hasn't it, Halvard's Fighter has.
    expect(feats.find((f) => f.id === 'archery')?.unmet).toBe('Fighting Style Feature')
    const halvard = entity(cleric)
    expect(optionsFor(rules, halvard, deriveSheet(rules, halvard), owedOf(halvard, 'ability-score-improvement'))!.find((f) => f.id === 'archery')?.unmet).toBeUndefined()
  })
})

describe('Wild Shape’s known forms (the Beast Shapes table, SRD p.42)', () => {
  const druid = (level: number) => setClassLevel(addClass(blank(), 'druid'), 'druid', level)
  const forms = (level: number) => optionsFor(rules, druid(level), deriveSheet(rules, druid(level)), owedOf(druid(level), 'wild-shape-known-forms'))!
  const form = (level: number, id: string) => forms(level).find((o) => o.id === id)
  const owedForms = (level: number) => characterChoices(rules, druid(level)).filter((c) => c.choice === 'wild-shape-known-forms').map((c) => [c.source, c.count])

  it('owes 4 forms at Druid 2, 2 more at 4 and 2 more at 8', () => {
    expect(owedForms(2)).toEqual([['class:druid:2', 4]])
    expect(owedForms(8)).toEqual([['class:druid:2', 4], ['class:druid:4', 2], ['class:druid:8', 2]])
  })

  it('offers the recommended forms at Druid 2: the Rat, Riding Horse, Spider and Wolf', () => {
    for (const id of ['rat', 'riding-horse', 'spider', 'wolf']) expect(form(2, id)).toMatchObject({ unmet: undefined })
    expect(form(2, 'wolf')?.detail).toBe('CR 1/4')
    expect(form(2, 'giant-lizard')?.detail).toBe('CR 1/4 · Climb')
  })

  it('marks a form above the Max CR, or with a Fly Speed before Druid 8, and lists it after the forms that fit', () => {
    expect(form(2, 'ape')?.unmet).toBe('Above CR 1/4')
    expect(form(2, 'owl')?.unmet).toBe('Has a Fly Speed')
    expect(form(4, 'ape')?.unmet).toBeUndefined()
    expect(form(4, 'giant-wasp')?.unmet).toBe('Has a Fly Speed')
    expect(form(8, 'owl')?.unmet).toBeUndefined()
    expect(form(8, 'giant-wasp')?.unmet).toBeUndefined()
    const list = forms(2)
    expect(list.findIndex((o) => o.unmet)).toBe(list.filter((o) => !o.unmet).length)
  })

  it('leaves the swarms out, by the user’s ruling (classes.json ambiguity wild-shape-swarms)', () => {
    expect(forms(8).some((o) => o.id.startsWith('swarm-'))).toBe(false)
    expect(forms(8)).toHaveLength(rules.data.monsters.monsters.length - 6)
  })
})
