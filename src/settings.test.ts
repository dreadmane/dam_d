import { describe, expect, it } from 'vitest'
import { readTokensCss } from '../scripts/lib/tokens.mjs'
import { applySettings, DEFAULT_SETTINGS, diceStyle, HEADING_FONTS, NUMERAL_FONTS, parseSettings } from './settings.ts'

// A stand-in for <html> that records what applySettings did.
function fakeRoot() {
  const attrs = new Map<string, string>()
  const props = new Map<string, string>()
  return {
    attrs,
    props,
    setAttribute: (k: string, v: string) => void attrs.set(k, v),
    removeAttribute: (k: string) => void attrs.delete(k),
    style: {
      setProperty: (k: string, v: string | null) => void props.set(k, v ?? ''),
      removeProperty: (k: string) => {
        props.delete(k)
        return ''
      },
    },
  }
}

describe('settings', () => {
  it('reads what was saved', () => {
    expect(parseSettings('{"theme":"light","headingFont":"book"}')).toEqual({ ...DEFAULT_SETTINGS, theme: 'light', headingFont: 'book' })
  })

  it.each([
    ['nothing saved', null],
    ['damaged JSON', '{"theme":'],
    ['unknown values', '{"theme":"sepia","headingFont":"comic-sans"}'],
  ])('falls back to the defaults for %s', (_, raw) => {
    expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS)
  })

  it('flashes notifications unless that was saved off, the quiet setting', () => {
    expect(parseSettings(null).flashes).toBe(true)
    expect(parseSettings('{"flashes":false}').flashes).toBe(false)
    expect(parseSettings('{"flashes":"off"}').flashes).toBe(true)
  })

  it('keeps each valid field when another is bad', () => {
    expect(parseSettings('{"theme":"dark","headingFont":"nope"}')).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' })
  })

  it('System leaves the theme to the device; Dark and Light pin it', () => {
    const root = fakeRoot()
    applySettings({ ...DEFAULT_SETTINGS, theme: 'light', headingFont: 'alegreya' }, root)
    expect(root.attrs.get('data-theme')).toBe('light')
    applySettings({ ...DEFAULT_SETTINGS, theme: 'system', headingFont: 'alegreya' }, root)
    expect(root.attrs.has('data-theme')).toBe(false)
  })

  it('the Journal is the look unless Classic was saved (user, 2026-10-20), and data-look names it', () => {
    expect(DEFAULT_SETTINGS.look).toBe('journal')
    expect(parseSettings('{"look":"classic"}').look).toBe('classic')
    expect(parseSettings('{"look":"scroll"}').look).toBe('journal')
    // Settings saved before the switch existed: the Journal.
    expect(parseSettings('{"theme":"dark"}').look).toBe('journal')
    const root = fakeRoot()
    applySettings(DEFAULT_SETTINGS, root)
    expect(root.attrs.get('data-look')).toBe('journal')
    applySettings({ ...DEFAULT_SETTINGS, look: 'classic' }, root)
    expect(root.attrs.get('data-look')).toBe('classic')
  })

  it('motion follows the device unless pinned: System removes the attribute, Reduce and Full set it', () => {
    expect(DEFAULT_SETTINGS.motion).toBe('system')
    expect(parseSettings('{"motion":"reduce"}').motion).toBe('reduce')
    expect(parseSettings('{"motion":"fast"}').motion).toBe('system')
    const root = fakeRoot()
    applySettings({ ...DEFAULT_SETTINGS, motion: 'reduce' }, root)
    expect(root.attrs.get('data-motion')).toBe('reduce')
    applySettings({ ...DEFAULT_SETTINGS, motion: 'full' }, root)
    expect(root.attrs.get('data-motion')).toBe('full')
    applySettings({ ...DEFAULT_SETTINGS, motion: 'system' }, root)
    expect(root.attrs.has('data-motion')).toBe(false)
  })

  it('Beyond sets condensed capitals, its face on the chrome, and Cormorant SC for the name; Alegreya removes them', () => {
    const root = fakeRoot()
    applySettings({ ...DEFAULT_SETTINGS, theme: 'system', headingFont: 'beyond' }, root)
    expect(Object.fromEntries(root.props)).toEqual({
      '--heading-font-family': 'var(--font-family-display-beyond)',
      '--heading-font-weight': 'var(--font-weight-display-beyond)',
      '--heading-case': 'uppercase',
      '--chrome-font-family': 'var(--font-family-display-beyond)',
      '--chrome-font-weight': 'var(--font-weight-display-beyond)',
      '--name-font-family': 'var(--font-family-name-book)',
      '--name-font-weight': 'var(--font-weight-name-book)',
    })
    applySettings({ ...DEFAULT_SETTINGS, theme: 'system', headingFont: 'alegreya' }, root)
    expect(root.props.size).toBe(0)
  })

  it('Book sets only its faces: mixed case and the body face on the chrome are the default style’s too', () => {
    const root = fakeRoot()
    applySettings({ ...DEFAULT_SETTINGS, theme: 'system', headingFont: 'book' }, root)
    expect(Object.fromEntries(root.props)).toEqual({
      '--heading-font-family': 'var(--font-family-display-book)',
      '--heading-font-weight': 'var(--font-weight-display-book)',
      '--name-font-family': 'var(--font-family-name-book)',
      '--name-font-weight': 'var(--font-weight-name-book)',
    })
  })

  it('Alegreya is the default; a face saved before the three styles, such as League Spartan, falls back to it', () => {
    expect(DEFAULT_SETTINGS.headingFont).toBe('alegreya')
    expect(HEADING_FONTS.map((f) => f.label)).toEqual(['Alegreya', 'Beyond', 'Book'])
    expect(parseSettings('{"headingFont":"book"}').headingFont).toBe('book')
    for (const old of ['league-spartan', 'jost', 'barlow', 'anton', 'staatliches']) expect(parseSettings(`{"headingFont":"${old}"}`).headingFont).toBe('alegreya')
  })

  it('shows the dice when you roll unless that was saved off; Slate, its own numerals and the headings’ face by default', () => {
    expect(parseSettings(null).dice).toEqual({ show: true, die: 'slate', ink: null, font: 'headings' })
    expect(parseSettings('{"dice":{"show":false}}').dice.show).toBe(false)
    expect(parseSettings('{"dice":{"show":"no"}}').dice.show).toBe(true)
    expect(parseSettings('{"dice":"marble"}').dice).toEqual(DEFAULT_SETTINGS.dice)
  })

  it('reads a saved die, numeral and face, and falls back field by field', () => {
    expect(parseSettings('{"dice":{"die":"marble","ink":"ink","font":"book"}}').dice).toEqual({ show: true, die: 'marble', ink: 'ink', font: 'book' })
    expect(parseSettings('{"dice":{"die":"brass","ink":"teal","font":"comic-sans"}}').dice).toEqual(DEFAULT_SETTINGS.dice)
    // Gold leaf would not read on Bone: the die's own numerals instead.
    expect(parseSettings('{"dice":{"die":"bone","ink":"gold"}}').dice.ink).toBeNull()
  })

  // DCC's Orange numerals became Gold leaf (user, 2026-10-23).
  it('reads Orange numerals saved before gold leaf replaced them as Gold leaf', () => {
    expect(parseSettings('{"dice":{"die":"slate","ink":"orange"}}').dice).toEqual({ ...DEFAULT_SETTINGS.dice, ink: 'gold' })
    expect(parseSettings('{"dice":{"die":"coal","ink":"orange","font":"plain"}}').dice).toEqual({ show: true, die: 'coal', ink: 'gold', font: 'plain' })
    // Saved without a die, it is on the default Slate, where gold leaf reads.
    expect(parseSettings('{"dice":{"ink":"orange"}}').dice.ink).toBe('gold')
    // Still the die's own where gold leaf would not read, as Orange was.
    expect(parseSettings('{"dice":{"die":"bone","ink":"orange"}}').dice.ink).toBeNull()
    expect(parseSettings('{"dice":{"die":"mana","ink":"orange"}}').dice.ink).toBeNull()
  })

  it('the default dice leave the stylesheet’s look alone; another die, numeral or face sets the dice’s properties', () => {
    const root = fakeRoot()
    applySettings({ ...DEFAULT_SETTINGS, dice: { show: true, die: 'marble', ink: null, font: 'book' } }, root)
    expect(Object.fromEntries(root.props)).toEqual({
      '--dice-fill': 'var(--color-dice-bone)',
      '--dice-glint': '0.38',
      '--dice-veins': 'inline',
      '--dice-ink': 'var(--color-dice-ink-engraved)',
      '--dice-font-family': 'var(--font-family-display-book)',
      '--dice-font-weight': 'var(--font-weight-display-book)',
    })
    applySettings({ ...DEFAULT_SETTINGS, dice: { show: false, die: 'slate', ink: 'gold', font: 'plain' } }, root)
    expect(Object.fromEntries(root.props)).toEqual({ '--dice-ink': 'var(--color-dice-ink-gold)', '--dice-font-family': 'var(--font-family-body)', '--dice-font-weight': '600' })
    applySettings(DEFAULT_SETTINGS, root)
    expect(root.props.size).toBe(0)
  })

  it('copies rolls for Roll20 only if that was saved on', () => {
    expect(parseSettings(null).roll20).toEqual({ copy: false })
    expect(parseSettings('{"roll20":{"copy":true}}').roll20).toEqual({ copy: true })
    expect(parseSettings('{"roll20":{"copy":"yes"}}').roll20.copy).toBe(false)
    expect(parseSettings('{"roll20":null}').roll20).toEqual(DEFAULT_SETTINGS.roll20)
  })

  it('keeps the optional rules off unless each was saved on (C2, C3)', () => {
    expect(parseSettings(null).rules).toEqual({ rolledHp: false, milestone: false })
    expect(parseSettings('{"rules":{"rolledHp":true}}').rules).toEqual({ rolledHp: true, milestone: false })
    expect(parseSettings('{"rules":{"milestone":true,"rolledHp":"yes"}}').rules).toEqual({ rolledHp: false, milestone: true })
    expect(parseSettings('{"rules":null}').rules).toEqual(DEFAULT_SETTINGS.rules)
  })

  // The Phosphor skin (2026-10-15 to 2026-10-19) saved a tube and Tube
  // effects. They load as any other settings: the classic look's own fields
  // are kept, and the skin's are dropped and never reach the page.
  it('ignores a tube and Tube effects saved under Phosphor, keeping the rest', () => {
    const saved = '{"tube":"amber","tubeEffects":false,"theme":"light","dice":{"show":false}}'
    expect(() => parseSettings(saved)).not.toThrow()
    expect(parseSettings(saved)).toEqual({ ...DEFAULT_SETTINGS, theme: 'light', dice: { ...DEFAULT_SETTINGS.dice, show: false } })
    const root = fakeRoot()
    applySettings(parseSettings(saved), root)
    expect([...root.attrs.keys()].sort()).toEqual(['data-look', 'data-theme'])
    expect(root.props.size).toBe(0)
  })

  // Crawler Interface's GM allowances, Spoilers and Profanity, which a device
  // that ran it on the same address may hold, are dropped the same way.
  it('ignores GM allowances, Spoilers and Profanity, keeping the rest', () => {
    const saved = '{"gm":{"dyingCountdownCon":true},"showSpoilers":false,"profanity":false,"flashes":false}'
    expect(parseSettings(saved)).toEqual({ ...DEFAULT_SETTINGS, flashes: false })
  })

  it('a sample of one look sets every property, so the page’s choice never shows through it', () => {
    expect(Object.keys(diceStyle({ die: 'slate', ink: null, font: 'headings' })).sort()).toEqual([
      '--dice-edge',
      '--dice-fill',
      '--dice-font-family',
      '--dice-font-weight',
      '--dice-glint',
      '--dice-ink',
      '--dice-veins',
    ])
  })

  it('every heading font names tokens that exist', () => {
    const css = readTokensCss()
    for (const f of HEADING_FONTS) {
      expect(css, f.familyVar).toContain(`${f.familyVar}:`)
      expect(css, f.weightVar).toContain(`${f.weightVar}:`)
    }
  })

  it('every numeral face names tokens that exist: the headings’, the body’s and each heading font’s', () => {
    const css = readTokensCss()
    expect(NUMERAL_FONTS.map((f) => f.label)).toEqual(['Same as headings', 'Plain', 'Alegreya SC', 'Roboto Condensed', 'Cormorant SC'])
    for (const f of NUMERAL_FONTS) for (const name of `${f.family} ${f.weight}`.match(/--[\w-]+/g) ?? []) if (!name.startsWith('--heading-')) expect(css, name).toContain(`${name}:`)
  })
})
