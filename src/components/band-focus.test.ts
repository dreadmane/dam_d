import { describe, expect, it } from 'vitest'
import { holdsBandOpen } from './band-focus.ts'

// An element that matches the selectors it is given by its own tag, enough
// for the list of controls band-focus.ts tests against.
const element = (...is: string[]) => ({ matches: (selectors: string) => selectors.split(',').some((s) => is.includes(s.trim())) }) as unknown as Element

describe('what holds the band open', () => {
  it('is a control the reader is using: a button, a link, a field', () => {
    for (const control of [element('button'), element('a[href]'), element('input'), element('select'), element('textarea')]) expect(holdsBandOpen(control, [])).toBe(true)
  })

  it('is never the screen’s heading, focused only so a screen reader hears the new screen', () => {
    expect(holdsBandOpen(element('h1'), [])).toBe(false)
  })

  it('is never the band’s own toggle or the folded line’s MENU', () => {
    const toggle = element('button')
    const menu = element('button')
    expect(holdsBandOpen(toggle, [toggle, menu])).toBe(false)
    expect(holdsBandOpen(menu, [toggle, null])).toBe(true)
    expect(holdsBandOpen(menu, [toggle, menu])).toBe(false)
  })
})
