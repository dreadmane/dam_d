import { describe, expect, it } from 'vitest'
import { itemReadout } from './readout.ts'

describe('an item’s readout', () => {
  it('says how many, what each weighs and its tags, each a sentence', () => {
    expect(itemReadout({ id: 'a', name: 'Arrows', description: '', quantity: 20, tags: ['ammunition', 'quiver'], weight: 0.05 })).toEqual({
      name: 'Arrows',
      lines: ['Quantity: 20.', 'Weight: 0.05 lb each.', 'Tags: ammunition, quiver.'],
    })
  })

  it('leaves out what is not recorded, and names an unnamed item', () => {
    expect(itemReadout({ id: 'a', name: '', description: '', quantity: 1, tags: [] })).toEqual({ name: 'Unnamed item', lines: [] })
    expect(itemReadout({ id: 'a', name: 'Rope', description: '', quantity: 1, tags: [], weight: 5 }).lines).toEqual(['Weight: 5 lb.'])
  })
})
