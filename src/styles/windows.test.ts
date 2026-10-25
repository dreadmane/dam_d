// Windows in the stylesheet (A2): each starts from the body's type wherever it
// is opened from, so a rule card opened from a heading's ⓘ is not set in the
// heading's capitals; each grows from its opener and shrinks back; and the
// reduced-motion rules take that motion away, the dimmed backdrop's included.

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules } from './css-rules.ts'

const rules = cssRules(readAppCss())
const bodyOf = (selector: string) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')

describe('windows', () => {
  it('start from the body’s type, not the heading they may be opened from', () => {
    const d = bodyOf('dialog')
    expect(d).toMatch(/font-family:\s*var\(--font-family-body\)/)
    expect(d).toMatch(/text-transform:\s*none/)
    expect(d).toMatch(/letter-spacing:\s*normal/)
  })

  it('grow as they open and shrink as they close', () => {
    expect(bodyOf('dialog[data-opening]')).toMatch(/animation:\s*window-grow/)
    expect(bodyOf('dialog[data-closing]')).toMatch(/animation:\s*window-shrink/)
  })

  it('lose that motion, and the backdrop’s, under reduced motion', () => {
    for (const root of [":root:not([data-motion='full'])", ":root[data-motion='reduce']"]) {
      const rule = rules.find((r) => r.selectors.includes(`${root} *::backdrop`))
      expect(rule?.body, root).toMatch(/animation:\s*none\s*!important/)
    }
  })
})
