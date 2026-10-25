// Controls in the stylesheet: a disabled button must look disabled, not only
// refuse the tap, and in colours the contrast check covers. Disabled controls
// are exempt from WCAG contrast, but the label still has to be readable to
// say what the control would do. And a control lights under a pointer only
// where the pointer hovers: on a phone a tap leaves :hover set until the next
// tap elsewhere, so a bare hover keeps the control lit after it is used.

import { describe, expect, it } from 'vitest'
import tokens from '../../data/design/tokens.json'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules, cssRulesInMedia } from './css-rules.ts'

const rules = cssRules(readAppCss())
const declared = (selector: string, property: string) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body.match(new RegExp(`(?:^|;|\\s)${property}:\\s*var\\(--([a-z-]+)\\)`))?.[1])
    .find(Boolean)

const DISABLED = "button:disabled:not([aria-busy='true'])"
const pairs = (tokens as { $extensions: { dcc: { contrast: { pairs: { fg: string; bg: string }[] } } } }).$extensions.dcc.contrast.pairs
const tokenPath = (cssVar: string) => cssVar.replace(/^color-/, 'color.')

describe('disabled buttons', () => {
  it('change their fill and label, so a disabled primary does not look pressable', () => {
    const background = declared(DISABLED, 'background')
    const color = declared(DISABLED, 'color')
    expect(background).toBeDefined()
    expect(color).toBeDefined()
    expect(background).not.toBe(declared('.primary', 'background'))
  })

  it('use a foreground and background declared as a contrast pair', () => {
    const fg = tokenPath(declared(DISABLED, 'color')!)
    const bg = tokenPath(declared(DISABLED, 'background')!)
    expect(pairs.some((p) => p.fg === fg && p.bg === bg), `${fg} on ${bg}`).toBe(true)
  })

  it('leave a busy button (aria-busy) looking as it did, with a busy cursor', () => {
    expect(rules.some((r) => r.selectors.includes("button[aria-busy='true']") && /cursor:\s*progress/.test(r.body))).toBe(true)
  })
})

describe('hover', () => {
  const hovers = cssRulesInMedia(readAppCss()).filter((r) => r.selectors.some((s) => s.includes(':hover')))

  it('lights a control under a pointer only where the pointer hovers, since a hover sticks after a tap on a phone', () => {
    expect(hovers.length).toBeGreaterThan(0)
    const bare = hovers.filter((r) => !r.media.some((m) => m.includes('(hover: hover)')))
    expect(bare.map((r) => r.selectors.join(', '))).toEqual([])
  })

  it('reads the conditions round a rule, so a bare hover is caught', () => {
    const planted = cssRulesInMedia('@media (hover: hover) { .a:hover { color: red } } .b:hover { color: red } @media (min-width: 40rem) { .c:hover { color: red } }')
    expect(planted.map((r) => [r.selectors[0], r.media.some((m) => m.includes('(hover: hover)'))])).toEqual([
      ['.a:hover', true],
      ['.b:hover', false],
      ['.c:hover', false],
    ])
  })
})
