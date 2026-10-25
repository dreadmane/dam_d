import { overlay, SHAPES, SIDES } from './shapes.ts'

// The dice's looks (the dice roll, approved by the user 2026-10-14): five
// dice and four numeral colours, each a token in the design system's dice
// group, one hex in both themes, since a die is a thing and not a surface.
// A numeral colour is offered on a die only where it holds 4.5:1 everywhere a
// numeral sits: on the die's own colour, and on the facets a numeral reaches
// (only the d20's, whose triangle is too small for its numerals), lit or
// shaded as they rest. Computed from the hexes, never hand-listed; a test
// holds the hexes to the tokens.

export type DieId = 'slate' | 'bone' | 'marble' | 'mana' | 'coal'
export type InkId = 'light' | 'gold' | 'ink' | 'engraved'

export interface DieLook {
  id: DieId
  label: string
  // The token the body is filled with: Marble is Bone with veins.
  fill: string
  hex: string
  // A polished die's highlight is brighter than a matte one's.
  polished: boolean
  veins: boolean
  // Its edge, where it is not the control brass: Blue's is the slate,
  // as the mockup drew it, since the brass edge fights the blue.
  edge: string | null
  // The numeral colour it comes with.
  ink: InkId
}

export interface InkLook {
  id: InkId
  label: string
  token: string
  hex: string
}

// The default first: Slate (user, 2026-10-14).
export const DICE_DIES: readonly DieLook[] = [
  { id: 'slate', label: 'Slate', fill: 'color.dice.slate', hex: '#1f232b', polished: false, veins: false, edge: null, ink: 'light' },
  { id: 'bone', label: 'Bone', fill: 'color.dice.bone', hex: '#ece6dc', polished: true, veins: false, edge: null, ink: 'ink' },
  { id: 'marble', label: 'Marble', fill: 'color.dice.bone', hex: '#ece6dc', polished: true, veins: true, edge: null, ink: 'engraved' },
  { id: 'mana', label: 'Blue', fill: 'color.dice.mana', hex: '#6aa8f0', polished: true, veins: false, edge: 'color.dice.slate', ink: 'ink' },
  { id: 'coal', label: 'Coal', fill: 'color.dice.coal', hex: '#0f1115', polished: false, veins: false, edge: null, ink: 'light' },
]

// Gold leaf, the class resources' gold, in place of DCC's orange (user,
// 2026-10-23); a saved 'orange' is read as it (settings.ts).
export const DICE_INKS: readonly InkLook[] = [
  { id: 'light', label: 'Light', token: 'color.dice.ink-light', hex: '#ece6dc' },
  { id: 'gold', label: 'Gold leaf', token: 'color.dice.ink-gold', hex: '#e0b85a' },
  { id: 'ink', label: 'Ink', token: 'color.dice.ink-dark', hex: '#1a0e03' },
  { id: 'engraved', label: 'Engraved brass', token: 'color.dice.ink-engraved', hex: '#5c4527' },
]

export const MIN_CONTRAST = 4.5

export const isDie = (id: unknown): id is DieId => DICE_DIES.some((d) => d.id === id)
export const isInk = (id: unknown): id is InkId => DICE_INKS.some((i) => i.id === id)
export const dieLook = (id: DieId): DieLook => DICE_DIES.find((d) => d.id === id) ?? DICE_DIES[0]
export const inkLook = (id: InkId): InkLook => DICE_INKS.find((i) => i.id === id) ?? DICE_INKS[0]

// WCAG 2.1 relative luminance and contrast ratio, as the token check computes
// them (scripts/lib/tokens.mjs), for #rrggbb colours.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// A colour under white or black at an opacity: a lit or shaded facet.
export function blend(hex: string, over: '#fff' | '#000', opacity: number): string {
  const target = over === '#fff' ? 255 : 0
  return `#${[1, 3, 5]
    .map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16)
      return Math.round(c + (target - c) * opacity)
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

// Every colour a numeral sits on, on a die of this colour.
export function numeralGrounds(die: DieLook): string[] {
  const weights = [...new Set(SIDES.flatMap((s) => SHAPES[s].reach ?? []))]
  return [
    die.hex,
    ...weights.map((w) => {
      const o = overlay(w, 'rest')
      return blend(die.hex, o.fill, o.opacity)
    }),
  ]
}

// The lowest contrast a numeral has anywhere on the die.
export const worstContrast = (die: DieLook, ink: InkLook) => Math.min(...numeralGrounds(die).map((g) => contrastRatio(g, ink.hex)))

export const readable = (die: DieId, ink: InkId) => worstContrast(dieLook(die), inkLook(ink)) >= MIN_CONTRAST

// The numeral colour a die shows: the one chosen, while it reads on the die,
// or the die's own.
export const inkOn = (die: DieId, chosen: InkId | null): InkId => (chosen && readable(die, chosen) ? chosen : dieLook(die).ink)

const cssVar = (token: string) => `var(--${token.replaceAll('.', '-')})`

// The custom properties the dice read for their colours (index.css), every
// one given, so a sample of one die inside the page shows only its own look.
export function dieStyle(die: DieId, ink: InkId): Record<string, string> {
  const d = dieLook(die)
  return {
    '--dice-fill': cssVar(d.fill),
    '--dice-edge': cssVar(d.edge ?? 'color.border-control'),
    '--dice-glint': d.polished ? '0.38' : '0.22',
    '--dice-veins': d.veins ? 'inline' : 'none',
    '--dice-ink': cssVar(inkLook(ink).token),
  }
}
