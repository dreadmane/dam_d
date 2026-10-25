import { describe, expect, it } from 'vitest'
import tokens from '../../data/design/tokens.json'
import { contrastRatio as tokenContrast, flatten } from '../../scripts/lib/tokens.mjs'
import { blend, contrastRatio, DICE_DIES, DICE_INKS, dieLook, dieStyle, inkLook, inkOn, MIN_CONTRAST, numeralGrounds, readable, worstContrast } from './looks.ts'
import { overlay } from './shapes.ts'

const byPath = new Map(flatten(tokens).map((t) => [t.path, t]))

describe('the dice’s looks', () => {
  it('are the design system’s dice tokens, one hex in both themes', () => {
    for (const d of DICE_DIES) {
      const t = byPath.get(d.fill)
      expect(t?.value, d.id).toBe(d.hex)
      expect(t?.light, d.id).toBe(d.hex)
      if (d.edge) expect(byPath.has(d.edge), d.id).toBe(true)
    }
    for (const i of DICE_INKS) {
      const t = byPath.get(i.token)
      expect(t?.value, i.id).toBe(i.hex)
      expect(t?.light, i.id).toBe(i.hex)
    }
  })

  it('measure contrast as the token check does', () => {
    for (const d of DICE_DIES) for (const i of DICE_INKS) expect(contrastRatio(d.hex, i.hex)).toBeCloseTo(tokenContrast(d.hex, i.hex), 10)
  })

  it('light and shade a facet as the die draws it', () => {
    const lit = overlay(0.55, 'rest')
    expect(blend('#1f232b', lit.fill, lit.opacity)).toBe('#383b42')
    expect(blend('#ece6dc', '#000', 0.08)).toBe('#d9d4ca')
  })

  it('measure a numeral on the die and on the d20’s two facets it reaches', () => {
    expect(numeralGrounds(dieLook('slate'))).toEqual(['#1f232b', '#383b42', '#1d2028'])
  })

  // The pairs the approved mockup offered (the dice roll's brief, Colour and
  // font), now computed: each holds 4.5:1 everywhere a numeral sits.
  it('offer the numerals that read on each die, as the mockup did', () => {
    const offered = Object.fromEntries(DICE_DIES.map((d) => [d.id, DICE_INKS.filter((i) => readable(d.id, i.id)).map((i) => i.id)]))
    expect(offered).toEqual({
      slate: ['light', 'gold'],
      bone: ['ink', 'engraved'],
      marble: ['ink', 'engraved'],
      mana: ['ink'],
      coal: ['light', 'gold'],
    })
  })

  it.each(DICE_DIES.flatMap((d) => DICE_INKS.filter((i) => readable(d.id, i.id)).map((i) => [`${i.label} on ${d.label}: ${worstContrast(d, i).toFixed(2)}:1 at the least`, d, i] as const)))(
    '%s',
    (_, d, i) => {
      expect(worstContrast(d, i)).toBeGreaterThanOrEqual(MIN_CONTRAST)
    },
  )

  // Gold leaf in place of DCC's orange (user, 2026-10-23): the figures the
  // Journal pages concept measured, on the die and at its weakest facet.
  it('draw gold leaf on Slate and Coal at the figures the concept measured', () => {
    const gold = inkLook('gold')
    expect(gold.hex).toBe('#e0b85a')
    const measured = (die: 'slate' | 'coal') => [contrastRatio(dieLook(die).hex, gold.hex), worstContrast(dieLook(die), gold)].map((r) => r.toFixed(2))
    expect(measured('slate')).toEqual(['8.38', '5.97'])
    expect(measured('coal')).toEqual(['10.05', '7.55'])
  })

  it('give every die a numeral of its own that reads on it', () => {
    for (const d of DICE_DIES) expect(readable(d.id, d.ink), d.id).toBe(true)
    expect(DICE_DIES[0].id).toBe('slate')
  })

  it('keep a chosen numeral while it reads on the die, or take the die’s own', () => {
    expect(inkOn('slate', null)).toBe('light')
    expect(inkOn('slate', 'gold')).toBe('gold')
    expect(inkOn('marble', null)).toBe('engraved')
    expect(inkOn('marble', 'ink')).toBe('ink')
    expect(inkOn('marble', 'gold')).toBe('engraved')
    expect(inkOn('mana', 'engraved')).toBe('ink')
  })

  it('set every colour a die reads, so a sample shows only its own look', () => {
    expect(dieStyle('slate', 'light')).toEqual({
      '--dice-fill': 'var(--color-dice-slate)',
      '--dice-edge': 'var(--color-border-control)',
      '--dice-glint': '0.22',
      '--dice-veins': 'none',
      '--dice-ink': 'var(--color-dice-ink-light)',
    })
    expect(dieStyle('marble', 'engraved')).toMatchObject({ '--dice-fill': 'var(--color-dice-bone)', '--dice-glint': '0.38', '--dice-veins': 'inline', '--dice-ink': 'var(--color-dice-ink-engraved)' })
    expect(dieStyle('mana', 'ink')['--dice-edge']).toBe('var(--color-dice-slate)')
    expect(inkLook('ink').token).toBe('color.dice.ink-dark')
  })
})
