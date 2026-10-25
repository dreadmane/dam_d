import { describe, expect, it } from 'vitest'
import { parsePins, withPin } from './pins.ts'

describe('the pinned menus as stored', () => {
  it('reads each section the player pinned or sent back', () => {
    expect(parsePins('{"scratch-pad":true,"companions":false}')).toEqual({ 'scratch-pad': true, companions: false })
  })

  it('reads nothing stored, or anything but sections named with true or false, as no choice', () => {
    for (const raw of [null, '', 'not json', '["inventory"]', '"inventory"', '3', 'null']) expect(parsePins(raw), String(raw)).toEqual({})
    expect(parsePins('{"inventory":"yes","stats":1,"derived":true}')).toEqual({ derived: true })
  })
})

describe('a pin or an unpin', () => {
  it('keeps the choice where it differs from where the character has the section anyway', () => {
    expect(withPin({}, 'inventory', true, false)).toEqual({ inventory: true })
    expect(withPin({}, 'companions', false, true)).toEqual({ companions: false })
  })

  it('forgets it where it agrees, so pinning and unpinning again leaves every character as it was', () => {
    expect(withPin({ inventory: true, stats: true }, 'inventory', false, false)).toEqual({ stats: true })
    expect(withPin({ companions: false }, 'companions', true, true)).toEqual({})
  })
})
