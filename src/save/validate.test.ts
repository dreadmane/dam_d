// The hand-rolled validator against ajv, the reference implementation that
// validates the fixtures in schema.test.ts. Every fixture, and hundreds of
// deliberately broken copies of one, must get the same verdict from both.

import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import blankJson from './fixtures/roster-v1-blank.json'
import filledJson from './fixtures/roster-v1-filled.json'
import { validate } from './validate.ts'

const schemas = import.meta.glob<Record<string, unknown>>('./schemas/roster-v*.schema.json', { eager: true, import: 'default' })
const fixtures = import.meta.glob<unknown>('./fixtures/roster-v*-*.json', { eager: true, import: 'default' })
const v1 = schemas['./schemas/roster-v1.schema.json']

function ajvFor(schema: object) {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  addFormats(ajv)
  return ajv.compile(schema)
}

// Every path to a value in the record: [] is the root, ['entities', 0] …
function paths(value: unknown, trail: (string | number)[] = []): (string | number)[][] {
  const out = [trail]
  if (Array.isArray(value)) value.forEach((v, i) => out.push(...paths(v, [...trail, i])))
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) out.push(...paths(v, [...trail, k]))
  }
  return out
}

function withChange(record: unknown, path: (string | number)[], change: (parent: any, key: string | number) => void) {
  const copy = structuredClone(record)
  if (path.length === 0) return copy
  let parent: any = copy
  for (const key of path.slice(0, -1)) parent = parent[key]
  change(parent, path[path.length - 1])
  return copy
}

const REPLACEMENTS: unknown[] = [null, 'x', '', 0, -1, 1.5, true, [], {}, 'not a date', '2026-02-30T00:00:00Z', 'bogus-enum']

function mutants(record: unknown): { label: string; value: unknown }[] {
  const out: { label: string; value: unknown }[] = []
  for (const path of paths(record)) {
    const where = path.join('.') || '(root)'
    if (path.length > 0) {
      out.push({ label: `${where}: deleted`, value: withChange(record, path, (p, k) => (Array.isArray(p) ? p.splice(k as number, 1) : delete p[k])) })
      for (const r of REPLACEMENTS) {
        out.push({ label: `${where} = ${JSON.stringify(r)}`, value: withChange(record, path, (p, k) => (p[k] = structuredClone(r))) })
      }
    }
    out.push({
      label: `${where}: extra field`,
      value: withChange(record, path, (p, k) => {
        const target = path.length === 0 ? p : p[k]
        if (target && typeof target === 'object' && !Array.isArray(target)) target.unexpected = 1
      }),
    })
  }
  return out
}

describe('the hand-rolled validator agrees with ajv', () => {
  it.each(Object.entries(fixtures))('%s', (file, fixture) => {
    const version = Number(/roster-v(\d+)/.exec(file)![1])
    const schema = schemas[`./schemas/roster-v${version}.schema.json`]
    expect(validate(schema, fixture)).toEqual([])
    expect(ajvFor(schema)(fixture)).toBe(true)
  })

  // A companion's photo, the shape the character's has: the filled fixture
  // with a companion wearing its photo.
  const companionPortrait = structuredClone(filledJson) as { entities: Record<string, unknown>[] }
  companionPortrait.entities[0].companions = [{ id: 'companion-1', name: 'Owl', portrait: companionPortrait.entities[0].portrait }]

  // A character with something in every anyOf the format has: a species, a
  // background, Concentration, a class, a choice, a spell, a condition of
  // each kind, and a quick bar slot beside the empty ones.
  const chosen = structuredClone(blankJson) as { entities: Record<string, unknown>[] }
  Object.assign(chosen.entities[0], {
    classes: [{ classId: 'wizard', subclassId: 'evoker', level: 3, hp: [{ level: 1, method: 'max' }, { level: 2, method: 'rolled', value: 4 }] }],
    species: { speciesId: 'elf', size: 'medium' },
    background: { backgroundId: 'sage', abilityIncreases: { int: 2, wis: 1 } },
    choices: [{ source: 'class:wizard:1', choice: 'class-skills', values: ['arcana', 'history'] }, { source: 'class:wizard:4>feat:ability-score-improvement', choice: 'ability-increase', values: [], increases: { int: 2 } }],
    spells: [{ spellId: 'magic-missile', classId: 'wizard', source: 'class:wizard', prepared: true }],
    conditions: [{ id: 'c1', conditionId: 'poisoned', duration: '1 hour' }, { id: 'c2', custom: { name: 'Blessed', text: '+1d4' } }],
    concentration: { spellId: 'bless' },
    quickBar: [{ kind: 'spell', ref: 'magic-missile' }, null, null, null, null, null, null, null, null, null],
  })

  it('accepts a companion’s photo, and a character with something chosen everywhere', () => {
    for (const record of [companionPortrait, chosen]) {
      expect(validate(v1, record)).toEqual([])
      expect(ajvFor(v1)(record)).toBe(true)
    }
  })

  // The filled fixture, whose photo is the one place the save schema uses
  // pattern and maxLength; a companion's photo of the same shape; and the
  // chosen character's fields, the save's anyOfs and its quick bar's
  // minItems and maxItems.
  const cases = [
    ...mutants(filledJson),
    ...mutants(companionPortrait).filter(({ label }) => label.startsWith('entities.0.companions.0.portrait')),
    ...mutants(chosen).filter(({ label }) => /^entities.0.(classes|species|background|choices|spells|conditions|concentration|quickBar)/.test(label)),
  ]

  // Thousands of validations, so the suite's slowest test: 3.4 s alone on the
  // dev machine, and past the default 5 s when the whole suite runs on a busy
  // one, which would fail a build at random. Its own limit is 30 s.
  it(`on ${cases.length} broken copies of the filled fixture, a companion's photo and a character with something chosen everywhere`, { timeout: 30_000 }, () => {
    const reference = ajvFor(v1)
    const disagreements = cases
      .map(({ label, value }) => ({ label, ajv: reference(value), ours: validate(v1, value).length === 0 }))
      .filter((c) => c.ajv !== c.ours)
    expect(disagreements).toEqual([])
    // Most mutations must be rejected, or the test is not testing much. The
    // rest are legitimately valid: 'x' as a name, 0 coins.
    const rejected = cases.filter(({ value }) => validate(v1, value).length > 0).length
    expect(rejected / cases.length).toBeGreaterThan(0.6)
  })

  it.each([
    '2026-09-27T18:00:00Z', '2026-09-27T18:00:00.123Z', '2026-09-27t18:00:00z', '2026-09-27 18:00:00+05:30',
    '2026-09-27T18:00:00+0530', '2026-09-27T18:00:00', '2026-09-27', '2024-02-29T00:00:00Z', '2023-02-29T00:00:00Z',
    '1900-02-29T00:00:00Z', '2000-02-29T00:00:00Z', '2026-13-01T00:00:00Z', '2026-09-27T24:00:00Z',
    '2026-12-31T23:59:60Z', '2026-12-31T22:59:60-01:00', '2026-12-31T12:59:60Z', '2026-09-27T18:00:00+24:00', '',
  ])('date-time %j', (s) => {
    const schema = { type: 'string', format: 'date-time' }
    expect(validate(schema, s).length === 0).toBe(ajvFor(schema)(s))
  })

  it('counts string length in code points, as JSON Schema does', () => {
    const schema = { type: 'string', minLength: 2 }
    for (const s of ['a', '😀', 'ab', '😀a']) expect(validate(schema, s).length === 0).toBe(ajvFor(schema)(s))
  })

  it.each([
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/webp;base64,UklGRg==',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:text/html;base64,PGgxPg==',
    'data:image/png;base64,',
    'data:image/png;base64,iVBOR w0K',
    ' data:image/png;base64,iVBORw0KGgo=',
    'data:image/png;base64,iVBORw0KGgo=\n',
    'x'.repeat(12),
  ])('the photo field against %j', (s) => {
    const schema = { type: 'string', pattern: '^data:image/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$', maxLength: 30 }
    expect(validate(schema, s).length === 0).toBe(ajvFor(schema)(s))
  })

  it('refuses a schema keyword it does not implement, rather than ignoring it', () => {
    expect(() => validate({ type: 'number', multipleOf: 2 }, 4)).toThrow('does not support the schema keyword "multipleOf"')
    expect(() => validate({ type: 'string', format: 'email' }, 'a')).toThrow('does not support the format "email"')
  })

  it('says where and what, in plain language', () => {
    const broken = structuredClone(blankJson) as any
    broken.entities[0].abilities.base.str = 'strong'
    delete broken.entities[0].coins
    // Eight slots, so three more makes eleven, past the ten a bar may hold.
    broken.entities[0].quickBar.push(null, null, null)
    expect(validate(v1, broken)).toEqual([
      { path: 'entities[0]', message: 'is missing coins' },
      { path: 'entities[0].abilities.base.str', message: 'should be integer, not a string' },
      { path: 'entities[0].quickBar', message: 'should have at most 10 items' },
    ])
  })
})
