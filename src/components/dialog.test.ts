import { describe, expect, it } from 'vitest'
import { notePressed, originFrom, outside, recentOpener } from './dialog.ts'

// The window's own box, as a 390 px phone centres it.
const WINDOW = { x: 10, y: 150, width: 370, height: 400 }

describe('a window grows from the control that opened it', () => {
  it('takes its transform origin from the control’s centre, measured from the window’s top left', () => {
    // A control near the top left, above and left of the window.
    expect(originFrom({ x: 16, y: 300, width: 70, height: 84 }, WINDOW)).toBe('41px 192px')
  })

  it('reaches outside the window’s box when the control is outside it', () => {
    // The Health Bar in the band, above the window.
    expect(originFrom({ x: 80, y: 40, width: 260, height: 44 }, WINDOW)).toBe('200px -88px')
  })
})

describe('the opener', () => {
  const slot = { x: 16, y: 300, width: 70, height: 84 }

  it('is the control pressed a moment ago', () => {
    notePressed(slot, 1000)
    expect(recentOpener(1150)).toEqual(slot)
  })

  it('is forgotten after a second, so a window opened later grows from its middle', () => {
    notePressed(slot, 1000)
    expect(recentOpener(2001)).toBeNull()
  })
})

describe('a tap outside the window', () => {
  it('is a point beyond any edge of its box: the backdrop', () => {
    expect(outside(WINDOW, 5, 300)).toBe(true)
    expect(outside(WINDOW, 385, 300)).toBe(true)
    expect(outside(WINDOW, 200, 140)).toBe(true)
    expect(outside(WINDOW, 200, 560)).toBe(true)
  })

  it('is not a tap on the window’s own padding, which hits the dialog element too', () => {
    expect(outside(WINDOW, 12, 152)).toBe(false)
    expect(outside(WINDOW, 380, 550)).toBe(false)
  })
})
