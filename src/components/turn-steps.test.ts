// The movement bar's 5-foot steps (Turn.tsx, index.css): every step the same
// width, kept on one line by narrowing down to the smallest target WCAG 2.2
// allows, and wrapping only past that. The test environment can't lay out a
// page, so this reads the rules that decide it and works the layout out the
// way the grid does. A step that grew to fill its row drew a 40-foot Speed on
// a phone as seven steps and then one step as wide as the whole bar.

import { describe, expect, it } from 'vitest'
import css from '../index.css?raw'
import tokens from '../styles/tokens.css?raw'

const rule = (sheet: string, selector: string) => {
  const match = new RegExp(`\\n${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`).exec(sheet)
  if (!match) throw new Error(`no rule for ${selector}`)
  return match[1]
}
const px = (rem: string) => Number(rem) * 16

const steps = rule(css, '.turn-steps')
const columns = /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(([\d.]+)rem,\s*1fr\)\)/.exec(steps)
const gap = /--space-1:\s*([\d.]+)rem/.exec(tokens)
// The bar's width on a 375 px phone, measured on the sheet (2026-10-22).
const PHONE_BAR = 319
// How many steps one line holds, as auto-fit counts its columns.
const perLine = (width: number) => Math.floor((width + px(gap![1])) / (px(columns![1]) + px(gap![1])))

describe('the movement bar', () => {
  it('lays its steps on a grid of equal columns', () => {
    expect(steps).toMatch(/display:\s*grid/)
    expect(columns).not.toBeNull()
    expect(steps).toMatch(/gap:\s*var\(--space-1\)/)
    expect(gap).not.toBeNull()
  })

  it('keeps a 40-foot Speed (8 steps) on one line on a phone', () => expect(perLine(PHONE_BAR)).toBeGreaterThanOrEqual(8))

  it('never makes a step narrower than 24 px, WCAG 2.2’s smallest target (2.5.8)', () => expect(px(columns![1])).toBeGreaterThanOrEqual(24))

  it('never lets one step grow past its column', () => expect(rule(css, '.turn-step')).not.toMatch(/flex:/))
})
