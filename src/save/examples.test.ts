// The example characters (examples.ts): the four that ship, each a valid save
// at the current schema; the seeding mechanism is tested with the fixtures
// standing in for examples. What the rules derive from each is tested in
// src/rules/derive.test.ts.

import { describe, expect, it } from 'vitest'
import { rulesVersion } from '../rules/data.ts'
import { exampleRecords, hasExamples, isExample, restoreExamples, seedExamples, type Example, type SeedFlag } from './examples.ts'
import blankJson from './fixtures/roster-v1-blank.json'
import filledJson from './fixtures/roster-v1-filled.json'
import type { RosterRecord } from './record.ts'
import schema from './schemas/roster-v1.schema.json'
import { validate } from './validate.ts'
import { createStore, memoryBackend } from './store.ts'

function memoryFlag(start = 0): SeedFlag & { value: number } {
  return {
    value: start,
    get() {
      return this.value
    },
    set(round) {
      this.value = round
    },
  }
}

const example = (record: object, round: number): Example => ({ id: (record as RosterRecord).id, round, load: async () => ({ default: record }) })
// Two in the first round, then one more in the second.
const first = example({ ...filledJson, id: 'example-one', name: 'One (Example)' }, 1)
const second = example({ ...blankJson, id: 'example-two', name: 'Two (Example)' }, 1)
const later = example({ ...filledJson, id: 'example-three', name: 'Three (Example)' }, 2)
const STAND_INS = [first, second, later]
const names = async (store: ReturnType<typeof createStore>) => (await store.list()).map((r) => r.name)
const portraitOf = (r: RosterRecord) => r.entities.find((e) => e.id === r.primaryEntityId)?.portrait
const withoutPortrait = (r: RosterRecord): RosterRecord => ({
  ...r,
  entities: r.entities.map((e) => {
    const copy = { ...e }
    delete copy.portrait
    return copy
  }) as RosterRecord['entities'],
})
const OWN_PHOTO = { image: 'data:image/png;base64,AAAA', width: 10, height: 10, crop: { x: 0.5, y: 0.5, zoom: 1 } }

describe('the example characters', () => {
  it('are the four of the spec §4.4, each valid at the current schema and stamped with the current rules version', async () => {
    expect(hasExamples).toBe(true)
    const records = await exampleRecords()
    expect(records.map((r) => r.name)).toEqual(['Maren Holt', 'Ilsabet Vane', 'Halvard Stoneward', 'Unga-Bunga'])
    for (const r of records) {
      expect(validate(schema, r)).toEqual([])
      expect(r.gameDataVersion).toBe(rulesVersion)
      expect(isExample(r.id)).toBe(true)
      expect(portraitOf(r)).toMatchObject({ width: 1024, height: 1024, image: expect.stringMatching(/^data:image\/webp;base64,/), thumbnail: expect.stringMatching(/^data:image\/webp;base64,/) })
    }
    const flag = memoryFlag()
    expect(await seedExamples(createStore(memoryBackend()), flag)).toBe(4)
    expect(flag.value).toBe(3)
  })
})

describe('the portraits, arriving in round 3', () => {
  // A device that seeded the first round before the portraits shipped: the
  // three examples as they were then, one renamed by the player, one given a
  // photo of their own, and Halvard deleted.
  async function deviceFromRoundOne() {
    const store = createStore(memoryBackend())
    const [fighter, wizard] = (await exampleRecords()).map(withoutPortrait)
    await store.restore({ ...fighter, name: 'Maren, renamed' })
    await store.restore({ ...wizard, entities: [{ ...wizard.entities[0], portrait: OWN_PHOTO }] })
    return store
  }

  it('reach the examples already on a device, and bring Unga-Bunga, without bringing back a deleted one', async () => {
    const store = await deviceFromRoundOne()
    const flag = memoryFlag(1)
    expect(await seedExamples(store, flag)).toBe(1)
    expect(flag.value).toBe(3)
    expect((await names(store)).toSorted()).toEqual(['Ilsabet Vane', 'Maren, renamed', 'Unga-Bunga'])
    const maren = await store.load('example-fighter')
    expect(maren.ok && maren.record.name).toBe('Maren, renamed')
    expect(maren.ok && portraitOf(maren.record)?.image).toMatch(/^data:image\/webp;base64,/)
  })

  it('leave a photo the player chose', async () => {
    const store = await deviceFromRoundOne()
    await seedExamples(store, memoryFlag(1))
    const ilsabet = await store.load('example-wizard')
    expect(ilsabet.ok && portraitOf(ilsabet.record)).toEqual(OWN_PHOTO)
  })

  it('are added once: a portrait the player removes afterwards stays removed', async () => {
    const store = await deviceFromRoundOne()
    const flag = memoryFlag(1)
    await seedExamples(store, flag)
    const maren = await store.load('example-fighter')
    if (!maren.ok) throw new Error('missing')
    await store.save(withoutPortrait(maren.record))
    expect(await seedExamples(store, flag)).toBe(0)
    const again = await store.load('example-fighter')
    expect(again.ok && portraitOf(again.record)).toBeUndefined()
  })
})

describe('seeding', () => {
  it('adds every example to a new device, once, stamped with the current rules version', async () => {
    const store = createStore(memoryBackend())
    const flag = memoryFlag()
    expect(await seedExamples(store, flag, STAND_INS)).toBe(3)
    expect(await seedExamples(store, flag, STAND_INS)).toBe(0)
    expect((await names(store)).toSorted()).toEqual(['One (Example)', 'Three (Example)', 'Two (Example)'])
    const loaded = await store.load('example-one')
    expect(loaded.ok && loaded.record.gameDataVersion).toBe(rulesVersion)
  })

  it('adds them beside characters already saved, and below them', async () => {
    const store = createStore(memoryBackend(), () => '2026-10-20T00:00:00.000Z')
    await store.save({ ...(filledJson as unknown as RosterRecord), id: 'mine', name: 'Mine' })
    await seedExamples(store, memoryFlag(), [first])
    expect(await names(store)).toEqual(['Mine', 'One (Example)'])
  })

  it('does not bring back an example the player deleted', async () => {
    const store = createStore(memoryBackend())
    const flag = memoryFlag()
    await seedExamples(store, flag, STAND_INS)
    await store.delete('example-one')
    expect(await seedExamples(store, flag, STAND_INS)).toBe(0)
    expect((await names(store)).toSorted()).toEqual(['Three (Example)', 'Two (Example)'])
  })

  it('brings a later example to a device that seeded the earlier ones, and nothing else', async () => {
    const store = createStore(memoryBackend())
    const flag = memoryFlag(1)
    expect(await seedExamples(store, flag, STAND_INS)).toBe(1)
    expect(await names(store)).toEqual(['Three (Example)'])
    expect(flag.value).toBe(2)
  })

  it('never replaces an example the player changed', async () => {
    const store = createStore(memoryBackend())
    await store.save({ ...(filledJson as unknown as RosterRecord), id: 'example-one', name: 'One, renamed' })
    expect(await seedExamples(store, memoryFlag(), STAND_INS)).toBe(2)
    expect((await names(store)).toSorted()).toEqual(['One, renamed', 'Three (Example)', 'Two (Example)'])
  })
})

describe('putting the examples back', () => {
  it('restores a deleted example and resets a changed one', async () => {
    const store = createStore(memoryBackend())
    await seedExamples(store, memoryFlag(), STAND_INS)
    await store.save({ ...(filledJson as unknown as RosterRecord), id: 'example-one', name: 'One, renamed' })
    await store.delete('example-two')
    await restoreExamples(store, STAND_INS)
    expect((await names(store)).toSorted()).toEqual(['One (Example)', 'Three (Example)', 'Two (Example)'])
  })
})
