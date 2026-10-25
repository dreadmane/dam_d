import { describe, expect, it } from 'vitest'
import { addedLines } from './lines.ts'

describe('the notifications’ words', () => {
  it('say what arrived in the Inventory, and how many', () => {
    expect(addedLines('Rope', 1)).toEqual(['Rope.'])
    expect(addedLines(' Candles ', 6)).toEqual(['Candles × 6.'])
    expect(addedLines('  ', 1)).toEqual(['An unnamed item.'])
  })
})
