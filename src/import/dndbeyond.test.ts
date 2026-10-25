// Reading a D&D Beyond sheet's fields (dndbeyond.ts), on Brynn, the test
// sheet, as fields and as a PDF built and read back.

import { describe, expect, it } from 'vitest'
import { classesIn, featuresIn, numberIn, proficienciesIn, readDndBeyondSheet } from './dndbeyond.ts'
import { readPdfFields } from './pdf-fields.ts'
import { buildPdf, type TestWidget } from './test-pdf.ts'
import { brynnFields } from './test-sheet.ts'

describe('the sheet’s small readers', () => {
  it('reads each class and level in the printed order', () => {
    expect(classesIn('Monk 1 / Cleric 14')).toEqual([
      { name: 'Monk', level: 1 },
      { name: 'Cleric', level: 14 },
    ])
    expect(classesIn('Fighter 20')).toEqual([{ name: 'Fighter', level: 20 }])
  })

  it('reads numbers as printed, and a dash as none', () => {
    expect(numberIn('+7')).toBe(7)
    expect(numberIn('-1')).toBe(-1)
    expect(numberIn('23')).toBe(23)
    expect(numberIn('--')).toBeNull()
    expect(numberIn('(Milestone)')).toBeNull()
  })

  it('reads features, their picks and a level printed before the name, and skips uses and actions', () => {
    const features = featuresIn(['=== CLERIC FEATURES ===', '* Divine Order • PHB-2024 70', '   | Protector •', '* Channel Divinity • PHB-2024 70', '   | 3 / Long Rest • 1 Action', '   | Channel Divinity: Divine Spark: 1 Action', 'Some description the books print.', '* 8: Ability Score Improvement • PHB-2024 71', '=== FEATS ===', '* Lucky • PHB-2024 201', '   | Luck Points: 5 / Long Rest • Special'].join('\n'))
    expect(features).toEqual([
      { section: 'CLERIC FEATURES', name: 'Divine Order', source: 'PHB-2024 70', choices: ['Protector'] },
      { section: 'CLERIC FEATURES', name: 'Channel Divinity', source: 'PHB-2024 70', choices: [] },
      { section: 'CLERIC FEATURES', name: 'Ability Score Improvement', level: 8, source: 'PHB-2024 71', choices: [] },
      { section: 'FEATS', name: 'Lucky', source: 'PHB-2024 201', choices: [] },
    ])
  })

  it('reads the proficiencies by section', () => {
    expect(proficienciesIn('=== ARMOR === \nLight Armor, Shields\n\n=== WEAPONS ===\nSimple Weapons\n=== LANGUAGES ===\nCommon')).toEqual({ armor: ['Light Armor', 'Shields'], weapons: ['Simple Weapons'], tools: [], languages: ['Common'] })
  })
})

describe('Brynn’s sheet', () => {
  const sheet = readDndBeyondSheet(brynnFields())!

  it('is a D&D Beyond sheet, and a PDF’s fields without its name and class line are not', () => {
    expect(sheet).not.toBeNull()
    expect(readDndBeyondSheet([{ page: 1, name: 'Name', value: 'Someone' }])).toBeNull()
  })

  it('reads who Brynn is', () => {
    expect(sheet.name).toBe('Brynn')
    expect(sheet.classes).toEqual([
      { name: 'Fighter', level: 2 },
      { name: 'Cleric', level: 5 },
    ])
    expect(sheet.species).toBe('Locathah')
    expect(sheet.background).toBe('Acolyte')
    expect(sheet.milestone).toBe(true)
    expect(sheet.alignment).toBe('Lawful Good')
  })

  it('reads the scores and the saves marked proficient', () => {
    expect(sheet.scores).toEqual({ str: 14, dex: 13, con: 14, int: 10, wis: 17, cha: 11 })
    expect(Object.entries(sheet.saveProficient).filter(([, p]) => p).map(([a]) => a)).toEqual(['wis', 'cha'])
  })

  it('reads the skills marked, a name with a trailing space included', () => {
    expect(sheet.skills.filter((s) => s.mark).map((s) => s.name)).toEqual(['History', 'Insight', 'Medicine', 'Religion'])
  })

  it('joins the features text split across fields between its lines', () => {
    expect(sheet.features.find((f) => f.name === 'Fighting Style')?.choices).toEqual(['Defense'])
    expect(sheet.features.find((f) => f.name === 'Cleric Subclass')?.choices).toEqual(['Life Domain'])
  })

  it('reads the items on page 2 and on the overflow page, whose rows reuse page 3’s names', () => {
    expect(sheet.items.map((i) => [i.name, i.quantity, i.weight])).toEqual([
      ['Chain Mail', 1, 55],
      ['Shield', 1, 6],
      ['Bracers of Defense +1, Clamshell', 1, null],
      ['Traveler’s Clothes', 1, 4],
      ['Hearthguard Longsword, w/Ward', 1, 3],
      ['Sun Blade', 1, 3],
      ['*Old Faithful', 1, 3],
      ['*Odd Tome', 1, 1],
      ['*Mystery Pearl', 3, 0.5],
    ])
    expect(sheet.attuned).toEqual(['Bracers of Defense +1, Clamshell'])
    expect(sheet.coins.gp).toBe(15)
  })

  it('reads the attack lines, whatever the spaces after their field names', () => {
    expect(sheet.attacks).toEqual([
      { name: '*Old Faithful', bonus: 5, damage: '1d8+2 Slashing', notes: 'Martial, Versatile, Sap' },
      { name: 'Sun Blade', bonus: 7, damage: '1d8+4 Radiant', notes: '+1d8 Radiant, Martial, Versatile, Sap, Finesse' },
      { name: '*Odd Tome', bonus: 3, damage: '1d6+1 Piercing', notes: 'Simple, Finesse, Light, Thrown, Nick, Range (20/60)' },
    ])
  })

  it('gives each spell the level of the header above it, its mark and its source', () => {
    const at = (name: string) => sheet.spells.find((s) => s.name === name)
    expect(sheet.spells).toHaveLength(19)
    expect(at('Guidance')).toMatchObject({ level: 0, source: 'Cleric', mark: 'O' })
    expect(at('Bless')).toMatchObject({ level: 1, mark: '●' })
    expect(at('Cure Wounds')).toMatchObject({ level: 1, source: 'Cleric (Always Prepared)', mark: 'P' })
    expect(at('Detect Magic')).toMatchObject({ level: 1, ritual: true })
    expect(at('Spirit Guardians')).toMatchObject({ level: 3 })
  })

  it('reads the hit points: no current HP printed is none, and a dash of temporary HP is 0', () => {
    expect(sheet.hitPoints).toEqual({ current: null, temp: 0 })
  })

  it('keeps the player’s own words and the figures for the check', () => {
    expect(sheet.details).toEqual([
      { label: 'Eyes', text: 'Grey' },
      { label: 'Backstory', text: 'Raised in a lighthouse.' },
    ])
    expect(sheet.printed).toMatchObject({ ac: 19, maxHp: 54, proficiency: 3, initiative: 1, passivePerception: 13, spellcasting: [{ className: 'Cleric', ability: 'WIS', saveDc: 14, attack: 6 }] })
  })
})

describe('from a PDF', () => {
  it('reads the same sheet from a PDF made of Brynn’s fields', async () => {
    // Each field a widget on its page, its value a literal string, with
    // backslashes, parentheses and line breaks escaped as a PDF writes them.
    const literal = (s: string) => `(${s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\n/g, '\\n')})`
    // A non-Latin-1 character goes as UTF-16, as D&D Beyond's bullet does.
    const text = (s: string) => (/^[\x20-\xff\n]*$/.test(s) ? literal(s) : `<FEFF${[...s].map((c) => c.charCodeAt(0).toString(16).padStart(4, '0')).join('')}>`)
    const fields = brynnFields()
    const pages = Math.max(...fields.map((f) => f.page))
    const pdf = await buildPdf({
      pages: Array.from({ length: pages }, (_, i) => ({ widgets: fields.filter((f) => f.page === i + 1).map((f): TestWidget => ({ T: text(f.name), V: text(f.value) })) })),
    })
    const read = await readPdfFields(pdf)
    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(readDndBeyondSheet(read.fields)).toEqual(readDndBeyondSheet(fields))
  })
})
