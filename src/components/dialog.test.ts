import { describe, expect, it, vi } from 'vitest'
import { notePressed, openAtTop, originFrom, outside, recentOpener } from './dialog.ts'

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

describe('a window opens at its top (#48)', () => {
  const box = (scrollTop: number) => ({ scrollTop, tabIndex: 0, focus: vi.fn() })

  it('takes focus itself and goes back to its top when its first control was below the fold', () => {
    const d = box(1243)
    openAtTop(d)
    expect(d.scrollTop).toBe(0)
    expect(d.tabIndex).toBe(-1)
    expect(d.focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('leaves a window at its top as the browser made it, focus on its first control', () => {
    const d = box(0)
    openAtTop(d)
    expect(d.focus).not.toHaveBeenCalled()
    expect(d.tabIndex).toBe(0)
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
