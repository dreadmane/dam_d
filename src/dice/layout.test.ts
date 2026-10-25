import { describe, expect, it } from 'vitest'
import { layoutDice, rowsBudget } from './layout.ts'

// The tray's dice row is 342 px wide on a 390 px phone (the tray 12 px from
// each side, 12 px of padding), 312 px on a 360 px phone.
describe('layoutDice', () => {
  it('draws one die large and a pair a little smaller', () => {
    expect(layoutDice(1, 342)).toMatchObject({ size: 80, columns: 1, rows: 1, numeral: 34 })
    expect(layoutDice(2, 342)).toMatchObject({ size: 72, columns: 2, rows: 1 })
  })

  it('keeps three to six dice in one row', () => {
    expect(layoutDice(4, 342)).toMatchObject({ size: 48, columns: 4, rows: 1 })
    expect(layoutDice(6, 342)).toMatchObject({ size: 48, columns: 6, rows: 1 })
  })

  it('steps the size down before adding a row on a narrower phone', () => {
    expect(layoutDice(6, 312)).toMatchObject({ size: 44, columns: 6, rows: 1 })
  })

  it('balances two rows: eight d2s are four and four', () => {
    expect(layoutDice(8, 342)).toMatchObject({ size: 44, columns: 4, rows: 2 })
  })

  it('puts eleven advancement checks in rows of six and five', () => {
    expect(layoutDice(11, 342)).toMatchObject({ size: 36, columns: 6, rows: 2 })
  })

  it('steps down to fit a short screen’s height', () => {
    expect(layoutDice(1, 342, 60).size).toBeLessThanOrEqual(60)
    expect(layoutDice(8, 342, 80).size).toBe(36)
  })

  it('never sets a numeral under 13 px, however many dice', () => {
    for (const count of [1, 2, 5, 9, 14, 20, 40]) {
      expect(layoutDice(count, 312).numeral, String(count)).toBeGreaterThanOrEqual(13)
    }
  })

  // Found by the walk (2026-10-14): a stats roll with three 1s rerolled ran
  // its eighth die into the tray's edge, each "rerolled" being wider than its die.
  it('makes every column as wide as the widest word under a die, and every row its line taller', () => {
    const rerolled = { width: 52, height: 22 }
    const stats = layoutDice(8, 342, 116, rerolled)
    expect(stats.cell).toBe(52)
    expect(stats.columns * stats.cell + (stats.columns - 1) * stats.gap).toBeLessThanOrEqual(342)
    expect(stats.rows * (stats.size + 22) + (stats.rows - 1) * stats.gap).toBeLessThanOrEqual(116)
    expect(layoutDice(6, 342, 116, rerolled)).toMatchObject({ size: 36, columns: 6, rows: 1 })
  })

  it('leaves the pair under Advantage as it was: kept is narrower than the die', () => {
    expect(layoutDice(2, 342, 116, { width: 28, height: 22 })).toMatchObject({ size: 72, columns: 2, rows: 1, cell: 72 })
  })

  it('wraps past sixteen dice at the smallest size rather than shrinking further', () => {
    expect(layoutDice(30, 342)).toMatchObject({ size: 32, rows: 4 })
  })

  // The tray's other parts as the Phosphor skin drew them on a 390 x 844
  // phone, measured (fix/dice-tray-fit, 2026-10-16), the tallest yet: 26 px of padding and frame, a
  // one-line name and a two-line line, each with its gap, 102.7 px in all.
  it('gives the rows what the tray’s other parts leave of 200 px, or of two fifths of a short screen', () => {
    expect(rowsBudget(844, 102.7)).toBeCloseTo(97.3)
    expect(rowsBudget(390, 80)).toBeCloseTo(76)
  })

  // The dice total concept (user 2026-10-23): a natural's words grow the
  // tray by their line, as the concept drew it, rather than shrink the dice
  // (an Advantage pair keeping a 20 stayed at 72 px, not 48); but never past
  // two fifths of a short screen.
  it('lets a natural’s words grow the tray past 200 px, never past two fifths of the screen', () => {
    expect(rowsBudget(844, 88, 28)).toBeCloseTo(112)
    expect(layoutDice(2, 228, rowsBudget(844, 88, 28), { width: 28, height: 23 }, true).size).toBe(72)
    // Counted against the 200 px, it would have stepped the pair down.
    expect(layoutDice(2, 228, rowsBudget(844, 88 + 28), { width: 28, height: 23 }, true).size).toBe(48)
    expect(rowsBudget(390, 80, 28)).toBeCloseTo(48)
    expect(rowsBudget(390, 80, 28)).toBeLessThan(rowsBudget(390, 80))
  })

  // Eleven stats dice, each column as wide as "rerolled" was in the
  // Phosphor skin's face (58 px):
  // five to a row, so three rows, past the budget, which the tray grows to
  // hold (index.css); and six debuffs' names and totals, which leave the rows
  // no room at all, still draw every die.
  it('draws every die at the smallest size when no size fits the budget', () => {
    expect(layoutDice(11, 340, 97.3, { width: 58, height: 18 })).toMatchObject({ size: 32, columns: 4, rows: 3 })
    expect(layoutDice(6, 340, rowsBudget(844, 213.1))).toMatchObject({ size: 32, columns: 6, rows: 1 })
  })

  // Beside the seal (the dice total concept, user 2026-10-23) the dice row
  // is the tray's left column: 340 px less the seal's 96 and its 16 px of
  // margin, 228 px on a 390 px phone and 198 px on a 360 px one.
  describe('beside the seal', () => {
    const PHONES = [228, 198]
    const budget = rowsBudget(844, 84)

    it('sets five and six dice in two rows of three at 48 px, balanced', () => {
      for (const width of PHONES) {
        expect(layoutDice(5, width, budget, null, true), String(width)).toMatchObject({ size: 48, columns: 3, rows: 2 })
        expect(layoutDice(6, width, budget, null, true), String(width)).toMatchObject({ size: 48, columns: 3, rows: 2 })
      }
      // Without the seal, today's rule: one row, stepped down to fit.
      expect(layoutDice(6, 228, budget)).toMatchObject({ rows: 1 })
    })

    it('keeps the two rows on a wide window, where one row would fit', () => {
      expect(layoutDice(6, 480, budget, null, true)).toMatchObject({ size: 48, columns: 3, rows: 2 })
    })

    it('leaves every other count to today’s rule, given the same width', () => {
      for (const width of [...PHONES, 342]) {
        for (const count of [1, 2, 3, 4, 7, 8, 9, 10, 11, 16, 20]) {
          expect(layoutDice(count, width, budget, null, true), `${count} at ${width}`).toEqual(layoutDice(count, width, budget))
        }
      }
    })

    it('draws nine or ten dice at 36 px and eleven to sixteen at 32 in the room the seal leaves (B’s fixer, 2026-10-23)', () => {
      expect(layoutDice(9, 228, budget, null, true)).toMatchObject({ size: 36, rows: 2 })
      expect(layoutDice(10, 228, budget, null, true)).toMatchObject({ size: 36, rows: 2 })
      expect(layoutDice(11, 228, budget, null, true)).toMatchObject({ size: 32, rows: 2 })
      expect(layoutDice(16, 228, budget, null, true)).toMatchObject({ size: 32, rows: 3 })
    })

    it('steps five down rather than draw it past a short screen’s budget', () => {
      expect(layoutDice(5, 228, 80, null, true).size).toBeLessThan(48)
    })

    // Found by the review (2026-10-23): on a landscape phone, 844 x 390 or
    // 667 x 375, the dice row beside the seal is 342 px wide and the rows
    // have about 69 px. Two rows of 48 (104 px) do not fit; one row of six
    // at 48 does (328 px), and the two rows had forced them down to 32.
    it('lets two rows give way to one on a short screen, at the size one row fits', () => {
      for (const count of [5, 6]) {
        expect(layoutDice(count, 342, 69, null, true), String(count)).toMatchObject({ size: 48, columns: count, rows: 1 })
        expect(layoutDice(count, 342, 69, null, true), String(count)).toEqual(layoutDice(count, 342, 69))
      }
    })

    // Neither arrangement fits at 48: the dice keep the largest size at
    // which either does, two rows of three where both would.
    it('keeps the largest size either arrangement fits, two rows of three first', () => {
      expect(layoutDice(5, 228, 80, null, true)).toMatchObject({ size: 36, columns: 3, rows: 2 })
      expect(layoutDice(6, 198, 80, null, true)).toMatchObject({ size: 36, columns: 3, rows: 2 })
      // Two rows of 32 are 70 px: under that, one row of 32, which fits 228.
      expect(layoutDice(6, 228, 70, null, true)).toMatchObject({ size: 32, columns: 3, rows: 2 })
      expect(layoutDice(6, 228, 60, null, true)).toMatchObject({ size: 32, columns: 6, rows: 1 })
    })

    it('draws the fewest rows at the smallest size when nothing fits the height', () => {
      expect(layoutDice(6, 342, 20, null, true)).toMatchObject({ size: 32, columns: 6, rows: 1 })
      expect(layoutDice(6, 198, 20, null, true)).toMatchObject({ size: 32, columns: 3, rows: 2 })
    })
  })
})
