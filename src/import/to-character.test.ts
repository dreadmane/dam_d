// A D&D Beyond sheet as a character (to-character.ts), on Brynn, the test
// sheet, with the SRD's rules alone: what is looked up, what is kept by
// name, what is placed, and the check against the sheet's own figures.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import { idName, unresolved } from '../rules/unresolved.ts'
import { readDndBeyondSheet } from './dndbeyond.ts'
import { brynnFields } from './test-sheet.ts'
import { checkRows, idOf, placeIncreases, sheetToCharacter } from './to-character.ts'

const rules = testRules()
const ddb = readDndBeyondSheet(brynnFields())!
let n = 0
const imported = sheetToCharacter(rules, ddb, () => `id-${++n}`)
const { entity, report } = imported
const picked = (source: string, choice: string) => entity.choices.find((c) => c.source === source && c.choice === choice)?.values

describe('who Brynn is', () => {
  it('takes the class whose saves the sheet marks as the first, whatever the printed order', () => {
    expect(entity.classes.map((c) => [c.classId, c.level])).toEqual([
      ['cleric', 5],
      ['fighter', 2],
    ])
    expect(entity.classOrder).toEqual(['cleric', 'fighter'])
  })

  it('works each level’s hit points as the sheet does: the die’s maximum first, then the fixed value', () => {
    expect(entity.classes[0].hp[0].method).toBe('max')
    expect(entity.classes.flatMap((c) => c.hp).filter((h) => h.method === 'fixed')).toHaveLength(6)
  })

  it('finds the subclass and the background by name', () => {
    expect(entity.classes[0].subclassId).toBe('life-domain')
    expect(entity.background?.backgroundId).toBe('acolyte')
  })

  it('keeps a species the rules lack as its id, and says so', () => {
    expect(entity.species?.speciesId).toBe('locathah')
    expect(report.keptByName).toContainEqual({ what: 'species', name: 'Locathah' })
  })
})

describe('the choices the sheet answers', () => {
  it('matches a feature’s pick to the option of the same name', () => {
    expect(picked('class:cleric:1', 'divine-order')).toEqual(['thaumaturge'])
    expect(picked('class:fighter:1', 'fighting-style')).toEqual(['defense'])
  })

  it('puts the sheet’s feats in the feat slots owed, the background’s own left out', () => {
    expect(picked('class:cleric:4', 'ability-score-improvement')).toEqual(['grappler'])
    expect(entity.choices.some((c) => c.values.includes('magic-initiate'))).toBe(false)
  })

  it('keeps a feat the rules lack in its slot as its id, and says which is left over', () => {
    // Brynn's sheet with PHB records the SRD lacks, as on a device without
    // the book file: the background Wayfarer, its Lucky, and War Caster at
    // Cleric 4.
    const phb = readDndBeyondSheet(brynnFields().map((f) => ({ ...f, value: f.value.replaceAll('Acolyte', 'Wayfarer').replace('Grappler • PHB-2024 205', 'War Caster • PHB-2024 208').replace('Magic Initiate • PHB-2024 203', 'Lucky • PHB-2024 202') })))!
    const { entity: e, report: r } = sheetToCharacter(rules, phb, () => `phb-${++n}`)
    expect(e.choices.find((c) => c.source === 'class:cleric:4' && c.choice === 'ability-score-improvement')?.values).toEqual(['war-caster'])
    expect(r.keptByName).toContainEqual({ what: 'feat', name: 'War Caster' })
    expect(r.leftOut).toContainEqual(expect.stringMatching(/^Lucky: .*Wayfarer/))
  })

  it('fills a skill choice the sheet answers only one way', () => {
    // Acolyte gives Insight and Religion; of the Cleric's list the sheet
    // marks only History and Medicine besides.
    expect(picked('class:cleric:1', 'class-skills')?.toSorted()).toEqual(['history', 'medicine'])
  })
})

describe('the spells', () => {
  const ids = entity.spells.map((s) => s.spellId)

  it('saves the cantrips, and of a whole list printed, only the spells marked', () => {
    expect(ids).toEqual(['guidance', 'sacred-flame', 'thaumaturgy', 'moment-to-think', 'bless', 'arcanists-magic-aura'])
    expect(entity.spells.every((s) => s.classId === 'cleric' && s.source === 'class:cleric' && s.prepared)).toBe(true)
  })

  it('reads D&D Beyond’s older name for an SRD spell', () => {
    expect(ids).toContain('arcanists-magic-aura')
  })

  it('leaves out a spell the sheet says is always prepared: its feature gives it', () => {
    expect(ids).not.toContain('cure-wounds')
  })

  it('keeps a cantrip the rules lack by name', () => {
    expect(report.keptByName).toContainEqual({ what: 'Cleric cantrip', name: 'Moment to Think' })
  })
})

describe('the items', () => {
  const item = (name: string) => entity.inventory.find((i) => i.name === name)

  it('finds an item by the catalogue’s own word order', () => {
    expect(item('Traveler’s Clothes')?.itemId).toBe('equipment:clothes-travelers')
  })

  it('finds a renamed magic item, keeps the sheet’s name for it, and marks it attuned and worn', () => {
    expect(item('Bracers of Defense +1, Clamshell')).toMatchObject({ itemId: 'magic-items:bracers-of-defense', attuned: true, worn: true })
  })

  it('puts on the one way of wearing the armor carried that gives the sheet’s AC', () => {
    expect(item('Chain Mail')?.worn).toBe(true)
    expect(item('Shield')?.worn).toBe(true)
    expect(report.cameIn).toContain('Wearing Chain Mail and Shield, as the sheet’s AC shows')
    expect(checkRows(rules, entity, ddb).find((r) => r.label === 'AC')).toMatchObject({ theirs: '19', ours: '19', same: true })
  })

  it('wears nothing when no way of wearing it gives the sheet’s AC', () => {
    const odd = sheetToCharacter(rules, { ...ddb, printed: { ...ddb.printed, ac: 30 } }, () => `odd-${++n}`)
    expect(odd.entity.inventory.filter((i) => ['Chain Mail', 'Shield'].includes(i.name) && i.worn)).toEqual([])
  })

  it('counts the spells that came in, cantrips and prepared apart', () => {
    expect(report.cameIn).toContain('Cleric spells: 3 cantrips, 2 prepared')
  })

  it('makes an item the rules lack a custom one, with the sheet’s quantity and weight and no effects', () => {
    const pearl = item('Mystery Pearl')
    expect(pearl).toMatchObject({ quantity: 3, weight: 0.5 })
    expect(pearl?.itemId).toBeUndefined()
    expect(pearl?.effects).toBeUndefined()
    expect(report.customItems).toEqual(['Odd Tome', 'Mystery Pearl'])
  })
})

describe('the weapons', () => {
  const item = (name: string) => entity.inventory.find((i) => i.name === name)
  const attacks = deriveSheet(rules, entity).attacks.map((a) => a.name)

  it('finds a weapon by the last word of a name the player gave it, keeping that name', () => {
    expect(item('Hearthguard Longsword, w/Ward')?.itemId).toBe('equipment:longsword')
    expect(report.cameIn).toContain('Hearthguard Longsword, w/Ward: a Longsword, by its name')
  })

  it('gives a magic weapon its base', () => {
    expect(item('Sun Blade')).toMatchObject({ itemId: 'magic-items:sun-blade', baseItemId: 'equipment:longsword' })
  })

  it('takes a homebrew weapon as the one weapon its attack line fits: its die, damage type, properties and mastery', () => {
    expect(item('Old Faithful')?.itemId).toBe('equipment:longsword')
    expect(report.cameIn).toContain('Old Faithful: a Longsword, from its attack line')
  })

  it('leaves a weapon custom when no one weapon fits its attack line', () => {
    expect(item('Odd Tome')?.itemId).toBeUndefined()
  })

  it('equips the weapons on the sheet’s attack lines, and only those: they are the attacks', () => {
    expect(item('Sun Blade')?.worn).toBe(true)
    expect(item('Old Faithful')?.worn).toBe(true)
    expect(item('Hearthguard Longsword, w/Ward')?.worn).toBe(false)
    expect(attacks).toEqual(expect.arrayContaining(['Sun Blade', 'Old Faithful']))
    expect(attacks).not.toContain('Hearthguard Longsword, w/Ward')
    expect(attacks).not.toContain('Odd Tome')
    expect(report.cameIn).toContain('Equipped: Sun Blade, Old Faithful, as the sheet’s attack lines show')
  })
})

describe('the scores and the check', () => {
  it('asks where the background’s +2 and +1 and the feat’s +1 went', () => {
    expect(report.placements.map((p) => [p.key, p.amounts, p.abilities])).toEqual([
      ['background', [2, 1], ['int', 'wis', 'cha']],
      ['class:cleric:4>feat:grappler|ability-increase', [1], ['str', 'dex']],
    ])
  })

  it('keeps the sheet’s scores with nothing placed', () => {
    expect(checkRows(rules, entity, ddb).find((r) => r.label === 'Scores')?.same).toBe(true)
  })

  it('works the base scores back from the sheet’s once they are placed, so the totals stay the sheet’s', () => {
    const placed = placeIncreases(rules, imported, ddb, { background: ['wis', 'cha'], 'class:cleric:4>feat:grappler|ability-increase': ['str'] })
    expect(placed.background?.abilityIncreases).toEqual({ wis: 2, cha: 1 })
    expect(placed.abilities.base).toMatchObject({ str: 13, wis: 15, cha: 10 })
    expect(placed.abilities.generation.method).toBe('entered')
    const rows = checkRows(rules, placed, ddb)
    for (const label of ['Scores', 'Max HP', 'Proficiency', 'Initiative', 'Spell save DC', 'Spell attack']) expect(rows.find((r) => r.label === label), label).toMatchObject({ same: true })
    expect(deriveSheet(rules, placed).unmade.some((o) => o.increase)).toBe(false)
  })

  it('starts at full hit points where the sheet prints no current HP, not at 0, which reads as dying', () => {
    expect(entity.hp).toEqual({ current: 54, temp: 0 })
    expect(placeIncreases(rules, imported, ddb, {}).hp).toEqual({ current: 54, temp: 0 })
  })

  it('starts at the hit points the sheet prints', () => {
    const hurt = { ...ddb, hitPoints: { current: 30, temp: 5 } }
    const again = sheetToCharacter(rules, hurt, () => `hurt-${++n}`)
    expect(placeIncreases(rules, again, hurt, {}).hp).toEqual({ current: 30, temp: 5 })
  })

  it('leaves a placement made only in part unplaced', () => {
    const placed = placeIncreases(rules, imported, ddb, { background: ['wis'] })
    expect(placed.background?.abilityIncreases).toEqual({})
  })
})

describe('the player’s own words, and what is left out', () => {
  it('puts the details in the appearance and the backstory in the notes', () => {
    expect(entity.details.appearance).toBe('Eyes: Grey')
    expect(entity.notes.startsWith('Backstory\nRaised in a lighthouse.')).toBe(true)
    expect(entity.details.alignment).toBe('Lawful Good')
  })

  it('keeps a language the rules don’t name in the notes, not as an id the language choices would count', () => {
    expect(entity.details.languages).toContain('common')
    expect(entity.details.languages).not.toContain('aquan')
    expect(entity.notes.endsWith('Languages from D&D Beyond\nAquan')).toBe(true)
    expect(report.leftOut).toContain('Aquan: a language the rules don’t name, kept in the notes')
  })

  it('says what it leaves out', () => {
    expect(report.leftOut.some((l) => l.startsWith('The rest of the Cleric list'))).toBe(true)
  })

  it('starts the character at any level, not yet finished, so Levels opens with Finish', () => {
    expect(entity.creation).toEqual({ route: 'any-level', complete: false })
    expect(entity.levelling.mode).toBe('milestone')
  })
})

describe('names the rules lack', () => {
  it('turns a name into an id and back', () => {
    expect(idOf('Arcana Domain')).toBe('arcana-domain')
    expect(idOf('Hammertme/Inky')).toBe('hammertme-inky')
    expect(idName('moment-to-think')).toBe('Moment to Think')
    expect(unresolved('arcana-domain')).toBe('Arcana Domain (unresolved)')
  })

  it('says an unknown subclass by name on the sheet, never as its bare id', () => {
    const withUnknown = { ...entity, classes: entity.classes.map((c) => (c.classId === 'cleric' ? { ...c, subclassId: 'arcana-domain' } : c)) }
    expect(deriveSheet(rules, withUnknown).classes[0].subclass).toBe('Arcana Domain (unresolved)')
  })
})
