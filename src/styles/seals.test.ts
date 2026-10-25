// The Journal's rest seals (index.css, #rest): their words sit on the wax's
// own ground, so every colour that ground is drawn in holds 4.5:1 for them
// (16 px bold is not large text). The sheen once mixed 30% white under the
// words: 2.91:1 in dark, 4.22:1 in light at its lightest (found 2026-10-22).
// The light the wax catches is a glint in ::after, on the rim, clear of the
// words; the walk (notes/2026-10-23-rest-seal-contrast) samples the pixels.

import { describe, expect, it } from 'vitest'
import tokens from '../../data/design/tokens.json'
import { contrastRatio, flatten, readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules } from './css-rules.ts'

const SEAL = ":root[data-look='journal'] #rest .actions > button[aria-haspopup='dialog']:not(:disabled)"
const flat = flatten(tokens) as { path: string; value: string; light: string }[]
const token = (p: string) => flat.find((t) => t.path === p)!
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// The seal's own background: its colour and every stop of its gradients,
// each resolved in a theme. color-mix(in srgb, seal N%, white | black) mixes
// the channels as written, which is what srgb means.
function groundColours(body: string, theme: 'value' | 'light'): { stop: string; hex: string }[] {
  const seal = token('color.journal.seal')[theme]
  const decl = (name: string) => body.match(new RegExp(`(?:^|;)\\s*${name}:\\s*([^;]+)`))?.[1] ?? ''
  const text = `${decl('background-color')} ${decl('background-image')} ${decl('background')}`
  const stops: { stop: string; hex: string }[] = []
  for (const m of text.matchAll(/color-mix\(in srgb, var\(--color-journal-seal\) (\d+)%, (white|black)\)/g)) {
    const w = Number(m[1]) / 100
    const other = m[2] === 'white' ? 255 : 0
    stops.push({ stop: m[0], hex: toHex(hex(seal).map((c) => c * w + other * (1 - w))) })
  }
  if (/var\(--color-journal-seal\)/.test(text.replace(/color-mix\([^)]*\)/g, ''))) stops.push({ stop: 'var(--color-journal-seal)', hex: seal })
  return stops
}

describe('the rest seals', () => {
  const body = cssRules(readAppCss())
    .filter((r) => r.selectors.includes(SEAL))
    .map((r) => r.body)
    .join(';')

  it('are drawn in the stylesheet', () => {
    expect(body).toMatch(/background-color:\s*var\(--color-journal-seal\)/)
  })

  it.each([
    ['dark', 'value'],
    ['light', 'light'],
  ] as const)('%s: every colour of the ground under the words holds 4.5:1 for them', (_, theme) => {
    const words = token('color.journal.on-seal')[theme]
    const stops = groundColours(body, theme)
    expect(stops.length).toBeGreaterThan(0)
    for (const s of stops) expect(contrastRatio(words, s.hex), `${s.stop} = ${s.hex}`).toBeGreaterThanOrEqual(4.5)
  })

  it('catch the light in a glint of their own, not under the words', () => {
    const glint = cssRules(readAppCss())
      .filter((r) => r.selectors.includes(`${SEAL}::after`))
      .map((r) => r.body)
      .join(';')
    expect(glint).toMatch(/color-mix\(in srgb, var\(--color-journal-seal\) \d+%, white\)/)
    expect(glint).toMatch(/pointer-events:\s*none/)
  })
})
