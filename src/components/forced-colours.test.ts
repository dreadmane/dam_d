// Forced colours (Windows high contrast) replace every colour with the
// system's and drop painted backgrounds, so whatever a control shows with
// paint alone disappears. Three did (found 2026-10-23, after PR #31):
//   - the movement bar's steps, drawn as background gradients, vanished;
//   - In combat and Exploring showed which was chosen by its fill alone;
//   - the shelf's ⋯ on a roster cover has no edge, where Classic's has one.
// The test environment can't render forced colours, so this reads the rules
// the stylesheet gives them; the walk (notes/2026-10-23-shelf-checks) looks.

import { describe, expect, it } from 'vitest'
import css from '../index.css?raw'

// Every rule inside the stylesheet's forced-colours blocks, as one text.
const forced = [...css.matchAll(/@media \(forced-colors: active\) \{([\s\S]*?)\n\}/g)].map((m) => m[1]).join('\n')
const rule = (selector: string) => {
  const at = forced.indexOf(`${selector} {`)
  if (at < 0) return null
  return forced.slice(at, forced.indexOf('}', at))
}

describe('in forced colours', () => {
  it('the movement steps draw in system colours', () => {
    expect(rule('.turn-step')).toMatch(/forced-color-adjust:\s*none/)
    expect(rule('.turn-step')).toMatch(/ButtonText/)
    expect(rule(".turn-step[data-used]")).toMatch(/Canvas\b/)
  })

  it('the chosen one of In combat and Exploring is highlighted', () => {
    const pressed = rule(".turn-mode button[aria-pressed='true']")
    expect(pressed).toMatch(/forced-color-adjust:\s*none/)
    expect(pressed).toMatch(/background-color:\s*Highlight/)
    expect(pressed).toMatch(/color:\s*HighlightText/)
  })

  it('the shelf’s ⋯ on a cover has an edge', () => {
    expect(rule(":root[data-look='journal'] .roster .row-menu-button")).toMatch(/border:\s*1px solid ButtonText/)
  })
})
