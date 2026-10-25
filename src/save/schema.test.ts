// The save schemas against the things that claim to match them: every
// fixture against the schema of its own version, a new character against
// the current one, and the generated types against the current schema.

import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { currentSaveSchema, saveTypesSource } from '../../scripts/lib/types.mjs'
import generatedTypes from './types.ts?raw'
import { newRoster } from './new-roster.ts'
import { SCHEMA_VERSION } from './record.ts'

const schemas = import.meta.glob<object>('./schemas/roster-v*.schema.json', { eager: true, import: 'default' })
const fixtures = import.meta.glob<Record<string, unknown>>('./fixtures/roster-v*-*.json', { eager: true, import: 'default' })

const versionOf = (file: string) => Number(/roster-v(\d+)/.exec(file)![1])

function validatorFor(version: number) {
  const schema = schemas[`./schemas/roster-v${version}.schema.json`]
  if (!schema) throw new Error(`No schema for version ${version}`)
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  addFormats(ajv)
  return ajv.compile(schema)
}

describe('save schemas', () => {
  it('SCHEMA_VERSION is the newest schema file', () => {
    expect(currentSaveSchema().version).toBe(SCHEMA_VERSION)
    expect(Math.max(...Object.keys(schemas).map(versionOf))).toBe(SCHEMA_VERSION)
  })

  it('there is a fixture at every version', () => {
    const versions = new Set(Object.keys(fixtures).map(versionOf))
    for (let v = 1; v <= SCHEMA_VERSION; v++) expect(versions).toContain(v)
  })

  it.each(Object.entries(fixtures))('%s matches the schema of its version', (file, fixture) => {
    const validate = validatorFor(versionOf(file))
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true)
    expect(fixture.schemaVersion).toBe(versionOf(file))
  })

  it('a new character matches the current schema, named or not', () => {
    const validate = validatorFor(SCHEMA_VERSION)
    for (const name of ['', 'Lia']) {
      const roster = newRoster({ name })
      expect(validate(roster), JSON.stringify(validate.errors, null, 2)).toBe(true)
    }
  })

  it('a character with a class, a species, a background, a spell and a companion matches the current schema', () => {
    const validate = validatorFor(SCHEMA_VERSION)
    const roster = newRoster({ name: 'Lia' })
    Object.assign(roster.entities[0], {
      classes: [{ classId: 'wizard', level: 1, hp: [{ level: 1, method: 'max' }] }],
      species: { speciesId: 'elf' },
      background: { backgroundId: 'sage', abilityIncreases: { int: 2, wis: 1 } },
      choices: [{ source: 'species:elf', choice: 'elven-lineage', values: ['wood-elf'] }],
      spells: [{ spellId: 'magic-missile', classId: 'wizard', source: 'class:wizard', prepared: true }],
      companions: [{ id: 'c', name: 'Owl' }],
    })
    expect(validate(roster), JSON.stringify(validate.errors, null, 2)).toBe(true)
  })

  it('rejects a misspelled field rather than ignoring it, and a quick bar of the wrong length', () => {
    const validate = validatorFor(1)
    const blank = fixtures['./fixtures/roster-v1-blank.json'] as { entities: Record<string, unknown>[] }
    expect(validate({ ...blank, entities: [{ ...blank.entities[0], quickbar: [] }] })).toBe(false)
    expect(validate({ ...blank, entities: [{ ...blank.entities[0], quickBar: Array(11).fill(null) }] })).toBe(false)
  })

  it('rejects a Crawler Interface crawler', () => {
    const validate = validatorFor(1)
    const blank = fixtures['./fixtures/roster-v1-blank.json'] as { entities: Record<string, unknown>[] }
    expect(validate({ ...blank, entities: [{ ...blank.entities[0], kind: 'crawler' }] })).toBe(false)
  })

  it('src/save/types.ts is generated from the current schema (run npm run gen-types)', async () => {
    const normalize = (s: string) => s.replace(/\r\n/g, '\n')
    expect(normalize(generatedTypes)).toBe(normalize(await saveTypesSource()))
  })
})
