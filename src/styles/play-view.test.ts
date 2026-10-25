// The sheet in the stylesheet (A7, C1, C3, C6): the band's words in the
// display face, one rhythm between sections, a rule's name and a window's
// other actions as the polish left them, and the sheet and its menus (user,
// 2026-10-13): PIN, a menu's window, MENU on the collapsed band, and
// arranging the sheet.

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules } from './css-rules.ts'

const rules = cssRules(readAppCss())
const bodyOf = (selector: string) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')

describe('the band and the page', () => {
  it('says the band’s controls as words in the type style’s chrome face, else the body face', () => {
    const word = bodyOf('.top-bar .chrome-word')
    expect(word).toMatch(/font-family:\s*var\(--chrome-font-family, var\(--font-family-body\)\)/)
    expect(word).toMatch(/text-transform:\s*uppercase/)
    expect(word).toMatch(/min-height:\s*var\(--size-touch\)/)
  })

  it('folds nothing on the sheet any more', () => {
    expect(rules.filter((r) => r.selectors.some((s) => /\.fold\b|\.fold-/.test(s)))).toEqual([])
  })

  it('keeps one gap between sections', () => {
    expect(bodyOf('.play > section + section')).toMatch(/margin-top:\s*var\(--space-6\)/)
    expect(bodyOf('.play > section > h2:first-child')).toMatch(/margin-top:\s*0/)
  })
})

describe('the polish (branch 4)', () => {
  it('wraps a rule’s name to two lines, its ⓘ the one sign it opens (C3)', () => {
    const label = bodyOf('.rule-name-label')
    expect(label).toMatch(/-webkit-line-clamp:\s*2/)
    expect(label).not.toMatch(/text-decoration|nowrap/)
  })

  it('puts a window’s other actions on a line of their own (C6)', () => {
    expect(bodyOf('.dialog-aside')).toMatch(/flex-basis:\s*100%/)
  })
})

describe('the sheet and its menus', () => {
  it('keeps PIN a full touch target, in the band’s words’ face', () => {
    const pin = bodyOf('.pin-button')
    expect(pin).toMatch(/min-height:\s*var\(--size-touch\)/)
    expect(pin).toMatch(/font-family:\s*var\(--chrome-font-family, var\(--font-family-body\)\)/)
    expect(pin).toMatch(/text-transform:\s*uppercase/)
  })

  it('leaves the band sharp around a menu’s window, the sheet hidden under it', () => {
    expect(bodyOf('.menu-window::backdrop')).toMatch(/backdrop-filter:\s*none/)
    expect(bodyOf('body[data-menu-open] main')).toMatch(/visibility:\s*hidden/)
    expect(bodyOf('.menu-window')).toMatch(/visibility:\s*visible/)
    expect(bodyOf('.menu-window')).toMatch(/overscroll-behavior:\s*contain/)
  })

  it('keeps MENU on the collapsed band, a word over the toggle that takes the rest of the line', () => {
    const word = bodyOf('.hud .hud-line-menu')
    expect(word).toMatch(/text-transform:\s*uppercase/)
    expect(word).toMatch(/min-height:\s*var\(--size-touch\)/)
    expect(word).toMatch(/position:\s*relative/)
    expect(word).toMatch(/z-index:\s*1/)
    expect(bodyOf('.hud[data-collapsed] .hud-inner')).toMatch(/grid-template-columns:\s*minmax\(6rem, 1fr\) auto/)
  })
})

// A bug the Phosphor mockups' QA found in this look (2026-10-15), held here
// so it cannot come back: a rule that holds only inside an @media block is
// read from that block.
describe('forced colours and the focus ring', () => {
  const css = readAppCss().replace(/\/\*[\s\S]*?\*\//g, '')
  const inMedia = (condition: RegExp, selector: string) => {
    const bodies: string[] = []
    for (const m of css.matchAll(new RegExp(`@media\\s*${condition.source}\\s*\\{`, 'g'))) {
      let depth = 1
      let i = m.index + m[0].length
      const start = i
      while (depth > 0 && i < css.length) {
        if (css[i] === '{') depth++
        else if (css[i] === '}') depth--
        i++
      }
      for (const r of cssRules(css.slice(start, i - 1))) if (r.selectors.includes(selector)) bodies.push(r.body)
    }
    return bodies.join(';')
  }

  it('keeps the arrow after the collapsed name a triangle under forced colours', () => {
    const arrow = inMedia(/\(forced-colors: active\)/, '.hud[data-collapsed] .hud-identity::after')
    expect(arrow).toMatch(/forced-color-adjust:\s*none/)
    expect(arrow).toMatch(/border-top-color:\s*CanvasText/)
  })

  it('draws the focus ring 2 px out and 2 px wide', () => {
    expect(bodyOf(':focus-visible')).toMatch(/outline:\s*2px solid/)
    expect(bodyOf(':focus-visible')).toMatch(/outline-offset:\s*2px/)
  })
})

describe('arranging the sheet', () => {
  it('gives each section two moves, each a full touch target', () => {
    expect(bodyOf('.arrange-row')).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) var\(--size-touch\) var\(--size-touch\)/)
    expect(bodyOf('.arrange-row .arrange-move')).toMatch(/width:\s*var\(--size-touch\)/)
  })

  it('lights the section last moved in the HUD’s brass, and DONE in the accent', () => {
    expect(bodyOf('.arrange-row[data-moved]')).toMatch(/inset 3px 0 0 var\(--color-hud\)/)
    expect(bodyOf('.arrange-button[data-arranging]')).toMatch(/color:\s*var\(--color-accent\)/)
  })
})

// Spell slots in lapis, their own colour (user, 2026-10-21): the Spells
// section's boxes, Pact Magic's, and the turn's dots, filled while left and
// outlined once spent. A class resource's use is gold leaf (2026-10-21).
describe('spell slots and class resources', () => {
  it('are lapis in the Spells section, filled and spent', () => {
    expect(bodyOf('.spell-slot-box')).toMatch(/background:\s*var\(--color-spell-slot\)/)
    expect(bodyOf('.spell-slot-box')).toMatch(/border-color:\s*var\(--color-spell-slot\)/)
    expect(bodyOf('.spell-slot-box[data-spent]')).toMatch(/border-color:\s*var\(--color-spell-slot\)/)
  })

  it('are lapis on the turn', () => {
    expect(bodyOf('.turn-slot')).toMatch(/background-color:\s*var\(--color-spell-slot\)/)
    expect(bodyOf('.turn-slot[data-spent]')).toMatch(/var\(--color-spell-slot\)/)
  })

  it('give a class resource gold leaf, filled and spent', () => {
    expect(bodyOf('.resource-box')).toMatch(/background:\s*var\(--color-class-resource\)/)
    expect(bodyOf('.resource-box')).toMatch(/border:\s*2px solid var\(--color-class-resource\)/)
    expect(bodyOf('.resource-box[data-spent]')).toMatch(/border-color:\s*var\(--color-class-resource\)/)
  })
})
