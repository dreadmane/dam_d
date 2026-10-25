import { describe, expect, it } from 'vitest'
import {
  addDie,
  diceIn,
  EMPTY_POOL,
  formulaOf,
  MOST_DICE,
  MOST_MODIFIER,
  notationsOf,
  parsePool,
  rollPool,
  stepModifier,
  tapDie,
  tapModifier,
  type Pool,
} from './free-roll.ts'

const pool = (counts: Pool['counts'], modifier = 0): Pool => ({ counts, modifier })

// A random number that lands each die on the face given, in order.
const faces = (...wanted: [face: number, sides: number][]) => {
  let i = 0
  return () => {
    const [face, sides] = wanted[i++]
    return (face - 0.5) / sides
  }
}

describe('the free roll', () => {
  it('writes its formula in the book’s notation, the dice in the keys’ order', () => {
    expect(formulaOf(EMPTY_POOL)).toBe('')
    expect(formulaOf(pool({ 4: 1, 6: 2 }, 2))).toBe('2d6 + 1d4 + 2')
    expect(formulaOf(pool({ 20: 1 }, -3))).toBe('1d20 − 3')
    expect(formulaOf(pool({ 100: 1, 2: 1 }))).toBe('1d2 + 1d100')
    expect(notationsOf(pool({ 4: 1, 20: 1 }))).toEqual(['1d20', '1d4'])
  })

  it('adds one die a tap, up to twenty in a roll', () => {
    let p = EMPTY_POOL
    p = addDie(p, 6)
    p = addDie(p, 6)
    expect(p.counts).toEqual({ 6: 2 })
    for (let i = 0; i < 30; i++) p = addDie(p, 4)
    expect(diceIn(p)).toBe(MOST_DICE)
  })

  it('steps the modifier by one, never past 99 either way', () => {
    expect(stepModifier(EMPTY_POOL, -1).modifier).toBe(-1)
    const most = pool({}, MOST_MODIFIER)
    expect(stepModifier(most, 1)).toBe(most)
  })

  it('rolls every die in the formula’s order and adds the modifier', () => {
    const r = rollPool(pool({ 6: 2, 4: 1 }, 2), faces([5, 6], [3, 6], [2, 4]))
    expect(r).toEqual({ faces: [5, 3, 2], total: 12 })
    const d100 = rollPool(pool({ 100: 1 }), faces([73, 100]))
    expect(d100).toEqual({ faces: [73], total: 73 })
  })

  it('starts a new roll at the first die tapped after one, while the modifier changes the one rolled', () => {
    const rolled = { pool: pool({ 6: 2 }, 2), rolled: true }
    expect(tapDie(rolled, 4)).toEqual({ pool: pool({ 4: 1 }), rolled: false })
    const again = tapModifier(rolled, 1)
    expect(again).toEqual({ pool: pool({ 6: 2 }, 3), rolled: false })
    expect(tapDie(again, 4).pool).toEqual(pool({ 6: 2, 4: 1 }, 3))
  })

  it('reads the pool this device kept leniently', () => {
    expect(parsePool(null)).toEqual(EMPTY_POOL)
    expect(parsePool('not json')).toEqual(EMPTY_POOL)
    expect(parsePool(JSON.stringify({ counts: { 6: 2, 7: 3, 4: -1, 8: 1.5 }, modifier: 2 }))).toEqual(pool({ 6: 2 }, 2))
    expect(parsePool(JSON.stringify({ counts: { 4: 50 }, modifier: 500 }))).toEqual(pool({ 4: MOST_DICE }, MOST_MODIFIER))
  })
})
