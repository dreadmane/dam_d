import { describe, expect, it } from 'vitest'
import { stamp } from './stamp.ts'

// Local times, as the folder shows them.
const now = new Date(2026, 9, 12, 16, 30)

describe('a notification’s stamp', () => {
  it('is the clock on the day it fired', () => {
    expect(stamp(new Date(2026, 9, 12, 9, 4), now)).toBe('09:04')
    expect(stamp(new Date(2026, 9, 12, 0, 0), now)).toBe('00:00')
  })

  it('is the date on another day', () => {
    expect(stamp(new Date(2026, 9, 11, 23, 59), now)).toBe('11 Oct')
    expect(stamp(new Date(2026, 0, 1, 8, 0), now)).toBe('1 Jan')
  })

  it('adds the year in another year', () => {
    expect(stamp(new Date(2025, 11, 30, 12, 0), now)).toBe('30 Dec 2025')
  })
})
