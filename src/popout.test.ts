import { describe, expect, it } from 'vitest'
import { canPopOut, POPOUT_NAME, popOutFeatures } from './popout.ts'

// A device that has a mouse, or not.
const mouse = (has: boolean) => (query: string) => query === '(hover: hover) and (pointer: fine)' && has

describe('Pop out', () => {
  it('is offered on a desktop with a mouse', () => {
    expect(canPopOut('', mouse(true))).toBe(true)
  })

  it('is not offered on a phone', () => {
    expect(canPopOut('', mouse(false))).toBe(false)
  })

  it('is not offered in the pop-out itself', () => {
    expect(canPopOut(POPOUT_NAME, mouse(true))).toBe(false)
  })

  it('opens a pop-up a phone wide and the screen tall', () => {
    expect(popOutFeatures({ availHeight: 1032 })).toBe('popup,width=360,height=1032,left=0,top=0')
  })
})
