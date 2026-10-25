// The dice tray's seal and its moment in the stylesheet (the dice total
// concept, direction B, user 2026-10-23; DiceTray.tsx): the total pressed
// into a seal beside the dice, and a natural 20 or 1 on the d20 that counts
// shown by colour, a mark and words, still, and played once as the last die
// lands where the app allows motion. Held here:
//   - the seal's numeral at AA (3:1, large text) on every colour the seal
//     is drawn in under it, the crack and its lip included, in both looks
//     and both themes, and the moment's words at 4.5:1 on the tray;
//   - the stronger 1 (B's fixer): a 3 px crack with a lighter lip, the seal
//     tipped 8 to 10 degrees, and the light theme's wax duller;
//   - the motion keyed on .dice-tray[data-motion] (motionAllowed(), which
//     follows Settings, Motion, not the device's query alone), waiting for
//     the landing, each part at most 1.2 s, once, and never more than three
//     flashes in a second (WCAG 2.3.1);
//   - forced colours keep the rim, the rays and the crack;
//   - its rules sit in the tray's own section, never in the Journal sheet's
//     fenced block.
// The walk (notes/2026-10-23-dice-seal) samples the numeral's pixels.

import { describe, expect, it } from 'vitest'
import tokens from '../../data/design/tokens.json'
import { contrastRatio, flatten, readAppCss } from '../../scripts/lib/tokens.mjs'
import { TRAY_HEIGHT, TRAY_SHARE } from '../dice/layout.ts'
import { cssRules, cssRulesInMedia } from './css-rules.ts'

const css = readAppCss()
// The colours are read outside forced colours, which has its own test below.
const FORCED = /@media \(forced-colors: active\) \{([\s\S]*?)\n\}/g
const rules = cssRules(css.replace(FORCED, ''))
const inMedia = cssRulesInMedia(css)
const mediaOf = (selectors: string[]) => inMedia.filter((m) => m.selectors.join() === selectors.join()).flatMap((m) => m.media)
const bodyOf = (selector: string) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')
const decl = (body: string, name: string) => [...body.matchAll(new RegExp(`(?:^|[;\\s])${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+)`, 'g'))].map((m) => m[1].trim()).at(-1) ?? null
const keyframes = new Map(
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map((m) => [m[1], m[2]]),
)

// ------------------------------------------------------------------ colours

type Theme = 'value' | 'light'
const flat = flatten(tokens) as { path: string; value: string; light: string }[]
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// A colour token by its custom property: --color-journal-seal is
// color.journal.seal. The Journal's grounds replace the shared ones while
// the look is on (index.css, [data-look='journal']).
const JOURNAL_GROUNDS = ['surface', 'surface-raised', 'text-muted']
function token(property: string, theme: Theme, journal: boolean): string {
  let name = property.replace(/^--color-/, '')
  if (journal && JOURNAL_GROUNDS.includes(name)) name = `journal-${name}`
  const group = ['journal', 'dice'].find((g) => name.startsWith(`${g}-`))
  const p = group ? `color.${group}.${name.slice(group.length + 1)}` : `color.${name}`
  const t = flat.find((x) => x.path === p)
  if (!t) throw new Error(`no token ${p}`)
  return t[theme]
}

// Splits at the commas of its own level, not those inside a function.
function args(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') depth--
    else if (text[i] === ',' && depth === 0) {
      out.push(text.slice(start, i).trim())
      start = i + 1
    }
  }
  return [...out, text.slice(start).trim()]
}

// A colour as the stylesheet writes it, resolved in a theme: a hex, white,
// black, a token, a custom property of the seal's own, or a color-mix() in
// srgb of two of them, which mixes the channels as written.
function resolve(value: string, theme: Theme, journal: boolean, own: Record<string, string>): string {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase()
  if (v === 'white') return '#ffffff'
  if (v === 'black') return '#000000'
  const ref = /^var\((--[\w-]+)\)$/.exec(v)
  if (ref) return own[ref[1]] !== undefined ? resolve(own[ref[1]], theme, journal, own) : token(ref[1], theme, journal)
  const mix = /^color-mix\(in srgb,\s*([\s\S]+)\)$/.exec(v)
  if (mix) {
    const [a, b] = args(mix[1]).map((part) => /^([\s\S]+?)(?:\s+(\d+(?:\.\d+)?)%)?$/.exec(part)!)
    const wa = a[2] !== undefined ? Number(a[2]) / 100 : b[2] !== undefined ? 1 - Number(b[2]) / 100 : 0.5
    const [ca, cb] = [hex(resolve(a[1], theme, journal, own)), hex(resolve(b[1], theme, journal, own))]
    return toHex(ca.map((c, i) => c * wa + cb[i] * (1 - wa)))
  }
  throw new Error(`cannot resolve ${v}`)
}

const JOURNAL = ":root[data-look='journal']"
const MOMENTS = [null, '20', '1'] as const
type Moment = (typeof MOMENTS)[number]
const tray = (moment: Moment) => (moment ? `.dice-tray[data-moment='${moment}']` : '.dice-tray')

// The seal's own properties (--seal-wax, --seal-ink) in a look, a theme and
// a moment: the base rule's, then the moment's, then the light theme's.
function sealOwn(journal: boolean, theme: Theme, moment: Moment): Record<string, string> {
  if (!journal) return {}
  const bodies = [bodyOf(`${JOURNAL} .dice-tray .tray-seal`)]
  if (moment) bodies.push(bodyOf(`${JOURNAL} ${tray(moment)} .tray-seal`))
  if (moment && theme === 'light') bodies.push(bodyOf(`${JOURNAL}[data-theme='light'] ${tray(moment)} .tray-seal`))
  const own: Record<string, string> = {}
  for (const body of bodies) for (const name of ['--seal-wax', '--seal-ink']) if (decl(body, name)) own[name] = decl(body, name)!
  return own
}

// The numeral's colour, and every colour drawn under it: the seal's field,
// each stop of the wax's gradient but the glint (a mix with white, high on
// the upper left and clear of the numeral, which the walk's pixels check),
// and on a 1 the crack and its lip.
function seal(journal: boolean, theme: Theme, moment: Moment) {
  const own = sealOwn(journal, theme, moment)
  const look = journal ? `${JOURNAL} ` : ''
  const numeralRule = [bodyOf('.dice-tray .tray-seal'), moment ? bodyOf(`${tray(moment)} .tray-seal`) : '', journal ? bodyOf(`${JOURNAL} .dice-tray .tray-seal`) : ''].join(';')
  const ink = resolve(decl(numeralRule, 'color')!, theme, journal, own)
  const fieldRule = journal ? bodyOf(`${JOURNAL} .dice-tray .tray-seal`) : bodyOf('.dice-tray .tray-seal')
  const grounds: { what: string; hex: string }[] = [{ what: 'field', hex: resolve(decl(fieldRule, 'background-color')!, theme, journal, own) }]
  for (const m of (decl(fieldRule, 'background-image') ?? '').matchAll(/color-mix\(in srgb, (?:[^()]|\([^()]*\))*\)|var\(--seal-wax\)/g)) {
    if (/white\)$/.test(m[0])) continue
    grounds.push({ what: m[0], hex: resolve(m[0], theme, journal, own) })
  }
  if (moment === '1') {
    for (const part of ['line', 'lip']) {
      const stroke = decl(journal ? bodyOf(`${look}.dice-tray .tray-crack-${part}`) : bodyOf(`.dice-tray .tray-crack-${part}`), 'stroke')!
      grounds.push({ what: `crack ${part}`, hex: resolve(stroke, theme, journal, own) })
    }
  }
  return { ink, grounds }
}

describe('the seal’s numeral', () => {
  const cases = [false, true].flatMap((journal) => (['value', 'light'] as const).flatMap((theme) => MOMENTS.map((moment) => ({ journal, theme, moment }))))

  it.each(cases)('holds 3:1, large text, on every colour under it: Journal $journal, $theme, moment $moment', ({ journal, theme, moment }) => {
    const { ink, grounds } = seal(journal, theme, moment)
    expect(grounds.length).toBeGreaterThan(0)
    for (const g of grounds) expect(contrastRatio(ink, g.hex), `${ink} on ${g.what} = ${g.hex}`).toBeGreaterThanOrEqual(3)
  })

  it('is set large, half the seal, bold: large text, whose AA is 3:1', () => {
    const body = bodyOf('.dice-tray .tray-total-value')
    expect(decl(body, 'font-size')).toBe('calc(var(--seal-size) / 2)')
    expect(decl(body, 'font-weight')).toBe('700')
    // The seal's smallest size is 4rem: a 32 px numeral, past 24 px.
    expect(decl(bodyOf('.dice-tray'), '--seal-size')).toMatch(/^clamp\(4rem,/)
  })

  // A long total (DiceTray.tsx's data-digits; found by the review,
  // 2026-10-23): '180' at half a 96 px seal was 65 px wide and '1980' 86 px,
  // about 0.45 em a character in Alegreya SC (measured by the review), and
  // ran over the Journal's pressed ring. Stepped down, the numeral's box
  // (line-height 1) stays inside the ring at every length, and the numeral
  // stays large text on the smallest seal (14 pt bold, 18.67 px).
  it('steps a long total down, inside the pressed ring and still large text', () => {
    const SEAL = 96
    const ring = SEAL - 2 * SEAL * 0.09 - 2 * 1.5
    expect(decl(bodyOf(`${JOURNAL} .dice-tray .tray-seal::before`), 'inset')).toBe('calc(var(--seal-size) * 0.09)')
    const share = (digits: number) => {
      const body = digits < 3 ? bodyOf('.dice-tray .tray-total-value') : bodyOf(`.dice-tray .tray-total-value[data-digits='${digits}']`)
      const size = decl(body, 'font-size')!
      const m = /^calc\(var\(--seal-size\) (\/|\*) (\d+(?:\.\d+)?)\)$/.exec(size)
      expect(m, `${digits}: ${size}`).not.toBeNull()
      return m![1] === '/' ? 1 / Number(m![2]) : Number(m![2])
    }
    for (const digits of [2, 3, 4]) {
      const font = share(digits) * SEAL
      const box = Math.hypot(digits * 0.45 * font, font)
      expect(box, `${digits} digits`).toBeLessThanOrEqual(ring)
      expect(share(digits) * 64, `${digits} digits on a 4rem seal`).toBeGreaterThanOrEqual(18.67)
    }
    expect(share(3)).toBeLessThan(share(2))
    expect(share(4)).toBeLessThan(share(3))
  })

  it('stands above the crack, which is drawn under it', () => {
    expect(decl(bodyOf('.dice-tray .tray-total-value'), 'z-index')).toBe('1')
    expect(decl(bodyOf('.dice-tray .tray-seal'), 'isolation')).toBe('isolate')
  })
})

describe('the moment’s words', () => {
  it.each([false, true].flatMap((journal) => (['value', 'light'] as const).flatMap((theme) => (['20', '1'] as const).map((moment) => ({ journal, theme, moment })))))(
    'hold 4.5:1 on the tray: Journal $journal, $theme, a $moment',
    ({ journal, theme, moment }) => {
      const words = resolve(decl(bodyOf(`${tray(moment)} .tray-natural`), 'color')!, theme, journal, {})
      const ground = resolve(decl(bodyOf('.dice-tray'), 'background-color')!, theme, journal, {})
      expect(contrastRatio(words, ground)).toBeGreaterThanOrEqual(4.5)
    },
  )

  // Found by the review (2026-10-23): on a phone on its side the tray is
  // held to two fifths of the screen, so their line could not grow it and
  // came out of the dice: a natural 20's lone die drew at 36 px at 844 x 390,
  // and at 667 x 375 an Advantage pair's line was cut off. Where two fifths
  // of the screen is under the tray's 200 px, they join the name's line,
  // before the seal, and the dice keep the row beside it.
  it('join the name’s line on a screen too short for the tray to grow by them', () => {
    const query = `(max-height: ${TRAY_HEIGHT / TRAY_SHARE / 16}rem)`
    const block = new RegExp(`@media ${query.replace(/[().]/g, '\\$&')} \\{([\\s\\S]*?)\\n\\}`).exec(css)
    expect(block, query).not.toBeNull()
    const short = cssRules(block![1])
    const shortOf = (selector: string) =>
      short
        .filter((r) => r.selectors.includes(selector))
        .map((r) => r.body)
        .join(';')
    expect(decl(shortOf('.dice-tray'), 'grid-template-columns')).toBe('minmax(0, 1fr) auto auto')
    expect(decl(shortOf('.dice-tray > .tray-natural'), 'grid-row')).toBe('1')
    expect(decl(shortOf('.dice-tray > .tray-natural'), 'grid-column')).toBe('2')
    expect(decl(shortOf('.dice-tray > .tray-natural'), 'white-space')).toBe('nowrap')
    // The dice keep the width beside the seal; the seal its column.
    expect(decl(shortOf('.dice-tray > .dice-row'), 'grid-column')).toBe('1 / span 2')
    expect(decl(shortOf('.dice-tray > .tray-total'), 'grid-column')).toBe('3')
    // After the words' own rules, so its margin is the one that holds.
    expect(css.indexOf(block![0])).toBeGreaterThan(css.indexOf("\n.dice-tray[data-moment='1'] .tray-natural {"))
  })
})

// ------------------------------------------------------------ the still

describe('the still', () => {
  it('shows a 20 by its gold, its rays and its words', () => {
    expect(decl(bodyOf(`${JOURNAL} .dice-tray[data-moment='20'] .tray-seal`), '--seal-wax')).toBe('var(--color-dice-ink-gold)')
    expect(decl(bodyOf(".dice-tray[data-moment='20'] .tray-seal"), 'color')).toBe('var(--color-class-resource)')
    const rays = bodyOf(".dice-tray[data-moment='20'] .tray-seal::after")
    expect(rays).toMatch(/content:\s*''/)
    expect(decl(rays, 'background-image')).toMatch(/^repeating-conic-gradient\(var\(--ray\)/)
    expect(decl(bodyOf(".dice-tray[data-moment='20'] .tray-natural"), 'color')).toBe('var(--color-class-resource)')
  })

  it('shows a 1 by its crack, its tilt and its words', () => {
    const tilt = /rotate\((-?\d+(?:\.\d+)?)deg\)/.exec(decl(bodyOf(".dice-tray[data-moment='1'] .tray-total"), 'transform') ?? '')
    expect(tilt).not.toBeNull()
    expect(Math.abs(Number(tilt![1]))).toBeGreaterThanOrEqual(8)
    expect(Math.abs(Number(tilt![1]))).toBeLessThanOrEqual(10)
    expect(decl(bodyOf(".dice-tray[data-moment='1'] .tray-natural"), 'color')).toBe('var(--color-accent)')
  })

  it('cracks a 1 deeper: a 3 px line over a lighter lip', () => {
    expect(decl(bodyOf('.dice-tray .tray-crack-line'), 'stroke-width')).toBe('3px')
    expect(decl(bodyOf('.dice-tray .tray-crack-lip'), 'stroke-width')).toBe('1.5px')
    for (const theme of ['value', 'light'] as const) {
      const own = sealOwn(true, theme, '1')
      const lum = (h: string) => contrastRatio(h, '#000000')
      const line = resolve(decl(bodyOf(`${JOURNAL} .dice-tray .tray-crack-line`), 'stroke')!, theme, true, own)
      const lip = resolve(decl(bodyOf(`${JOURNAL} .dice-tray .tray-crack-lip`), 'stroke')!, theme, true, own)
      const wax = resolve('var(--seal-wax)', theme, true, own)
      expect(lum(lip), `${theme}: the lip ${lip} lighter than the wax ${wax}`).toBeGreaterThan(lum(wax))
      expect(lum(line), `${theme}: the line ${line} darker than the wax`).toBeLessThan(lum(wax))
    }
  })

  // The light theme's seal is a deep red, and its leather a red-brown: the
  // dark theme's mix barely changed it. The light 1 mixes in the muted ink.
  it('dulls the light theme’s wax on a 1, further than the dark theme’s', () => {
    const saturation = (h: string) => {
      const [r, g, b] = hex(h)
      return (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b)
    }
    const light = sealOwn(true, 'light', '1')
    expect(light['--seal-wax']).not.toBe(sealOwn(true, 'value', '1')['--seal-wax'])
    // Both ways the light theme is chosen: the device's, and Settings'.
    const media = inMedia.filter((r) => r.media.some((m) => /prefers-color-scheme: light/.test(m)) && r.selectors.some((s) => s.includes("[data-moment='1'] .tray-seal")))
    expect(media).toHaveLength(1)
    const dulled = resolve(light['--seal-wax'], 'light', true, {})
    const seal = token('--color-journal-seal', 'light', true)
    expect(saturation(dulled)).toBeLessThan(saturation(seal) - 0.15)
  })
})

// ------------------------------------------------------------ the motion

// Every rule that plays one of the seal's animations, with the animations
// it names.
const SEAL_ANIMATIONS = ['seal-press', 'seal-follow', 'seal-light', 'seal-rays', 'seal-crack', 'seal-tip']
const playing = rules.filter((r) => SEAL_ANIMATIONS.some((a) => new RegExp(`animation:[^;]*\\b${a}\\b`).test(r.body)))

describe('the moment’s motion', () => {
  it('is found: a rule for each of the seal’s animations', () => {
    expect(new Set(playing.flatMap((r) => SEAL_ANIMATIONS.filter((a) => r.body.includes(a)))).size).toBe(SEAL_ANIMATIONS.length)
  })

  it('plays only on a tray the app allows motion for, keyed on data-motion, not on the device’s query', () => {
    for (const r of playing) {
      for (const s of r.selectors) expect(s, s).toMatch(/^\.dice-tray\[data-motion\]/)
      expect(mediaOf(r.selectors).filter((m) => /prefers-reduced-motion/.test(m)), r.selectors.join(', ')).toEqual([])
    }
  })

  it('keys the moment itself on data-moment as well', () => {
    const moment = playing.filter((r) => /seal-(light|rays|crack|tip)\b/.test(r.body) || r.selectors.some((s) => s.includes('.tray-natural')))
    expect(moment.length).toBe(5)
    for (const r of moment) for (const s of r.selectors) expect(s).toMatch(/^\.dice-tray\[data-motion\]\[data-moment(='(20|1)')?\]/)
  })

  it('waits for the last die to land', () => {
    expect(decl(bodyOf('.dice-tray'), '--moment-at')).toBe('var(--last, 0ms)')
    for (const r of playing) {
      const animation = decl(r.body, 'animation')!
      expect(animation, r.selectors[0]).toMatch(/var\(--moment-at\)/)
    }
  })

  it('plays each part once, for at most 1.2 s', () => {
    for (const r of playing) {
      const animation = decl(r.body, 'animation')!
      expect(animation).not.toMatch(/infinite|alternate/)
      for (const part of args(animation)) {
        const ms = /^[\w-]+\s+(\d+)ms\b/.exec(part)
        expect(ms, part).not.toBeNull()
        expect(Number(ms![1]), part).toBeLessThanOrEqual(1200)
        // A count after the timing would repeat it.
        expect(part.replace(/calc\([^)]*\)|var\([^)]*\)|cubic-bezier\([^)]*\)/g, '')).not.toMatch(/\s\d+(\.\d+)?(\s|$)/)
      }
    }
    expect(bodyOf('.dice-tray .tray-seal')).not.toMatch(/animation-iteration-count/)
  })

  // A flash is a rise in light and a fall back. Every part but the ring
  // only appears, rising once; the ring rises and falls once. So the moment
  // flashes once, where WCAG 2.3.1 allows three in any second.
  it('never flashes more than three times in a second', () => {
    let falls = 0
    for (const name of SEAL_ANIMATIONS) {
      const steps = [...(keyframes.get(name) ?? '').matchAll(/([\d%,\s\w]+)\{([^}]*)\}/g)]
      const opacities = steps.map((m) => /opacity:\s*([\d.]+)/.exec(m[2])).filter(Boolean).map((m) => Number(m![1]))
      for (let i = 1; i < opacities.length; i++) if (opacities[i] < opacities[i - 1]) falls++
    }
    expect(falls).toBe(1)
    expect(falls).toBeLessThanOrEqual(3)
  })

  it('is gone with the motion: the ring of light is unseen unless it plays', () => {
    expect(decl(bodyOf(".dice-tray[data-moment='20'] .tray-total::before"), 'opacity')).toBe('0')
  })
})

// ------------------------------------------------------- forced colours

describe('in forced colours', () => {
  const forced = [...css.matchAll(FORCED)].map((m) => m[1]).join('\n')
  it('the seal keeps its rim, and the rays and the crack draw in the system’s text colour', () => {
    expect(forced).toMatch(/\.dice-tray \.tray-seal,\s*:root\[data-look='journal'\] \.dice-tray \.tray-seal \{\s*border: 2px solid CanvasText;/)
    expect(forced).toMatch(/\.dice-tray\[data-moment='20'\] \.tray-seal::after \{\s*--ray: CanvasText;\s*forced-color-adjust: none;/)
    expect(forced).toMatch(/\.tray-crack-line \{\s*stroke: CanvasText;/)
  })
})

// ---------------------------------------------------- where it is written

describe('the seal’s rules', () => {
  it('sit in the dice tray’s own section, never in the Journal sheet’s fenced block', () => {
    const text = css.replace(/\/\*[\s\S]*?\*\//g, (c) => ' '.repeat(c.length))
    const start = css.indexOf('/* The dice tray (DiceTray.tsx;')
    const end = css.indexOf('/* Settings, Dice (DiceSettings.tsx)')
    expect(start).toBeGreaterThan(0)
    expect(end).toBeGreaterThan(start)
    const at = [...text.matchAll(/\.tray-(total|seal|natural|crack)\b/g)].map((m) => m.index)
    expect(at.length).toBeGreaterThan(20)
    expect(at.filter((i) => i < start || i > end)).toEqual([])
  })

  it('take no taps, as the tray takes none', () => {
    expect(bodyOf('.dice-tray')).toMatch(/pointer-events:\s*none/)
  })
})
