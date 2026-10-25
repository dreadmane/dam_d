// The dice tray in the stylesheet (the dice roll, approved by the user
// 2026-10-14): a display that takes no taps, at the top of the screen over
// the window on top and clear of a notch, gone with a closing window, its
// panel keeping the frame's corner marks, and moved by transform and opacity
// only, run once, so it never reflows the page and the reduced-motion rules
// (windows.test.ts) take all of it away.

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { TRAY_SHARE } from '../dice/layout.ts'
import { SETTLE_MS, TUMBLE_MS } from '../dice/plan.ts'
import { DEFAULT_SETTINGS, diceStyle } from '../settings.ts'
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
const trayRules = rules.filter((r) => r.selectors.some((s) => /\.dice-|\.die\b|\.die-/.test(s)))

describe('the dice tray', () => {
  it('takes no taps, so the control under it does its own job', () => {
    expect(bodyOf('.dice-tray')).toMatch(/pointer-events:\s*none/)
  })

  it('shows at the top of the screen over a window, clear of a notch', () => {
    const top = bodyOf(".dice-tray[data-place='window']")
    expect(top).toMatch(/position:\s*fixed/)
    expect(top).toMatch(/top:\s*calc\([^;]*env\(safe-area-inset-top/)
  })

  // Found by the walk (2026-10-14): the band's justify-self: center shrank a
  // fixed tray to its dice.
  it('spans the screen over a window, as it does under the band', () => {
    expect(bodyOf(".dice-tray[data-place='window']")).toMatch(/justify-self:\s*stretch/)
  })

  it('goes with a window as it closes', () => {
    expect(bodyOf('dialog[data-closing] .dice-tray')).toMatch(/visibility:\s*hidden/)
  })

  // Found on 2026-10-16 (fix/dice-tray-fit): held to 200 px, a tray whose
  // dice could not fit at the smallest size cut off its line, as a stats
  // roll's third row did. The dice are sized to fit 200 px
  // (src/dice/layout.ts); the stylesheet holds the tray only to two fifths of
  // the screen, and nothing else sets its height.
  it('grows for dice that cannot fit, never past two fifths of the screen', () => {
    expect(bodyOf('.dice-tray')).toMatch(new RegExp(`max-height:\\s*${TRAY_SHARE * 100}vh\\s*(;|$)`))
    const sized = rules.filter((r) => r.selectors.some((s) => /\.dice-tray(\[[^\]]*\])*$/.test(s)) && /(^|[;\s])(min-|max-)?height\s*:/.test(r.body))
    expect(sized.map((r) => r.selectors.join(', '))).toEqual(['.dice-tray'])
  })

  it('paints its panel with background-color, keeping the frame’s corner marks', () => {
    // The background shorthand would reset .hud-frame's background-image,
    // which draws the marks.
    expect(bodyOf('.dice-tray')).toMatch(/background-color:/)
    expect(trayRules.filter((r) => /(^|[;\s])background\s*:/.test(r.body)).map((r) => r.selectors.join(', '))).toEqual([])
  })

  it('moves the tray and its dice by transform and opacity only', () => {
    const used = new Set(trayRules.flatMap((r) => [...r.body.matchAll(/animation:\s*([\w-]+)/g)].map((m) => m[1])))
    expect([...used].sort()).toEqual(['die-catch', 'die-hide', 'die-land', 'die-mark', 'die-show', 'die-tumble', 'seal-crack', 'seal-follow', 'seal-light', 'seal-press', 'seal-rays', 'seal-tip', 'tray-grow', 'tray-shrink'])
    for (const name of used) {
      const steps = keyframes.get(name)
      expect(steps, name).toBeDefined()
      const properties = [...(steps ?? '').matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1])
      expect(properties.filter((p) => p !== 'transform' && p !== 'opacity'), name).toEqual([])
    }
  })

  // --last is the last die's landing, which DiceTray.tsx reckons from
  // plan.ts (landsAfter): the stylesheet's tumble must be plan.ts's, or the
  // kept mark and the seal would wait for a landing the dice don't keep.
  it('waits for the last die to land: the kept mark, then the seal', () => {
    expect(bodyOf('.die-cell[data-rolling] .die-kept')).toMatch(/animation:\s*die-mark\s+\d+ms\s+[\w-]+\s+var\(--last\)/)
    const root = rules.find((r) => r.selectors.includes(':root') && r.body.includes('--dice-tumble'))
    expect(root?.body).toMatch(new RegExp(`--dice-tumble:\\s*${TUMBLE_MS}ms`))
    expect(bodyOf('.die-cell[data-rolling] .die')).toMatch(new RegExp(`animation:\\s*die-tumble calc\\(var\\(--dice-tumble\\) \\+ ${SETTLE_MS}ms\\)`))
  })

  it('runs every animation once', () => {
    expect(trayRules.filter((r) => /animation[^;]*infinite/.test(r.body)).map((r) => r.selectors.join(', '))).toEqual([])
  })
})

// The dice's look in Settings (feat/dice-settings): the stylesheet holds the
// default die's, and a die takes its colours only from the --dice-*
// properties Settings writes, so a choice changes every die and no rule.
describe('the dice’s look', () => {
  const declared = (body: string) => Object.fromEntries([...body.matchAll(/(--dice-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))

  it('is the default die’s in the stylesheet: Slate, light numerals, the headings’ face', () => {
    const root = rules.find((r) => r.selectors.includes(':root') && r.body.includes('--dice-fill'))
    const own = Object.entries(declared(root?.body ?? '')).filter(([name]) => name !== '--dice-tumble')
    expect(Object.fromEntries(own)).toEqual(diceStyle(DEFAULT_SETTINGS.dice))
  })

  it('colours a die only from the --dice-* properties, and its light in black and white', () => {
    const inDie = /\.die(-body|-veins|-light|-creases|-glint|-cut|-face|-decoy)\b|\.die text/
    const colours = rules
      .filter((r) => r.selectors.some((s) => inDie.test(s)))
      .flatMap((r) => [...r.body.matchAll(/(?:^|[;\s])(fill|stroke|color|flood-color)\s*:\s*([^;]+)/g)].map((m) => `${r.selectors.join(', ')} ${m[1]}: ${m[2].trim()}`))
    expect(colours.length).toBeGreaterThanOrEqual(6)
    expect(colours.filter((c) => !/: (var\(--dice-[\w-]+\)|black|white|none)$/.test(c))).toEqual([])
  })

  it('shows Marble’s veins only on a die that asks for them', () => {
    expect(bodyOf('.die-veins')).toMatch(/display:\s*var\(--dice-veins\)/)
  })

  // An svg left out of the layout keeps its filters and masks for the dice
  // to use; display: none would lose them in some browsers.
  it('keeps the veins’ definitions in the page, never laid out and never display: none', () => {
    const defs = bodyOf('.dice-defs')
    expect(defs).toMatch(/position:\s*absolute/)
    expect(defs).toMatch(/width:\s*0/)
    expect(defs).not.toMatch(/display:\s*none/)
  })
})
