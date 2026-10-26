import { describe, expect, it } from 'vitest'
import {
  checkFormula,
  checkLine,
  describeCheck,
  describeDice,
  describePool,
  describeRoll,
  describeTypedCheck,
  describeTypedPool,
  diceText,
  facesWanted,
  naturalWords,
  parseFaces,
  poolDice,
  poolLine,
  sealOf,
  sidesOf,
} from './describe.ts'
import { testRules } from '../rules/test-rules.ts'

const pugilism = { flat: 15, dice: ['d20'] }

describe('describing a roll', () => {
  it('reads the sides of a die from the rules data’s notation', () => {
    expect(sidesOf('d20')).toBe(20)
    expect(sidesOf('1d20')).toBe(20)
    expect(sidesOf('2d8')).toBe(8)
    expect(sidesOf('1d3')).toBeNull()
  })

  it('words a Check as the window always has', () => {
    expect(checkLine({ faces: [14], kept: 14, total: 29 })).toBe('Rolled 14: 29.')
    expect(checkLine({ faces: [14, 6], kept: 14, total: 29 })).toBe('Rolled 14 and 6, kept 14: 29.')
    expect(checkFormula(pugilism, 'normal')).toBe('d20 + 15')
    expect(checkFormula(pugilism, 'advantage')).toBe('2 × d20 + 15, Advantage')
    expect(checkFormula(pugilism, 'disadvantage')).toBe('2 × d20 + 15, Disadvantage')
  })

  it('draws one d20 for a plain Check, the total in bold', () => {
    const r = describeCheck('Longsword, to hit', pugilism, 'normal', { faces: [14], kept: 14, total: 29 })
    expect(r).toEqual({ name: 'Longsword, to hit', formula: 'd20 + 15', dice: [{ sides: 20, face: 14 }], line: 'Rolled 14: 29.', bold: '29' })
  })

  it('draws both d20s under Advantage, the kept one marked and the other dropped', () => {
    const r = describeCheck('Longsword, to hit', pugilism, 'advantage', { faces: [17, 6], kept: 17, total: 32 })
    expect(r.dice).toEqual([
      { sides: 20, face: 17, kept: true, word: 'kept' },
      { sides: 20, face: 6, dropped: true },
    ])
    expect(r.line).toBe('Rolled 17 and 6, kept 17: 32.')
  })

  it('keeps the lower under Disadvantage, and the first of two equal faces', () => {
    const low = describeCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'disadvantage', { faces: [17, 6], kept: 6, total: 11 })
    expect(low.dice.map((d) => d.kept ?? false)).toEqual([false, true])
    const same = describeCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'advantage', { faces: [9, 9], kept: 9, total: 14 })
    expect(same.dice.map((d) => d.kept ?? false)).toEqual([true, false])
  })

  // The dice total concept (user, 2026-10-23): a 20 or a 1 on the d20 that
  // counts, on any roll; never on a die dropped under Advantage or
  // Disadvantage.
  it('marks a natural 20 or 1 on the d20 that counts, and nothing else', () => {
    const twenty = describeCheck('Longsword, to hit', pugilism, 'normal', { faces: [20], kept: 20, total: 35 })
    expect(twenty.dice[0].natural).toBe(20)
    expect(twenty.natural).toEqual({ face: 20, words: 'Natural 20' })
    const one = describeCheck('Longsword, to hit', pugilism, 'normal', { faces: [1], kept: 1, total: 16 })
    expect(one.dice[0]).toEqual({ sides: 20, face: 1, natural: 1 })
    expect(one.natural).toEqual({ face: 1, words: 'Natural 1' })
    expect(describeCheck('Longsword, to hit', pugilism, 'advantage', { faces: [20, 5], kept: 20, total: 35 }).dice.map((d) => d.natural ?? null)).toEqual([20, null])
    // Under Disadvantage the 20 is dropped: it does not count, and the 5 is no natural.
    const dropped = describeCheck('Longsword, to hit', pugilism, 'disadvantage', { faces: [20, 5], kept: 5, total: 20 })
    expect(dropped.dice.some((d) => d.natural)).toBe(false)
    expect(dropped.natural).toBeUndefined()
    // Under Advantage the 1 is dropped.
    expect(describeCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'advantage', { faces: [1, 14], kept: 14, total: 19 }).natural).toBeUndefined()
    // Two 20s: the first is kept, and it alone is marked.
    expect(describeCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'advantage', { faces: [20, 20], kept: 20, total: 25 }).dice.map((d) => d.natural ?? null)).toEqual([20, null])
    // Any other face is no natural.
    const plain = describeCheck('Longsword, to hit', pugilism, 'normal', { faces: [14], kept: 14, total: 29 })
    expect(plain.natural).toBeUndefined()
    expect(plain.dice[0].natural).toBeUndefined()
  })

  it('words a natural by what the d20 was rolled for, adding a result only where the rules print one', () => {
    expect(naturalWords('attack', 20)).toBe('Natural 20 · Critical Hit')
    expect(naturalWords('attack', 1)).toBe('Natural 1 · the attack misses')
    expect(naturalWords('death-save', 20)).toBe('Natural 20 · you regain 1 Hit Point')
    expect(naturalWords('death-save', 1)).toBe('Natural 1 · two failures')
    expect(naturalWords('other', 20)).toBe('Natural 20')
    expect(naturalWords('other', 1)).toBe('Natural 1')
  })

  it('never says a check or a save succeeded or failed', () => {
    for (const face of [20, 1] as const) expect(naturalWords('other', face)).not.toMatch(/succe|fail|hit|miss/i)
  })

  // The death save's words carry two of the rules' numbers: they must agree
  // with the rules data (SRD 5.2.1 p.17), or one is wrong.
  it('says the death save’s numbers as the rules data has them', () => {
    const ds = testRules().data.core.playRules!.deathSaves
    expect(ds.naturalTwentyHp).toBe(1)
    expect(ds.naturalOneFailures).toBe(2)
  })

  it('takes the roll’s kind for an attack roll’s words', () => {
    expect(describeCheck('Dagger, to hit', { flat: 5, dice: ['d20'] }, 'normal', { faces: [20], kept: 20, total: 25 }, 'attack').natural).toEqual({ face: 20, words: 'Natural 20 · Critical Hit' })
    expect(describeCheck('Dagger, to hit', { flat: 5, dice: ['d20'] }, 'disadvantage', { faces: [9, 1], kept: 1, total: 6 }, 'attack').natural).toEqual({ face: 1, words: 'Natural 1 · the attack misses' })
  })

  // A Champion's Improved Critical (SRD p.49): a Critical Hit on 19 or 20,
  // as the sheet's crit range says (#13). Words only: the die shows a 19, so
  // it gets no natural 20's mark.
  it('calls an attack roll in the crit range a Critical Hit, without marking the die', () => {
    const roll = (faces: number[], kept: number, critMin?: number, kind: 'attack' | 'other' = 'attack') => describeCheck('Longsword, to hit', { flat: 7, dice: ['d20'] }, faces.length > 1 ? 'advantage' : 'normal', { faces, kept, total: kept + 7 }, kind, critMin)
    const nineteen = roll([19], 19, 19)
    expect(nineteen.natural).toEqual({ face: 19, words: 'Natural 19 · Critical Hit' })
    expect(nineteen.dice[0].natural).toBeUndefined()
    expect(roll([18], 18, 18).natural).toEqual({ face: 18, words: 'Natural 18 · Critical Hit' })
    expect(roll([20], 20, 19).natural).toEqual({ face: 20, words: 'Natural 20 · Critical Hit' })
    expect(roll([18], 18, 19).natural).toBeUndefined()
    // Without a crit range, or on a roll that isn't an attack, a 19 is a 19.
    expect(roll([19], 19).natural).toBeUndefined()
    expect(roll([19], 19, 19, 'other').natural).toBeUndefined()
    // Under Advantage, the d20 that counts decides it.
    expect(roll([19, 4], 19, 19).natural).toEqual({ face: 19, words: 'Natural 19 · Critical Hit' })
  })

  it('marks a death saving throw’s single d20 when its kind is given, and a field’s die never', () => {
    const save = describeRoll('Death saving throw', '1d20', { faces: [20], total: 20 }, 'death-save')
    expect(save.dice[0].natural).toBe(20)
    expect(save.natural).toEqual({ face: 20, words: 'Natural 20 · you regain 1 Hit Point' })
    expect(describeRoll('Death saving throw', '1d20', { faces: [1], total: 1 }, 'death-save').natural).toEqual({ face: 1, words: 'Natural 1 · two failures' })
    // The seal shows the d20's face, as every other roll's shows its total.
    expect(save.bold).toBe('20')
    // A table's d20, rolled for no D20 Test, says nothing.
    expect(describeRoll('Table', '1d20', { faces: [20], total: 20 }).natural).toBeUndefined()
    expect(describeRoll('Hit Point Die, d8', '1d8', { faces: [1], total: 1 }, 'other').natural).toBeUndefined()
  })

  it('gives a d20 typed from the table the same natural', () => {
    expect(describeTypedCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'normal', 20).natural).toEqual({ face: 20, words: 'Natural 20' })
    expect(describeTypedCheck('Dagger, to hit', { flat: 5, dice: ['d20'] }, 'normal', 1, 'attack').natural).toEqual({ face: 1, words: 'Natural 1 · the attack misses' })
    expect(describeTypedCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'normal', 11).natural).toBeUndefined()
  })

  it('marks no die of a pool: no d20 there is the one that counts', () => {
    expect(describePool('Free roll', '1d20', ['1d20'], { faces: [20], total: 20 }).natural).toBeUndefined()
  })

  it('draws every die of a damage formula in the order rollDamage rolls them', () => {
    expect(poolDice(['1d2', '1d2', '1d2', '1d2'], [2, 1, 2, 1]).map((d) => `d${d.sides}:${d.face}`)).toEqual(['d2:2', 'd2:1', 'd2:2', 'd2:1'])
    expect(poolDice(['2d8', '1d6'], [3, 7, 5]).map((d) => `d${d.sides}:${d.face}`)).toEqual(['d8:3', 'd8:7', 'd6:5'])
  })

  it('words damage as the window always has: four d2s and 5', () => {
    expect(poolLine([2, 1, 2, 1], '11 Bludgeoning')).toBe('Rolled 2, 1, 2, 1: 11 Bludgeoning.')
    const r = describePool('Longsword, damage', '4d2 + 5 Bludgeoning', ['1d2', '1d2', '1d2', '1d2'], { faces: [2, 1, 2, 1], total: 11 }, '11 Bludgeoning')
    expect(r.bold).toBe('11 Bludgeoning')
    expect(r.dice).toHaveLength(4)
  })

  it('words a roll that only fills a field: one die alone, more with their sum', () => {
    expect(describeRoll('Table 25', '1d4', { faces: [3], total: 3 })).toMatchObject({ formula: '1d4', line: 'Rolled 3.', bold: '3' })
    const primary = describeRoll('Ranks for the primary', '2d4', { faces: [3, 4], total: 7 })
    expect(primary.line).toBe('Rolled 3, 4: 7.')
    expect(primary.dice.map((d) => `d${d.sides}:${d.face}`)).toEqual(['d4:3', 'd4:4'])
  })

  it('words a d20 typed from the table as the window does: 14 on the d20: 29.', () => {
    const typed = describeTypedCheck('Longsword, to hit', pugilism, 'advantage', 14)
    expect(typed).toMatchObject({ formula: '2 × d20 + 15, Advantage', line: '14 on the d20: 29.', bold: '29' })
    expect(typed.dice).toEqual([{ sides: 20, face: 14 }])
  })

  it('reads faces typed from the table, one for each die and each on its die', () => {
    expect(parseFaces('2, 1, 2, 1', ['4d2'])).toEqual([2, 1, 2, 1])
    expect(parseFaces(' 2 1,2 ,1 ', ['2d2', '1d2', '1d2'])).toEqual([2, 1, 2, 1])
    expect(parseFaces('7, 8, 6', ['2d8', '1d6'])).toEqual([7, 8, 6])
    expect(parseFaces('2, 1, 2', ['4d2'])).toBeNull()
    expect(parseFaces('2, 1, 3, 1', ['4d2'])).toBeNull()
    expect(parseFaces('2, 1, 2, x', ['4d2'])).toBeNull()
    expect(parseFaces('0, 1, 2, 1', ['4d2'])).toBeNull()
    expect(parseFaces('7, 8, 7', ['2d8', '1d6'])).toBeNull()
  })

  it('says what it wants when the faces do not fit', () => {
    expect(facesWanted(['4d2'])).toBe('Four faces, each 1 to 2.')
    expect(facesWanted(['1d8'])).toBe('One face, 1 to 8.')
    expect(facesWanted(['2d8', '1d6'])).toBe('Three faces: two 1 to 8, then one 1 to 6.')
  })

  it('words damage typed from the table as the window does: 2, 1, 2, 1 on 4d2: 11 Bludgeoning.', () => {
    expect(diceText(['2d2', '1d2', '1d2'])).toBe('4d2')
    expect(diceText(['2d8', '1d6'])).toBe('2d8 + 1d6')
    const typed = describeTypedPool('Longsword, damage', '4d2 + 5 Bludgeoning', ['4d2'], [2, 1, 2, 1], '11 Bludgeoning')
    expect(typed).toMatchObject({ line: '2, 1, 2, 1 on 4d2: 11 Bludgeoning.', bold: '11 Bludgeoning' })
    expect(typed.dice).toHaveLength(4)
  })

  it('takes any other dice and words as given', () => {
    const stats = describeDice('Stats', '1d6 each', [{ sides: 6, face: 1, dropped: true, word: 'rerolled' }, { sides: 6, face: 4 }], 'Rolled 1, 4.')
    expect(stats.bold).toBeNull()
    expect(stats.dice[0].word).toBe('rerolled')
  })

  it('splits the bold total for the seal at its first space: the numeral, then the word after it', () => {
    expect(sealOf('16')).toEqual({ value: '16', kind: null })
    expect(sealOf('5 Piercing')).toEqual({ value: '5', kind: 'Piercing' })
    expect(sealOf('31 Fire')).toEqual({ value: '31', kind: 'Fire' })
    expect(sealOf('12 Force or Radiant')).toEqual({ value: '12', kind: 'Force or Radiant' })
    expect(sealOf(null)).toBeNull()
    expect(sealOf('')).toBeNull()
  })
})
