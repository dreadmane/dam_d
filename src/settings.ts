// The player's settings: theme, heading font, motion, whether notifications
// flash as they arrive, the dice, and Roll20 (spec §3.3, Settings). They are
// preferences of this device, not character data, so they
// live in localStorage rather than the roster store, and never travel in an
// export. Storage can refuse (private browsing, blocked site data), so every
// read and write is guarded and the defaults always work.
//
// Applying a setting is setting an attribute on <html>; the CSS in
// tokens.css and index.css does the rest.

import { dieStyle, inkOn, isDie, isInk, readable, type DieId, type InkId } from './dice/looks.ts'

export type Theme = 'system' | 'dark' | 'light'

// System follows the device's reduce-motion setting; Reduce and Full pin it.
export type Motion = 'system' | 'reduce' | 'full'

// The sheet's look (spec §6.1): Classic, Crawler Interface's frame in the
// red and parchment palette, or the Adventurer's Journal (user, 2026-10-20),
// a field book with the turn on top. The Journal is the default (user,
// 2026-10-20); Classic is the one to choose.
export type Look = 'classic' | 'journal'

// A type style: the headings' face, how the headings and the chrome's words
// (MENU, PINNED) are set in it, and the character's name's face. The body
// face is the same in every style.
export interface HeadingFont {
  id: string
  label: string
  // The face's own name, for the dice's numeral choices.
  face: string
  // The design tokens the faces come from (src/styles/tokens.css).
  familyVar: string
  weightVar: string
  nameFamilyVar: string
  nameWeightVar: string
  // Headings in capitals. A small-caps face is set in mixed case instead, so
  // its small capitals show.
  caps: boolean
  // The chrome's words in the body face rather than the headings'.
  chromeInBody: boolean
}

// The default first: the stylesheet's own values, the display and name
// tokens themselves. The three styles are the red and parchment concept's
// fonts 3, 1 and 2 (user, 2026-10-19).
export const HEADING_FONTS: HeadingFont[] = [
  { id: 'alegreya', label: 'Alegreya', face: 'Alegreya SC', familyVar: '--font-family-display', weightVar: '--font-weight-display', nameFamilyVar: '--font-family-name', nameWeightVar: '--font-weight-name', caps: false, chromeInBody: true },
  { id: 'beyond', label: 'Beyond', face: 'Roboto Condensed', familyVar: '--font-family-display-beyond', weightVar: '--font-weight-display-beyond', nameFamilyVar: '--font-family-name-book', nameWeightVar: '--font-weight-name-book', caps: true, chromeInBody: false },
  { id: 'book', label: 'Book', face: 'Cormorant SC', familyVar: '--font-family-display-book', weightVar: '--font-weight-display-book', nameFamilyVar: '--font-family-name-book', nameWeightVar: '--font-weight-name-book', caps: false, chromeInBody: true },
]

// The custom properties a type style sets: only where it differs from the
// stylesheet's own values, which are the default style's (index.css reads
// each with that fallback).
export function typeStyle(font: HeadingFont): Record<string, string> {
  const base = HEADING_FONTS[0]
  const props: Record<string, string> = {}
  if (font.familyVar !== base.familyVar) {
    props['--heading-font-family'] = `var(${font.familyVar})`
    props['--heading-font-weight'] = `var(${font.weightVar})`
  }
  if (font.caps !== base.caps) props['--heading-case'] = font.caps ? 'uppercase' : 'none'
  if (font.chromeInBody !== base.chromeInBody) {
    props['--chrome-font-family'] = font.chromeInBody ? 'var(--font-family-body)' : `var(${font.familyVar})`
    props['--chrome-font-weight'] = font.chromeInBody ? '800' : `var(${font.weightVar})`
  }
  if (font.nameFamilyVar !== base.nameFamilyVar) {
    props['--name-font-family'] = `var(${font.nameFamilyVar})`
    props['--name-font-weight'] = `var(${font.nameWeightVar})`
  }
  return props
}

const TYPE_PROPS = ['--heading-font-family', '--heading-font-weight', '--heading-case', '--chrome-font-family', '--chrome-font-weight', '--name-font-family', '--name-font-weight']

// A die's numerals: the headings' face by default (user, 2026-10-14), the
// device's own face, or any heading face by name. Each is a family and a
// weight for the --dice-font-* properties the dice read.
export interface NumeralFont {
  id: string
  label: string
  family: string
  weight: string
}

export const NUMERAL_FONTS: NumeralFont[] = [
  { id: 'headings', label: 'Same as headings', family: 'var(--heading-font-family, var(--font-family-display))', weight: 'var(--heading-font-weight, var(--font-weight-display))' },
  { id: 'plain', label: 'Plain', family: 'var(--font-family-body)', weight: '600' },
  ...HEADING_FONTS.map((f) => ({ id: f.id, label: f.face, family: `var(${f.familyVar})`, weight: `var(${f.weightVar})` })),
]

export const numeralFont = (id: string): NumeralFont => NUMERAL_FONTS.find((f) => f.id === id) ?? NUMERAL_FONTS[0]

// The dice (the dice roll, approved by the user 2026-10-14).
export interface DiceSettings {
  // Each roll shows its dice; off, the number alone. The Rolls log keeps every
  // roll either way.
  show: boolean
  die: DieId
  // The numeral colour chosen, or null for the die's own.
  ink: InkId | null
  font: string
}

// Rolls into Roll20 (user, 2026-10-18). Sending through Beyond20 needs no
// switch here: adding this site to Beyond20's custom domains is the choice.
export interface Roll20Settings {
  // Each roll made in play is also copied as a Roll20 chat card, to paste.
  // Off by default: on, every roll replaces what the clipboard held.
  copy: boolean
}

// Optional rules (the spec §3.3, Settings: in place of Crawler Interface's
// GM allowances), each off by default and each the table's to choose: a
// level's hit points rolled rather than fixed as Level up's default (C3),
// and milestone levelling for new characters (C2). Neither changes a
// character already made; each is only where a choice starts.
export interface OptionalRules {
  rolledHp: boolean
  milestone: boolean
}

export interface Settings {
  theme: Theme
  look: Look
  motion: Motion
  headingFont: string
  // Notifications flash as they arrive (A1). Off, the quiet setting: they go
  // straight to the folder, and only one carrying an action still shows.
  flashes: boolean
  dice: DiceSettings
  roll20: Roll20Settings
  rules: OptionalRules
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  look: 'journal',
  motion: 'system',
  headingFont: HEADING_FONTS[0].id,
  flashes: true,
  dice: { show: true, die: 'slate', ink: null, font: 'headings' },
  roll20: { copy: false },
  rules: { rolledHp: false, milestone: false },
}

const KEY = 'd-amp-d:settings'

// Anything unreadable or unknown falls back to the default, field by field. A
// field no longer read, such as the Phosphor skin's tube and Tube effects
// (2026-10-15 to 2026-10-19), or Crawler Interface's GM allowances, Spoilers
// and Profanity, is dropped here, so nothing needs migrating.
export function parseSettings(raw: string | null): Settings {
  let value: Partial<Settings> = {}
  try {
    value = raw ? (JSON.parse(raw) as Partial<Settings>) : {}
  } catch {
    // A damaged value is the same as none.
  }
  return {
    theme: value.theme === 'dark' || value.theme === 'light' || value.theme === 'system' ? value.theme : DEFAULT_SETTINGS.theme,
    look: value.look === 'journal' || value.look === 'classic' ? value.look : DEFAULT_SETTINGS.look,
    motion: value.motion === 'reduce' || value.motion === 'full' || value.motion === 'system' ? value.motion : DEFAULT_SETTINGS.motion,
    headingFont: HEADING_FONTS.some((f) => f.id === value.headingFont) ? value.headingFont! : DEFAULT_SETTINGS.headingFont,
    // Off only if saved as exactly false.
    flashes: value.flashes !== false,
    dice: parseDice(value.dice),
    roll20: { copy: (value.roll20 as Partial<Record<keyof Roll20Settings, unknown>> | undefined)?.copy === true },
    rules: {
      // On only if saved as exactly true.
      rolledHp: (value.rules as Partial<Record<keyof OptionalRules, unknown>> | undefined)?.rolledHp === true,
      milestone: (value.rules as Partial<Record<keyof OptionalRules, unknown>> | undefined)?.milestone === true,
    },
  }
}

// A numeral colour saved under a name it no longer has: DCC's Orange became
// Gold leaf (user, 2026-10-23), so a device that chose it keeps the fourth
// colour rather than falling back to the die's own.
const renamedInk = (ink: unknown): unknown => (ink === 'orange' ? 'gold' : ink)

// A numeral colour that would not read on the die is the die's own.
function parseDice(raw: unknown): DiceSettings {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof DiceSettings, unknown>>
  const die = isDie(value.die) ? value.die : DEFAULT_SETTINGS.dice.die
  const ink = renamedInk(value.ink)
  return {
    show: value.show !== false,
    die,
    ink: isInk(ink) && readable(die, ink) ? ink : null,
    font: NUMERAL_FONTS.some((f) => f.id === value.font) ? (value.font as string) : DEFAULT_SETTINGS.dice.font,
  }
}

// The dice's colours and numeral face, as the --dice-* custom properties the
// dice read: every one, so a sample of one look shows only its own.
export function diceStyle(dice: Pick<DiceSettings, 'die' | 'ink' | 'font'>): Record<string, string> {
  const font = numeralFont(dice.font)
  return { ...dieStyle(dice.die, inkOn(dice.die, dice.ink)), '--dice-font-family': font.family, '--dice-font-weight': font.weight }
}

const DEFAULT_DICE_STYLE = diceStyle(DEFAULT_SETTINGS.dice)

export function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(KEY))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Unsaved, but still applied for this visit.
  }
}

// The parts of <html> this touches, so tests can pass a stand-in.
type Root = Pick<HTMLElement, 'setAttribute' | 'removeAttribute'> & {
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>
}

// System removes data-theme, so the device's own setting decides; Dark and
// Light pin it (tokens.css reads data-theme). The type style is set on
// variables of its own (typeStyle), which the stylesheet reads before
// falling back to the default style's tokens. The tokens themselves are never
// overridden, so each option can still be previewed in its own face.
export function applySettings(settings: Settings, root: Root = document.documentElement): void {
  if (settings.theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', settings.theme)

  // data-look names the look; index.css draws the Journal under it, and
  // Classic is the stylesheet's own.
  root.setAttribute('data-look', settings.look)

  // System removes data-motion, so the device's own setting decides (index.css
  // reads both).
  if (settings.motion === 'system') root.removeAttribute('data-motion')
  else root.setAttribute('data-motion', settings.motion)

  const style = typeStyle(HEADING_FONTS.find((f) => f.id === settings.headingFont) ?? HEADING_FONTS[0])
  for (const name of TYPE_PROPS) {
    if (name in style) root.style.setProperty(name, style[name])
    else root.style.removeProperty(name)
  }

  // The dice's look, beside the heading font's; the stylesheet's own values,
  // Slate with light numerals in the headings' face, are left to it.
  for (const [name, value] of Object.entries(diceStyle(settings.dice))) {
    if (value === DEFAULT_DICE_STYLE[name]) root.style.removeProperty(name)
    else root.style.setProperty(name, value)
  }
}

// A numeral face is loaded before the first roll needs it, so the first
// tumble never swaps faces mid-air. The headings' face is on every page
// already, and the device's own needs no loading.
export function preloadNumerals(settings: Settings, doc: Document = document): void {
  const font = numeralFont(settings.dice.font)
  const hf = HEADING_FONTS.find((f) => f.id === font.id)
  if (!hf || !doc.fonts) return
  const styles = getComputedStyle(doc.documentElement)
  const family = styles.getPropertyValue(hf.familyVar).trim()
  const weight = styles.getPropertyValue(hf.weightVar).trim()
  if (family) void doc.fonts.load(`${weight || 'normal'} 42px ${family}`, '0123456789').catch(() => {})
}
