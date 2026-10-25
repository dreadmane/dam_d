// The save layer: a new character's starting values, the migration runner's
// refusals and ordering, and a save-then-reload round trip through the store,
// run against both schemaVersion 1 fixtures.

import { describe, expect, it } from 'vitest'
import { rulesVersion } from '../rules/data.ts'
import blankJson from './fixtures/roster-v1-blank.json'
import filledJson from './fixtures/roster-v1-filled.json'
import { migrate, type Migration } from './migrate.ts'
import { blankCharacter, newRoster, type Clock } from './new-roster.ts'
import { SCHEMA_VERSION, type RosterRecord } from './record.ts'
import { createStore, memoryBackend } from './store.ts'

const blank = blankJson as unknown as RosterRecord
const filled = filledJson as unknown as RosterRecord

function fixedClock(): Clock {
  let n = 0
  return { now: () => '2026-10-19T12:00:00.000Z', newId: () => `id-${++n}` }
}

function tickingNow() {
  let s = 0
  return () => `2026-10-19T12:00:${String(s++).padStart(2, '0')}.000Z`
}

describe('newRoster', () => {
  const roster = newRoster({ name: 'Lia' }, fixedClock())
  const character = roster.entities[0]

  it('is a current-version roster of one character, stamped with the rules snapshot', () => {
    expect(roster.schemaVersion).toBe(SCHEMA_VERSION)
    expect(roster.gameDataVersion).toBe(rulesVersion)
    expect(roster.entities).toHaveLength(1)
    expect(roster.primaryEntityId).toBe(character.id)
    expect(character.kind).toBe('character')
    expect([roster.name, character.name]).toEqual(['Lia', 'Lia'])
    expect(roster.createdAt).toBe(roster.updatedAt)
  })

  it('chooses nothing: no class, species or background, nothing held or spent, and eight empty quick bar slots', () => {
    expect(character).toMatchObject({ classes: [], species: null, background: null, choices: [], spells: [], inventory: [], conditions: [], companions: [], notes: '' })
    expect(character.coins).toEqual({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })
    expect(character.quickBar).toEqual(Array(8).fill(null))
    expect(character.creation).toEqual({ route: 'any-level', complete: false })
  })

  it('is the blank fixture, but for its ids, name and times', () => {
    const b = blank.entities[0]
    expect(blankCharacter(b.id, b.name)).toEqual(b)
  })

  it('gives each new character its own lists', () => {
    const a = blankCharacter('a', '')
    const b = blankCharacter('b', '')
    a.quickBar[0] = { kind: 'item', ref: 'x' }
    expect(b.quickBar[0]).toBeNull()
  })
})

describe('migrate', () => {
  it.each([
    ['blank', blank],
    ['filled', filled],
  ])('loads the current-version %s fixture unchanged', (_, fixture) => {
    const result = migrate(fixture)
    expect(result).toEqual({ ok: true, record: fixture, from: 1, applied: [] })
  })

  it('refuses a record from a newer app rather than loading part of it', () => {
    const result = migrate({ ...blank, schemaVersion: SCHEMA_VERSION + 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('newer-than-app')
  })

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'character'],
    ['no schemaVersion', { name: 'x' }],
    ['a fractional schemaVersion', { schemaVersion: 1.5 }],
    ['schemaVersion 0', { schemaVersion: 0 }],
  ])('refuses %s as not a roster', (_, input) => {
    const result = migrate(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not-a-roster')
  })

  // The chain is empty at version 1, so the runner is tested with a
  // three-version stand-in.
  const toV2: Migration = { describe: 'v1 → v2', run: (r) => ({ ...r, gold: { amount: r.gold } }) }
  const toV3: Migration = { describe: 'v2 → v3', run: (r) => ({ ...r, stamp: [...((r.stamp as string[]) ?? []), 'v3'] }) }

  it('runs each step in order from the record’s version to the current one', () => {
    const result = migrate({ schemaVersion: 1, gold: 5 }, [toV2, toV3], 3)
    expect(result).toEqual({
      ok: true,
      record: { schemaVersion: 3, gold: { amount: 5 }, stamp: ['v3'] },
      from: 1,
      applied: ['v1 → v2', 'v2 → v3'],
    })
  })

  it('starts partway along the chain for a record already past version 1', () => {
    const result = migrate({ schemaVersion: 2, gold: 5 }, [toV2, toV3], 3)
    expect(result.ok && result.applied).toEqual(['v2 → v3'])
  })

  it('never mutates the input', () => {
    const input = { schemaVersion: 1, gold: 5 }
    migrate(input, [toV2, toV3], 3)
    expect(input).toEqual({ schemaVersion: 1, gold: 5 })
  })

  it('fails loudly if a step is missing', () => {
    expect(() => migrate({ schemaVersion: 1 }, [toV2], 3)).toThrow('No migration from schema version 2 to 3')
  })

  it('the shipped chain covers every version below the current one', async () => {
    const { MIGRATIONS } = await import('./migrate.ts')
    expect(MIGRATIONS).toHaveLength(SCHEMA_VERSION - 1)
  })
})

describe('RosterStore', () => {
  it.each([
    ['blank', blank],
    ['filled', filled],
  ])('reloads the %s fixture exactly as saved, apart from updatedAt', async (_, fixture) => {
    const store = createStore(memoryBackend(), () => '2026-10-20T00:00:00.000Z')
    const saved = await store.save(fixture)
    expect(saved.updatedAt).toBe('2026-10-20T00:00:00.000Z')

    const loaded = await store.load(fixture.id)
    expect(loaded).toEqual({ ok: true, record: saved, from: 1, applied: [] })
    expect(saved).toEqual({ ...fixture, updatedAt: '2026-10-20T00:00:00.000Z' })
  })

  it('stores a copy: changing a record after saving it changes nothing saved', async () => {
    const store = createStore(memoryBackend())
    const saved = await store.save(structuredClone(filled))
    saved.entities[0].coins.gp = 999
    const loaded = await store.load(filled.id)
    expect(loaded.ok && loaded.record.entities[0].coins.gp).toBe(15)
  })

  it('lists rosters most recently saved first, and forgets deleted ones', async () => {
    const store = createStore(memoryBackend(), tickingNow())
    await store.save(blank)
    await store.save(filled)
    expect((await store.list()).map((s) => s.id)).toEqual([filled.id, blank.id])

    await store.save(blank)
    expect((await store.list()).map((s) => s.id)).toEqual([blank.id, filled.id])

    await store.delete(filled.id)
    expect((await store.list()).map((s) => s.id)).toEqual([blank.id])
    expect(await store.load(filled.id)).toMatchObject({ ok: false, reason: 'not-found' })
  })

  it('restores a deleted record exactly, back in its old place in the list', async () => {
    const store = createStore(memoryBackend(), tickingNow())
    const older = await store.save(blank)
    await store.save(filled)
    await store.delete(older.id)

    await store.restore(older)
    expect(await store.load(older.id)).toEqual({ ok: true, record: older, from: 1, applied: [] })
    expect((await store.list()).map((s) => s.id)).toEqual([filled.id, blank.id])
  })

  it('refuses to load a stored record from a newer app', async () => {
    const backend = memoryBackend()
    backend.raw.set('future', JSON.stringify({ ...blank, id: 'future', schemaVersion: SCHEMA_VERSION + 1 }))
    const result = await createStore(backend).load('future')
    expect(result).toMatchObject({ ok: false, reason: 'newer-than-app' })
  })

  it("lists the name and the primary character's photo thumbnail, and no thumbnail without one", async () => {
    const store = createStore(memoryBackend(), tickingNow())
    await store.save(filled)
    expect((await store.list())[0]).toEqual({ id: filled.id, name: 'Lia Brightwater', updatedAt: expect.any(String), thumbnail: filled.entities[0].portrait!.thumbnail })
    await store.save(blank)
    expect((await store.list())[0]).not.toHaveProperty('thumbnail')
  })

  it('still lists a summary Crawler Interface saved, with fields this app no longer reads', async () => {
    const backend = memoryBackend()
    await backend.put({ id: 'old', name: 'Old', updatedAt: '2026-09-01T00:00:00.000Z', level: 3 } as never, { ...blank, id: 'old' })
    expect(await createStore(backend).list()).toEqual([expect.objectContaining({ id: 'old', name: 'Old' })])
  })
})
