// Notifications in the stylesheet (A1, B3, B4): every kicker in the System's
// green, the gold tier in gold, and every arrival's motion run once and made
// of transform and opacity only, so nothing blinks (WCAG 2.2.2) and nothing
// moves the page's layout. The reduced-motion rules (windows.test.ts) take
// all of it away.

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules } from './css-rules.ts'

const css = readAppCss()
const rules = cssRules(css)
const bodyOf = (selector: string) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')
// Each @keyframes block's steps, by name.
const keyframes = new Map(
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map((m) => [m[1], m[2]]),
)

describe('notifications', () => {
  // Found at PR #83 (2026-10-13): a flash arriving while a window was open sat
  // behind it. The window on top shows them at its foot (Window.tsx), in view
  // as it scrolls, and takes no room while there is none.
  it('show at the foot of the window on top, in view as it scrolls', () => {
    const inWindow = bodyOf(".flash-stack[data-place='window']")
    expect(inWindow).toMatch(/position:\s*sticky/)
    expect(inWindow).toMatch(/bottom:\s*0/)
    expect(bodyOf(".flash-stack[data-place='window']:empty")).toMatch(/margin-top:\s*0/)
  })

  it('set every kicker in the System’s green', () => {
    for (const s of ['.flash-body .flash-kicker', '.folder-kicker']) {
      expect(bodyOf(s), s).toMatch(/color:\s*var\(--color-system\)/)
    }
  })

  it('frame the gold tier in gold, with its glow', () => {
    const gold = bodyOf(".flash[data-tier='gold']")
    expect(gold).toMatch(/var\(--color-tier-gold\)/)
    expect(gold).toMatch(/box-shadow:\s*var\(--gold-glow\)/)
  })

  it('never animate without end', () => {
    const endless = rules.filter((r) => /animation[^;]*infinite/.test(r.body))
    expect(endless.map((r) => r.selectors.join(', '))).toEqual([])
  })

  it('move an arrival by transform and opacity only, never by its size', () => {
    for (const name of ['flash-in', 'band-in', 'pulse-once']) {
      const steps = keyframes.get(name)
      expect(steps, name).toBeDefined()
      const properties = [...(steps ?? '').matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
      expect(properties.filter((p) => p !== 'transform' && p !== 'opacity'), name).toEqual([])
    }
  })

  it('play the arrivals', () => {
    expect(bodyOf('.flash[data-opening]')).toMatch(/animation:\s*flash-in/)
    expect(bodyOf('.hud[data-arriving]')).toMatch(/animation:\s*band-in 300ms/)
    expect(bodyOf('.folder-badge[data-pulse]')).toMatch(/animation:\s*pulse-once/)
  })

  it('keep the folder and a flash’s dismiss a full touch target wide', () => {
    for (const s of ['.folder-button', '.flash-dismiss']) expect(bodyOf(s), s).toMatch(/width:\s*var\(--size-touch\)/)
  })
})
