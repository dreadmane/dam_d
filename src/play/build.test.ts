// The guided build's own logic (play/build.ts): the three ability score
// methods as the SRD prints them (p.21), starting equipment, languages
// (p.20), and the Finish review.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import { blankCharacter } from '../save/new-roster.ts'
import type { CharacterEntity } from '../save/types.ts'
import {
  anyLevelUnfinished,
  applyStartingEquipment,
  keepHighest,
  languageRule,
  placeRolls,
  pointBuyStart,
  pointCost,
  pointsSpent,
  pointStep,
  setBuildClass,
  setLanguages,
  setScores,
  STARTING_TAG,
  standardAssignment,
  swapScore,
  unfinished,
} from './build.ts'
import { setBackground, setSpecies } from './ladder.ts'

const rules = testRules()
let n = 0
const newId = () => `i${++n}`

describe('the standard array (SRD p.21)', () => {
  it('preassigns the Standard Array by Class table’s suggestion', () => {
    expect(standardAssignment(rules, 'fighter')).toEqual({ str: 15, dex: 14, con: 13, int: 8, wis: 10, cha: 12 })
    expect(standardAssignment(rules, 'wizard')).toEqual({ str: 8, dex: 12, con: 13, int: 15, wis: 14, cha: 10 })
  })

  it('without a class, places the array in the abilities’ order', () => {
    expect(Object.values(standardAssignment(rules, undefined))).toEqual([15, 14, 13, 12, 10, 8])
  })

  it('swaps a score with the ability that had it, so the set stays the array', () => {
    const swapped = swapScore(standardAssignment(rules, 'fighter'), 'int', 15)
    expect(swapped).toEqual({ str: 8, dex: 14, con: 13, int: 15, wis: 10, cha: 12 })
    expect(Object.values(swapped).sort()).toEqual([8, 10, 12, 13, 14, 15].sort())
  })
})

describe('the background’s increases', () => {
  it('default to +2 on the background ability with the highest score, +1 on the next', () => {
    const wizard = setScores(setBuildClass(blankCharacter('c', 'W'), 'wizard'), standardAssignment(rules, 'wizard'), 'standard-array')
    expect(setBackground(wizard, 'sage', rules).background?.abilityIncreases).toEqual({ int: 2, wis: 1 })
    expect(setBackground(blankCharacter('c', 'B'), 'sage', rules).background?.abilityIncreases).toEqual({ con: 2, int: 1 })
  })
})

describe('point buy (SRD p.21)', () => {
  it('costs each score from the table, 27 points in all', () => {
    expect(pointCost(rules, 14)).toBe(7)
    expect(pointCost(rules, 16)).toBeUndefined()
    expect(pointsSpent(rules, { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 })).toBe(27)
  })

  it('starts every score at 8 with nothing spent', () => {
    expect(pointBuyStart(rules)).toEqual({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
    expect(pointsSpent(rules, pointBuyStart(rules))).toBe(0)
  })

  it('steps a score within 8 to 15 and the budget, and refuses past either', () => {
    expect(pointStep(rules, pointBuyStart(rules), 'str', 1)?.str).toBe(9)
    expect(pointStep(rules, pointBuyStart(rules), 'str', -1)).toBeNull()
    expect(pointStep(rules, { str: 15, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, 'str', 1)).toBeNull()
    expect(pointStep(rules, { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 }, 'int', 1)).toBeNull()
  })
})

describe('random generation (SRD p.21)', () => {
  it('keeps the highest three of four d6', () => {
    expect(keepHighest([1, 6, 4, 3], 3)).toBe(13)
  })

  it('places six rolls as the class’s table places the array', () => {
    expect(placeRolls(rules, 'wizard', [9, 16, 12, 14, 8, 11])).toEqual({ int: 16, wis: 14, con: 12, dex: 11, cha: 9, str: 8 })
  })
})

describe('starting equipment', () => {
  const fighter = () => setBackground(setBuildClass(blankCharacter('c', 'Maren'), 'fighter'), 'soldier', rules)

  it('adds the class’s and background’s packages, wears the armor, and sets their gold', () => {
    const e = applyStartingEquipment(rules, fighter(), { class: 'a', background: 'b' }, newId)
    expect(e.inventory.map((i) => i.name)).toEqual(['Chain Mail', 'Greatsword', 'Flail', 'Javelin', 'Dungeoneer’s Pack'])
    expect(e.inventory.find((i) => i.name === 'Chain Mail')?.worn).toBe(true)
    expect(e.inventory.every((i) => i.tags.includes(STARTING_TAG))).toBe(true)
    expect(e.coins.gp).toBe(4 + 50)
    expect(e.creation.equipment).toEqual({ class: 'a', background: 'b' })
    expect(deriveSheet(rules, e).ac.total).toBe(16)
  })

  it('replaces what an earlier pick added, and keeps what the player added', () => {
    let e = applyStartingEquipment(rules, fighter(), { class: 'a', background: 'a' }, newId)
    e = { ...e, inventory: [...e.inventory, { id: 'mine', name: 'Lucky coin', description: '', quantity: 1, tags: [] }] }
    e = applyStartingEquipment(rules, e, { class: 'c', background: 'b' }, newId)
    expect(e.inventory.map((i) => i.name)).toEqual(['Lucky coin'])
    expect(e.coins.gp).toBe(155 + 50)
  })
})

describe('languages (SRD p.20)', () => {
  it('knows Common and chooses two Standard Languages', () => {
    const rule = languageRule(rules)
    expect(rule.known).toEqual(['common'])
    expect(rule.choose).toBe(2)
    expect(rule.options.every((l) => l.kind === 'standard')).toBe(true)
    const e = setLanguages(rules, blankCharacter('c', ''), ['elvish', 'dwarvish', 'giant'])
    expect(e.details.languages).toEqual(['common', 'elvish', 'dwarvish'])
  })
})

describe('the Finish review', () => {
  it('lists everything a blank character lacks, each with its step', () => {
    expect(unfinished(rules, blankCharacter('c', '')).map((u) => u.step)).toEqual(['class', 'origin', 'origin', 'details', 'details', 'gear'])
  })

  it('is empty for a character the build has finished', () => {
    let e: CharacterEntity = setBuildClass(blankCharacter('c', 'Maren Holt'), 'fighter')
    e = setSpecies(setBackground(e, 'soldier', rules), 'dwarf', rules)
    e = setScores(e, { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }, 'point-buy')
    e = setLanguages(rules, applyStartingEquipment(rules, e, { class: 'a', background: 'a' }, newId), ['elvish', 'orc'])
    const left = unfinished(rules, e)
    expect(left.map((u) => u.step)).toEqual(['level-1'])
    expect(left[0].text).toMatch(/choices to make/)
  })

  it('says point buy’s points left', () => {
    const e = setScores(setBuildClass(blankCharacter('c', 'A'), 'fighter'), pointBuyStart(rules), 'point-buy')
    expect(unfinished(rules, e).find((u) => u.step === 'scores')?.text).toBe('Point buy has 27 points left.')
  })
})

describe('Finish, for a character started at any level', () => {
  it('lists everything open on a blank character, and nothing on a finished example', async () => {
    const blank = blankCharacter('c', '')
    expect(anyLevelUnfinished(rules, blank, 0)).toEqual([
      'Choose a class: + Class.',
      'Choose a species and a background: the Species and background chip.',
      'Name your character.',
      `Choose ${languageRule(rules).choose} more languages.`,
      'Nothing in the inventory yet: Add from catalogue, in the sheet’s Inventory.',
    ])
    expect(anyLevelUnfinished(rules, blank, 3)).toContain('3 choices to make on the ladder.')
    const halvard = (await import('../save/examples/cleric-fighter.json')).default.entities[0] as unknown as CharacterEntity
    expect(anyLevelUnfinished(rules, halvard, 0)).toEqual([])
  })
})
