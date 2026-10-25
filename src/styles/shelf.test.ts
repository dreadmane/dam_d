// The shelf (index.css, the Journal's other pages; user 2026-10-23), held in
// the stylesheet: every rule of it is the Journal's, so Classic is
// untouched; Classic still joins a roster row's two spans with its dot; a
// window keeps no filter or transform of its own, so the dice tray rolled
// from inside it keeps its fixed place on the screen; the band's Levels
// link is a full touch target; and only the portraits and the tape sit
// askew (the slips lie square, user's lows of 2026-10-23).

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules } from './css-rules.ts'

const JOURNAL = ":root[data-look='journal']"
const css = readAppCss()
const banner = css.indexOf("The shelf: the Journal's other pages")
const shelf = cssRules(css.slice(css.lastIndexOf('/*', banner)))
const all = cssRules(css)
const bodyOf = (selector: string) =>
  all
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')

describe('the shelf', () => {
  it('is found in the stylesheet', () => {
    expect(banner).toBeGreaterThan(0)
    expect(shelf.length).toBeGreaterThan(50)
  })

  it('draws only in the Journal, so Classic is untouched', () => {
    const outside = shelf.flatMap((r) => r.selectors).filter((s) => !s.startsWith(JOURNAL))
    expect(outside).toEqual([])
  })

  it('leaves Classic’s roster row one line, joined by its dot, and parts it in the Journal', () => {
    expect(bodyOf('.roster-saved::before')).toMatch(/content:\s*'· '/)
    expect(bodyOf(`${JOURNAL} .roster-saved::before`)).toMatch(/content:\s*none/)
  })

  it('puts no filter or transform on a window, which would carry the dice tray with it', () => {
    const onWindow = all.filter((r) => r.selectors.some((s) => s.startsWith(JOURNAL) && /(^|\s)dialog(\[[^\]]*\])*$/.test(s)))
    expect(onWindow.length).toBeGreaterThan(0)
    const moving = onWindow.filter((r) => /(^|[;\s])(filter|transform|translate|rotate|scale|perspective|contain|will-change|backdrop-filter):/.test(r.body))
    expect(moving.map((r) => r.selectors.join(', '))).toEqual([])
  })

  it('makes the band’s Levels link a full touch target', () => {
    expect(bodyOf(`${JOURNAL} .hud .band-links a`)).toMatch(/min-height:\s*var\(--size-touch\)/)
  })

  it('sets only the portraits and the tape askew', () => {
    const askew = shelf.filter((r) => /(^|[;\s])rotate:/.test(r.body)).flatMap((r) => r.selectors)
    expect(askew.length).toBeGreaterThan(0)
    expect(askew.filter((s) => !/\.portrait$|dialog::before$/.test(s))).toEqual([])
  })
})
