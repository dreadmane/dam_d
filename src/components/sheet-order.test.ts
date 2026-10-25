import { describe, expect, it } from 'vitest'
import { parseOrder } from './sheet-order.ts'

describe('the sheet’s order as stored', () => {
  it('reads the names in the order arranged', () => {
    expect(parseOrder('["inventory","dice","rolls"]')).toEqual(['inventory', 'dice', 'rolls'])
  })

  it('reads nothing stored, or anything but a list of names, as nothing stored', () => {
    for (const raw of [null, '', 'not json', '{"inventory":0}', '"inventory"', '3', 'null']) expect(parseOrder(raw), String(raw)).toEqual([])
  })

  it('keeps each name once and drops what is not a name', () => {
    expect(parseOrder('["dice", 3, null, "dice", "inventory"]')).toEqual(['dice', 'inventory'])
  })
})
