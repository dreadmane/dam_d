// The thumb index and the running head in the stylesheet (index.css, its
// last block; the sheet concept, user 2026-10-23), held here: every rule
// the Journal's, so Classic is untouched; each tab a full touch target,
// fixed between the band and the foot and scrolling inside the fore-edge
// when the edge is short; the page's margin clear of the tabs' targets;
// the tab in view marked in forced colours by more than its paper; HP on
// the folded line a full touch target; and every rule on the band fenced
// from the windows that open inside it.

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules, cssRulesInMedia } from './css-rules.ts'

const JOURNAL = ":root[data-look='journal']"
const css = readAppCss()
const banner = css.indexOf('The thumb index and the running head')
const start = css.lastIndexOf('/*', banner)
const block = cssRules(css.slice(start))
const media = cssRulesInMedia(css.slice(start))
const bodyOf = (selector: string, rules = block) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')
const mediaOf = (selector: string) => media.filter((r) => r.selectors.includes(selector)).map((r) => r.media.join(' '))

describe('the thumb index and the running head', () => {
  it('are the stylesheet’s last block, after the shelf', () => {
    expect(banner).toBeGreaterThan(css.indexOf("The shelf: the Journal's other pages"))
    expect(css.indexOf('/* ======', banner)).toBe(-1)
    expect(block.length).toBeGreaterThan(20)
  })

  it('draw only in the Journal, so Classic is untouched', () => {
    expect(block.flatMap((r) => r.selectors).filter((s) => !s.startsWith(JOURNAL))).toEqual([])
  })

  it('fence every rule on the band from a window opened inside it', () => {
    const band = block.flatMap((r) => r.selectors).filter((s) => s.includes('.hud[data-collapsed]'))
    expect(band.length).toBeGreaterThan(5)
    expect(band.filter((s) => !s.includes(':not(dialog *)'))).toEqual([])
  })
})

describe('the thumb index', () => {
  it('stands fixed between the band and the foot as they are now', () => {
    const index = bodyOf(`${JOURNAL} .thumb-index`)
    expect(index).toMatch(/position:\s*fixed/)
    expect(index).toMatch(/top:\s*var\(--hud-height, 0px\)/)
    expect(index).toMatch(/bottom:\s*var\(--dock-height, 0px\)/)
    expect(index).toMatch(/pointer-events:\s*none/)
  })

  it('makes every tab a full touch target', () => {
    expect(bodyOf(JOURNAL)).toMatch(/--thumb-hit:\s*var\(--size-touch\)/)
    const tab = bodyOf(`${JOURNAL} .thumb-tab`)
    expect(tab).toMatch(/min-width:\s*var\(--thumb-hit\)/)
    expect(tab).toMatch(/min-height:\s*var\(--thumb-hit\)/)
    expect(tab).toMatch(/pointer-events:\s*auto/)
  })

  it('scrolls inside the fore-edge when the edge is short, never handing the scroll to the page', () => {
    const list = bodyOf(`${JOURNAL} .thumb-index ol`)
    expect(list).toMatch(/overflow-y:\s*auto/)
    expect(list).toMatch(/overscroll-behavior:\s*contain/)
    expect(list).toMatch(/scrollbar-width:\s*none/)
  })

  it('keeps the page’s words and controls clear of the tabs’ targets under the open book', () => {
    const page = `${JOURNAL} main.play:not(:has(> .journal-spread))`
    expect(bodyOf(page)).toMatch(/padding-right:\s*calc\(var\(--thumb-hit\) - var\(--thumb-strip\) \+ var\(--space-1\)\)/)
    expect(mediaOf(page)).toEqual(['@media (max-width: 63.99rem)'])
  })

  it('starts and ends the open band’s head of the page where the page does, under the open book', () => {
    const head = `${JOURNAL} .hud:not([data-collapsed]) .hud-identity:not(dialog *)`
    // The page's margins, less the band's own inset.
    expect(bodyOf(head)).toMatch(/margin-left:\s*calc\(max\(var\(--sheet-edge\), \(100vw - 40rem\) \/ 2 - var\(--space-3\)\) - max\(var\(--space-4\), \(100vw - 40rem\) \/ 2\)\)/)
    expect(bodyOf(head)).toMatch(/margin-right:\s*calc\(max\(var\(--thumb-strip\), \(100vw - 40rem\) \/ 2 - var\(--space-3\)\) - max\(var\(--space-4\), \(100vw - 40rem\) \/ 2\)\)/)
    expect(mediaOf(head)).toEqual(['@media (max-width: 63.99rem)'])
  })

  it('cuts its tabs from the label plates’ paper, which lifts off the leather in dark', () => {
    expect(bodyOf(`${JOURNAL} .thumb-tab`)).toMatch(/--ground:\s*var\(--color-journal-plate\)/)
    expect(bodyOf(`${JOURNAL} .thumb-tab::before`)).toMatch(/background-color:\s*var\(--color-journal-plate\)/)
  })

  it('on the open book stands on the spread’s leather, which widens to hold it', () => {
    expect(bodyOf(`${JOURNAL} .journal-spread`)).toMatch(/padding-right:\s*calc\(var\(--thumb-strip\) \+ var\(--space-1\)\)/)
    expect(mediaOf(`${JOURNAL} .journal-spread`)).toEqual(['@media (min-width: 64rem)'])
  })

  it('marks the tab in view with the system’s highlight in forced colours, not by its paper alone', () => {
    const current = `${JOURNAL} .thumb-tab[aria-current='location']`
    const forced = media.filter((r) => r.media.some((m) => m.includes('forced-colors: active')))
    expect(forced.some((r) => r.selectors.includes(current))).toBe(true)
    const forcedBodies = cssRules(css.slice(start).match(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/)![0].replace(/^@media[^{]*\{/, ''))
    expect(bodyOf(current, forcedBodies)).toMatch(/color:\s*HighlightText/)
    expect(bodyOf(`${current}::before`, forcedBodies)).toMatch(/background-color:\s*Highlight/)
    // Every tab keeps a ruled edge, which forced colours draw.
    expect(bodyOf(`${JOURNAL} .thumb-tab::before`)).toMatch(/border:\s*var\(--ink-thin\)/)
  })
})

describe('the running head', () => {
  it('sets the section in view in the body face’s italic on the leather', () => {
    const head = bodyOf(`${JOURNAL} .hud-running-head`)
    expect(head).toMatch(/font-family:\s*var\(--font-family-body\)/)
    expect(head).toMatch(/font-style:\s*italic/)
    expect(head).toMatch(/color:\s*var\(--color-journal-on-leather\)/)
    expect(bodyOf(`${JOURNAL} .hud-running-head::before`)).toMatch(/content:\s*'·'/)
  })

  it('keeps HP on the folded line a full touch target, over the line’s toggle', () => {
    const hp = bodyOf(`${JOURNAL} .hud[data-collapsed] .journal-vital:not(dialog *)`)
    expect(hp).toMatch(/min-height:\s*var\(--size-touch\)/)
    expect(hp).toMatch(/z-index:\s*1/)
    expect(bodyOf(`${JOURNAL} .hud[data-collapsed] .journal-vitals:not(dialog *)`)).toMatch(/display:\s*flex/)
    // Only HP shows there: the rest wait for the band.
    expect(bodyOf(`${JOURNAL} .hud[data-collapsed] .journal-vitals:not(dialog *) > :not([data-line])`)).toMatch(/display:\s*none/)
  })
})
