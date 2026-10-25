// The design tokens snapshot: every declared contrast pair meets its WCAG
// minimum in both themes, and the generated CSS matches the snapshot. The
// build runs these, so a token change that breaks AA cannot deploy.

import { describe, expect, it } from 'vitest'
import tokens from '../../data/design/tokens.json'
import { checkContrast, contrastRatio, flatten, readTokensCss, tokensCss } from '../../scripts/lib/tokens.mjs'

describe('design tokens', () => {
  it('the contrast check computes WCAG ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  const rows = checkContrast(tokens)

  it('declares contrast pairs to check', () => {
    expect(rows.length).toBeGreaterThan(0)
  })

  it('checks each pair in the themes the file declares, dark and light here', () => {
    const pairs = tokens.$extensions.dcc.contrast.pairs.length
    expect(tokens.$extensions.dcc.themes).toEqual(['dark', 'light'])
    expect(rows).toHaveLength(pairs * 2)
    const darkOnly = { ...tokens, $extensions: { dcc: { ...tokens.$extensions.dcc, themes: ['dark'] } } }
    expect(new Set(checkContrast(darkOnly).map((r) => r.theme))).toEqual(new Set(['dark']))
  })

  it.each(rows.map((r) => [`${r.theme}: ${r.fg} on ${r.bg} ≥ ${r.min}:1`, r] as const))('%s', (_, row) => {
    expect(row.problem).toBeUndefined()
    expect(row.ratio).toBeGreaterThanOrEqual(row.min)
  })

  it('every colour is #rrggbb in both themes', () => {
    for (const t of flatten(tokens).filter((t) => t.type === 'color')) {
      expect(t.value, t.path).toMatch(/^#[0-9a-f]{6}$/i)
      expect(t.light, t.path).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('src/styles/tokens.css is generated from the snapshot (run npm run sync-tokens)', () => {
    const normalize = (s: string) => s.replace(/\r\n/g, '\n')
    expect(normalize(readTokensCss())).toBe(normalize(tokensCss(tokens)))
  })
})
