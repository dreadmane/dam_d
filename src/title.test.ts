import { describe, expect, it } from 'vitest'
import { titleOf } from './title.ts'

describe('page titles', () => {
  it('name the product alone on the list', () => {
    expect(titleOf()).toBe('dam’d')
  })

  it('lead with the character on its sheet, then its screens', () => {
    expect(titleOf('Lia')).toBe('Lia · dam’d')
    expect(titleOf('Lia', 'Print sheet')).toBe('Lia · Print sheet · dam’d')
  })

  it('leave out a character still loading', () => {
    expect(titleOf(null, 'Print sheet')).toBe('Print sheet · dam’d')
  })
})
