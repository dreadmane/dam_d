// The HUD's frame (design review, 2026-10-12), held in the stylesheet: the
// corner marks are drawn in the HUD's light brass on the bands and every
// window; nothing that wears them sets the background shorthand, which would
// erase them; the band meets the page with a brass rule; and the orange
// stripe marks only an arrival, never persistent chrome.

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules } from './css-rules.ts'

const rules = cssRules(readAppCss())
const ruleFor = (selector: string) => rules.filter((r) => r.selectors.includes(selector))

// What wears the frame: the band, the list's band, every window (a window's
// own class included), and the flashes.
const FRAMED = /^(dialog|\.hud|\.list-band|\.hud-frame|\.rule-card|\.row-menu|\.[a-z-]+-(dialog|window)|\.flash)$/

// The arrivals, which alone may carry the orange stripe: the flashes.
const ARRIVALS = ['.flash']

describe('the HUD frame', () => {
  it('draws its corner marks in the HUD brass, on the bands and on every window', () => {
    const frame = ruleFor('.hud-frame')
    expect(frame).toHaveLength(1)
    expect(frame[0].selectors).toContain('dialog')
    expect(frame[0].body).toMatch(/background-image:/)
    expect(frame[0].body).toMatch(/var\(--color-hud\)/)
  })

  it('is never erased by a background shorthand on what wears it', () => {
    const erasing = rules.filter((r) => r.selectors.some((s) => FRAMED.test(s)) && /(^|[;\s])background:/.test(r.body))
    expect(erasing.map((r) => r.selectors.join(', '))).toEqual([])
  })

  it('meets the page with a brass rule under the band', () => {
    expect(ruleFor('.hud').some((r) => /border-bottom:\s*1px solid var\(--color-border-control\)/.test(r.body))).toBe(true)
  })

  it('keeps the orange stripe for arrivals, off everything persistent', () => {
    const stripes = rules.filter(({ body }) => {
      const topBorder = /border-top(-color)?:[^;]*var\(--color-accent\)/.test(body)
      const thickTop = /border-top-width:/.test(body) && /border(-color)?:[^;]*var\(--color-accent\)/.test(body)
      const topInset = /box-shadow:[^;]*inset\s+0\s+[1-9][^;]*var\(--color-accent\)/.test(body)
      return topBorder || thickTop || topInset
    })
    expect(stripes.flatMap((r) => r.selectors).filter((s) => !ARRIVALS.includes(s))).toEqual([])
    // The test can see a stripe: a flash has one.
    expect(stripes.flatMap((r) => r.selectors)).toContain('.flash')
  })
})
