// The sheet as the bound journal (index.css, the Journal's sheet block; user
// 2026-10-23, direction A of the sheet concept with B's ribbon and C's
// stamps), held in the stylesheet: windows open in place inside the band,
// main.play or the quick bar (Window.tsx has no portal), so every sheet rule
// that reaches into those is fenced from them with :not(dialog *); every
// plate you tap and every inked box keeps an edge in forced colours, and
// each section's ornament its ink; a spent slot or use is crossed out; a
// condition's stamp is the Journal's alone; the foot's plates leave no dot
// of leather where four meet; and a long level line takes two even lines.
// The walk measures the rest in a browser (the leak probe compares each
// window's computed styles with production's).

import { describe, expect, it } from 'vitest'
import { readAppCss } from '../../scripts/lib/tokens.mjs'
import { cssRules, cssRulesInMedia } from './css-rules.ts'

const JOURNAL = ":root[data-look='journal']"
const css = readAppCss()
const at = (words: string) => css.lastIndexOf('/*', css.indexOf(words))
const sheetStart = at("The Adventurer's Journal (Settings")
const bound = at('---------------- the bound journal')
const shelf = at("The shelf: the Journal's other pages")
const sheet = cssRules(css.slice(sheetStart, shelf))
const ported = cssRules(css.slice(bound, shelf))
const all = cssRules(css)
const forced = cssRulesInMedia(css).filter((r) => r.media.some((m) => /forced-colors:\s*active/.test(m)))
const bodyOf = (selector: string, rules = all) =>
  rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.body)
    .join(';')
// A forced-colours rule's body, read from the stylesheet itself: the media
// list knows the selectors, the rules list the bodies.
const forcedBodyOf = (selector: string) => {
  if (!forced.some((r) => r.selectors.includes(selector))) return ''
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const bodies: string[] = []
  for (const m of text.matchAll(/@media \(forced-colors: active\) \{([\s\S]*?)\n\}/g)) bodies.push(bodyOf(selector, cssRules(m[1])))
  return bodies.join(';')
}

// A selector split into its compounds and the combinators between them, at
// its own level: what sits inside :not(), :has() or [ ] stays in its
// compound.
type Part = { compound: string } | { combinator: string }
function parts(selector: string): Part[] {
  const out: Part[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    if (depth === 0 && /[\s>+~]/.test(c)) {
      if (current) out.push({ compound: current })
      current = ''
      let combinator = ' '
      while (i < selector.length && /[\s>+~]/.test(selector[i])) {
        if (/[>+~]/.test(selector[i])) combinator = selector[i]
        i++
      }
      i--
      out.push({ combinator })
      continue
    }
    current += c
  }
  if (current) out.push({ compound: current })
  return out
}

// What a window can open inside: the band, PlayView's main, the quick bar.
const SCOPE = /(^|[^\w-])(\.hud|main\.play|\.play|\.quick-dock)(?![\w-])/
const outside = (compound: string) => compound.replace(/\((?:[^()]|\([^()]*\))*\)/g, '()')

// Whether a selector could reach into a window opened inside one of those:
// past the scope it steps down through a descendant combinator, and nothing
// from the last of those on is fenced with :not(dialog *) or is an element
// of the sheet's own by its id. A child or sibling step from a fenced or
// scoped element cannot land inside a window (no window sits inside a
// button, and a window is a dialog, never the div or span a rule names).
function reachesIntoWindows(selector: string): boolean {
  const list = parts(selector)
  const scope = list.findIndex((p) => 'compound' in p && SCOPE.test(outside(p.compound)))
  if (scope < 0) return false
  let lastDescent = -1
  for (let i = scope + 1; i < list.length; i++) {
    const p = list[i]
    if ('combinator' in p && p.combinator === ' ') lastDescent = i
  }
  if (lastDescent < 0) return false
  return !list.slice(lastDescent + 1).some((p) => 'compound' in p && (p.compound.includes(':not(dialog *)') || p.compound.startsWith('#')))
}

// The sheet block's rules from before the fence (2026-10-23), which name
// parts no window holds (the band's own chrome, its name, the dock's tiles)
// or headings a window's section has always kept; the probe of that date
// found every window as production draws it. A new rule is fenced instead.
const BEFORE_THE_FENCE = [
  `${JOURNAL} .hud .top-bar`,
  `${JOURNAL} .hud .top-bar .chrome-word`,
  `${JOURNAL} .hud .folder-button`,
  `${JOURNAL} .hud .hud-line-menu`,
  `${JOURNAL} .hud .top-bar :focus-visible`,
  `${JOURNAL} .hud .hud-line-menu:focus-visible`,
  `${JOURNAL} .hud .top-bar .chrome-word:hover`,
  `${JOURNAL} .hud .folder-button:hover`,
  `${JOURNAL} .hud .hud-line-menu:hover`,
  `${JOURNAL} .hud[data-collapsed] h1`,
  `${JOURNAL} .hud[data-collapsed] .hud-toggle`,
  `${JOURNAL} .hud[data-collapsed] .hud-identity::after`,
  `${JOURNAL} .hud[data-collapsed] :focus-visible`,
  `${JOURNAL} .hud:not([data-collapsed]) h1`,
  `${JOURNAL} .hud:not([data-collapsed]) h1::first-letter`,
  `${JOURNAL} .play section > h2:not(.heading-with-control)`,
  `${JOURNAL} .play section > h2:not(.heading-with-control)::before`,
  `${JOURNAL} .play section > h2:not(.heading-with-control)::after`,
  `${JOURNAL} .play section > h2.heading-with-control`,
  '.quick-dock .hotlist-slots',
  '.quick-dock .hotlist-slot',
  '.quick-dock .slot-number',
  '.quick-dock .slot-name',
  ".quick-dock .hotlist-slot[data-kind='empty']",
  ".quick-dock .hotlist-slot[data-kind='empty'] .slot-number",
  '.quick-dock [hidden]',
]

describe('the bound journal', () => {
  it('is found in the stylesheet, inside the sheet’s block', () => {
    expect(sheetStart).toBeGreaterThan(0)
    expect(bound).toBeGreaterThan(sheetStart)
    expect(shelf).toBeGreaterThan(bound)
    expect(ported.length).toBeGreaterThan(60)
  })

  it('draws only in the Journal, so Classic is untouched', () => {
    expect(ported.flatMap((r) => r.selectors).filter((s) => !s.startsWith(JOURNAL))).toEqual([])
  })

  it('cuts its plates from the plate token, never a colour of its own', () => {
    expect(bodyOf(`${JOURNAL} main.play .turn-chip:not(dialog *)`)).toMatch(/--plate:\s*var\(--color-journal-plate\)/)
    expect(ported.filter((r) => /#[0-9a-f]{3,8}\b/i.test(r.body)).flatMap((r) => r.selectors)).toEqual([])
  })
})

describe('windows opened from the sheet', () => {
  it('can tell a fenced rule from one that reaches in', () => {
    expect(reachesIntoWindows(`${JOURNAL} main.play .roll-button`)).toBe(true)
    expect(reachesIntoWindows(`${JOURNAL} main.play .stat-list > li`)).toBe(true)
    expect(reachesIntoWindows(`${JOURNAL} main.play .roll-button:not(dialog *)::after`)).toBe(false)
    expect(reachesIntoWindows(`${JOURNAL} main.play .turn-rows > li + li:not(dialog *)`)).toBe(false)
    expect(reachesIntoWindows(`${JOURNAL} .hud:not([data-collapsed]) .hud-identity:not(dialog *) > div:last-child > h1`)).toBe(false)
    expect(reachesIntoWindows(`${JOURNAL} .quick-dock > .hud-inner > .interrupts-head`)).toBe(false)
    expect(reachesIntoWindows(`${JOURNAL} .quick-dock #quick-dock-heading > .interrupts-toggle`)).toBe(false)
    expect(reachesIntoWindows(`${JOURNAL} .quick-dock #quick-dock-heading > .interrupts-toggle svg`)).toBe(true)
    expect(reachesIntoWindows(`${JOURNAL} main.play .secondary:not(:where(#rest .actions > button))`)).toBe(true)
    expect(reachesIntoWindows(`${JOURNAL} main.play:not(:has(> .journal-spread))`)).toBe(false)
  })

  it('keep the shelf’s index card: no sheet rule reaches into one unfenced', () => {
    const reaching = sheet.flatMap((r) => r.selectors).filter(reachesIntoWindows)
    expect(reaching.filter((s) => !BEFORE_THE_FENCE.includes(s))).toEqual([])
  })
})

describe('in forced colours', () => {
  const PLATES = [`${JOURNAL} main.play .roll-button:not(dialog *)::after`, `${JOURNAL} main.play .turn-damage:not(dialog *)::after`, `${JOURNAL} main.play .secondary:not(:where(#rest .actions > button)):not(dialog *)::after`, `${JOURNAL} .quick-dock .hotlist-slot:not(dialog *)::after`]

  it('every plate you tap keeps its rule, a border, which forced colours draw', () => {
    for (const plate of PLATES) {
      const body = bodyOf(plate)
      expect(body).toMatch(/border:\s*1px solid var\(--color-border-control\)/)
      expect(body).not.toMatch(/forced-color-adjust/)
    }
    // A disabled plate's rule is dashed, so it reads apart from one to tap.
    expect(forcedBodyOf(`${JOURNAL} main.play .secondary:not(:where(#rest .actions > button)):disabled:not(dialog *)::after`)).toMatch(/border-style:\s*dashed/)
  })

  it('a turn row keeps its inked frame, as its own target', () => {
    expect(bodyOf(`${JOURNAL} main.play .turn-row:not(dialog *)::before`, ported)).toMatch(/content:\s*none/)
    expect(forcedBodyOf(`${JOURNAL} main.play .turn-row:not(dialog *)::before`)).toMatch(/content:\s*''/)
  })

  it('an inked box keeps its edge in the system’s colour, and a use still there its fill', () => {
    for (const edge of [`${JOURNAL} main.play .resource-box:not(dialog *)::before`, `${JOURNAL} main.play .turn-slot:not(dialog *)`]) {
      expect(forcedBodyOf(edge)).toMatch(/forced-color-adjust:\s*none/)
      expect(forcedBodyOf(edge)).toMatch(/border-color:\s*ButtonText/)
    }
    expect(forcedBodyOf(`${JOURNAL} main.play .resource-box:not([data-spent]):not(dialog *)::after`)).toMatch(/background:\s*ButtonText/)
  })

  it('each section’s ornament keeps its ink, which forced colours would paint out', () => {
    for (const side of ['::before', '::after']) {
      const ornament = `${JOURNAL} main.play section > h2:not(.heading-with-control):not(dialog *)${side}`
      expect(bodyOf(ornament, ported)).toMatch(/mask:\s*var\(--ornament\)/)
      expect(forcedBodyOf(ornament)).toMatch(/forced-color-adjust:\s*none/)
      expect(forcedBodyOf(ornament)).toMatch(/background-color:\s*CanvasText/)
    }
  })

  it('the quick bar’s ribbon keeps an edge, its toggle bordered', () => {
    expect(bodyOf(`${JOURNAL} .quick-dock #quick-dock-heading > .interrupts-toggle`)).toMatch(/border:\s*1px solid var\(--color-journal-seal\)/)
  })
})

describe('a spent slot or use', () => {
  const SPENT = [`${JOURNAL} main.play .resource-box[data-spent]:not(dialog *)::after`, `${JOURNAL} main.play .turn-slot[data-spent]:not(dialog *)::after`]

  it('is crossed out in ink, the count reading without colour', () => {
    expect(css).toMatch(/--ink-cross:\s*url\("data:image\/svg\+xml,[^"]*M[\d.]+ [\d.]+C[^"]*M[\d.]+ [\d.]+C/)
    for (const spent of SPENT) {
      const body = bodyOf(spent)
      expect(body).toMatch(/content:\s*''/)
      expect(body).toMatch(/mask:\s*var\(--ink-cross\)/)
      expect(body).toMatch(/background-color:\s*var\(--color-text\)/)
      expect(forcedBodyOf(spent)).toMatch(/background-color:\s*ButtonText/)
    }
  })

  it('keeps its box’s edge and loses its fill', () => {
    expect(bodyOf(`${JOURNAL} main.play .resource-box:not([data-spent]):not(dialog *)::after`)).toMatch(/background:\s*var\(--box-fill\)/)
    expect(all.some((r) => r.selectors.some((s) => s.includes('.resource-box[data-spent]') && s.endsWith('::after')) && /--box-fill/.test(r.body))).toBe(false)
    expect(bodyOf(`${JOURNAL} main.play .resource-box:not(dialog *)::before`)).toMatch(/border:\s*2px solid var\(--box-ink\)/)
  })
})

describe('a condition’s stamp', () => {
  const STAMPS = [`${JOURNAL} main.play .turn-tucked .condition-stamp:not(dialog *)`, `${JOURNAL} main.play .condition-row:has(> .icon-button) .stat-name:not(dialog *)`]

  it('is the Journal’s alone, so Classic’s names stay plain', () => {
    const stamping = all.flatMap((r) => r.selectors).filter((s) => s.includes('condition-stamp') || s.includes('.condition-row:has(> .icon-button)'))
    expect(stamping.length).toBeGreaterThan(0)
    expect(stamping.filter((s) => !s.startsWith(JOURNAL))).toEqual([])
  })

  it('is set in the danger ink, askew, on the note and on the row of a condition the character has', () => {
    for (const stamp of STAMPS) {
      const body = bodyOf(stamp)
      expect(body).toMatch(/color:\s*var\(--color-danger\)/)
      expect(body).toMatch(/text-transform:\s*uppercase/)
      expect(body).toMatch(/rotate:\s*-\d+deg/)
    }
  })

  it('prints its frame as a border and an outline, which forced colours keep', () => {
    const frame = bodyOf(`${STAMPS[0]}::after`)
    expect(frame).toMatch(/border:\s*2px solid currentColor/)
    expect(frame).toMatch(/outline:\s*1px solid currentColor/)
    expect(frame).not.toMatch(/box-shadow/)
  })
})

describe('the deferred lows', () => {
  it('leaves the foot’s paper uncut, so four plates leave no dot of leather where they meet', () => {
    const paper = cssRules(css.slice(bound, shelf)).filter((r) => r.selectors.includes(`${JOURNAL} .quick-dock .hotlist-slot:not(dialog *)::before`))
    // The last rule for the paper wins: it takes the mask off.
    expect(paper.at(-1)?.body).toMatch(/(^|;)\s*mask:\s*none/)
    expect(bodyOf(`${JOURNAL} .quick-dock .hotlist-slot:not(dialog *)::after`)).toMatch(/mask:\s*var\(--plate-mask-sm\)/)
  })

  it('sets a long level line on two even lines beside the Levels plate', () => {
    expect(bodyOf(`${JOURNAL} .hud:not([data-collapsed]) .hud-identity:not(dialog *) > div:last-child > .meta`)).toMatch(/text-wrap:\s*balance/)
  })
})
