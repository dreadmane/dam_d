// The book file (books.ts): reading one, and its records joining the SRD's.
// Made-up records only: no book's content belongs in the repo (the spec
// §4.2, dnd-rules CONTEXT).

import { describe, expect, it } from 'vitest'
import { optionsFor } from '../play/options.ts'
import fighter from '../save/examples/fighter.json'
import type { CharacterEntity } from '../save/types.ts'
import { bookCounts, readBookFile, withBooks, type BookFile } from './books.ts'
import { deriveSheet } from './derive.ts'
import type { OwedChoice } from './level.ts'
import { indexRules } from './load.ts'
import { testRules } from './test-rules.ts'

const srd = testRules()
const meta = { dataVersion: '0.1.0', extractedOn: '2026-10-19', complete: true, tier: 'books', textPolicy: 'restated' }
const source = { ref: 'phb-2024', section: 'Test > Made up' }

const subclass = {
  id: 'way-of-the-test',
  classId: 'fighter',
  name: 'Way of the Test',
  features: [{ id: 'test-feature', name: 'Test Feature', level: 3, text: 'A made-up feature for the tests.', effects: [], source, confidence: 'printed' }],
  source,
  confidence: 'printed',
}
const spell = { ...srd.spells.get('detect-magic')!, id: 'test-divination', name: 'Test Divination', source }
const book: BookFile = {
  kind: 'd-amp-d-books',
  formatVersion: 1,
  builtOn: '2026-10-19',
  booksVersion: 'abc123',
  files: {
    classes: { meta, classes: [], subclasses: [subclass] },
    // One the SRD already has, which stays the SRD's.
    spells: { meta, spells: [spell, { ...srd.spells.get('fireball')!, name: 'Not the SRD’s', source }] },
  },
}

describe('reading a book file', () => {
  it('reads one, and counts what it holds', () => {
    const read = readBookFile(JSON.stringify(book))
    expect(read.ok).toBe(true)
    if (read.ok) expect(bookCounts(read.file)).toEqual([
      { name: 'classes', count: 1 },
      { name: 'spells', count: 2 },
    ])
  })

  it('refuses what isn’t one, in words', () => {
    expect(readBookFile('not json')).toEqual({ ok: false, error: 'This isn’t a JSON file.' })
    expect(readBookFile(JSON.stringify({ id: 'x', schemaVersion: 1 }))).toMatchObject({ ok: false, error: expect.stringContaining('isn’t a dam’d book file') })
    expect(readBookFile(JSON.stringify({ ...book, formatVersion: 2 }))).toMatchObject({ ok: false, error: expect.stringContaining('format 2') })
    const srdTier = { ...book, files: { spells: { meta: { ...meta, tier: 'srd', textPolicy: 'srd-verbatim' }, spells: [] } } }
    expect(readBookFile(JSON.stringify(srdTier))).toMatchObject({ ok: false, error: expect.stringContaining('isn’t marked as the restated books tier') })
  })
})

describe('the book’s records joining the SRD’s', () => {
  const rules = indexRules(withBooks(srd.data, book))

  it('adds a subclass to its class and a spell to the lists, and keeps the SRD’s record where both have one', () => {
    expect(rules.subclasses.get('way-of-the-test')?.classId).toBe('fighter')
    expect(rules.spells.get('test-divination')?.name).toBe('Test Divination')
    expect(rules.spells.get('fireball')?.name).toBe('Fireball')
    expect(rules.spells.size).toBe(srd.spells.size + 1)
    // On the lists of the classes it names (Detect Magic's), and no other.
    for (const c of rules.classes.values()) expect(c.spellList?.includes('test-divination') ?? false).toBe(spell.classes.includes(c.id))
    expect(rules.classes.get('wizard')!.spellList!.filter((id) => id === 'fireball')).toHaveLength(1)
  })

  it('leaves the SRD alone without a book file', () => {
    expect(withBooks(srd.data, null)).toBe(srd.data)
  })

  it('applies a book subclass’s features on the sheet', () => {
    const e = structuredClone(fighter.entities[0]) as unknown as CharacterEntity
    const three = { ...e, classes: [{ ...e.classes[0], level: 3, subclassId: 'way-of-the-test', hp: [1, 2, 3].map((level) => ({ level, method: level === 1 ? ('max' as const) : ('fixed' as const) })) }] }
    expect(deriveSheet(rules, three).features.some((g) => g.feature.id === 'test-feature')).toBe(true)
  })
})

describe('the queries the book records use', () => {
  const e = structuredClone(fighter.entities[0]) as unknown as CharacterEntity
  const sheet = deriveSheet(srd, e)
  const owed = (from: string): OwedChoice => ({ source: 'feat:test', choice: 'test', label: 'Test', count: 1, from, origin: { id: 'test', name: 'Test' } })

  it('takes either of two schools', () => {
    const schools = new Set(optionsFor(srd, e, sheet, owed('spells:level-1-divination-or-enchantment'))!.map((o) => srd.spells.get(o.id)!.school))
    expect([...schools].sort()).toEqual(['divination', 'enchantment'])
  })

  it('keeps a class’s levelled spells for the levels a subclass has slots for', () => {
    const list = optionsFor(srd, e, sheet, owed('spells:wizard-available-slot-levels'))!
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((o) => srd.spells.get(o.id)!.level >= 1 && srd.spells.get(o.id)!.classes.includes('wizard'))).toBe(true)
  })

  it('gives the artisan’s tools for Artisan’s Tools', () => {
    const list = optionsFor(srd, e, sheet, owed('tools:artisans-tools'))!
    expect(list.length).toBeGreaterThan(5)
    expect(list.every((o) => srd.data.equipment.tools.find((t) => t.id === o.id)?.kind === 'artisan')).toBe(true)
  })
})
