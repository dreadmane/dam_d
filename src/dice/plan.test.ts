import { describe, expect, it } from 'vitest'
import { DECOYS, decoysFor, delayOf, landsAfter, seeded, SETTLE_MS, TUMBLE_MS } from './plan.ts'

describe('the tumble plan', () => {
  it('starts the first die 40 ms after the tap and each next one 25 ms later', () => {
    expect([0, 1, 7].map(delayOf)).toEqual([40, 65, 215])
  })

  it('lands one die at 520 ms and eight coins at 695 ms', () => {
    expect(landsAfter(1)).toBe(40 + TUMBLE_MS + SETTLE_MS)
    expect(landsAfter(1)).toBe(520)
    expect(landsAfter(8)).toBe(695)
  })

  it('never shows the final face before the die lands', () => {
    const random = seeded(7)
    for (const sides of [2, 4, 6, 8, 10, 12, 20]) {
      for (let face = 1; face <= sides; face++) {
        const decoys = decoysFor(sides, face, random)
        expect(decoys).toHaveLength(DECOYS)
        expect(decoys, `d${sides} showing ${face}`).not.toContain(face)
        for (const d of decoys) {
          expect(d).toBeGreaterThanOrEqual(1)
          expect(d).toBeLessThanOrEqual(sides)
        }
      }
    }
  })

  it('flips a coin to its other side for the whole tumble', () => {
    expect(decoysFor(2, 2, seeded(1))).toEqual([1, 1, 1, 1, 1])
  })

  it('repeats for the same seed, so a decoy decides nothing and needs no storing', () => {
    expect(decoysFor(20, 14, seeded(42))).toEqual(decoysFor(20, 14, seeded(42)))
  })
})
