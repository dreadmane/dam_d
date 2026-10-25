// The example characters (spec §4.4): finished characters every device starts
// with, to show what the app does and to test new features against: a level 1
// Fighter, a level 5 Wizard, a level 7 Cleric 5 / Fighter 2, and a level 5
// Barbarian (Berserker), built by the rules from the SRD alone, so they ship
// publicly and need no book file. The rules tests derive every one
// (src/rules/derive.test.ts).
//
// Once added they are the player's like any other character: edited, played,
// or deleted. Each is added once per device, so a deleted example stays
// deleted; Settings puts them back.

import { rulesVersion } from '../rules/data.ts'
import type { RosterRecord } from './record.ts'
import type { RosterStore } from './store.ts'

export interface Example {
  id: string
  // The seeding round it arrived in. A later example takes the next round, so
  // a device that has seeded the earlier ones gets only the new one, and an
  // example the player deleted is not brought back.
  round: number
  // The round its portrait arrived in, where that is later than the example:
  // a device that already has the example gains the portrait then, unless
  // the player has given it a photo of their own.
  portraitRound?: number
  // Loaded only when needed: an example can carry a photo, which a page load
  // that seeds nothing should not pay for.
  load: () => Promise<{ default: unknown }>
}

const EXAMPLES: Example[] = [
  { id: 'example-fighter', round: 1, portraitRound: 3, load: () => import('./examples/fighter.json') },
  { id: 'example-wizard', round: 1, portraitRound: 3, load: () => import('./examples/wizard.json') },
  { id: 'example-cleric-fighter', round: 1, portraitRound: 3, load: () => import('./examples/cleric-fighter.json') },
  { id: 'example-barbarian', round: 2, portraitRound: 3, load: () => import('./examples/barbarian.json') },
]

// Whether this version ships any, so Settings shows its row only then.
export const hasExamples = EXAMPLES.length > 0

export const isExample = (rosterId: string) => EXAMPLES.some((e) => e.id === rosterId)

// Which round this device has seeded, kept beside the settings in
// localStorage. Storage can refuse, as in settings.ts; then seeding runs
// again on the next visit and adds back only an example that is missing.
export interface SeedFlag {
  get(): number
  set(round: number): void
}

const KEY = 'd-amp-d:examples-seeded'

export const localSeedFlag: SeedFlag = {
  get() {
    try {
      return Number(localStorage.getItem(KEY)) || 0
    } catch {
      return 0
    }
  },
  set(round) {
    try {
      localStorage.setItem(KEY, String(round))
    } catch {
      // Unrecorded; see above.
    }
  },
}

// Stamped with the current rules version, which the examples are tested
// against.
async function load(examples: Example[]): Promise<RosterRecord[]> {
  const modules = await Promise.all(examples.map((e) => e.load()))
  return modules.map((m) => ({ ...(m.default as RosterRecord), gameDataVersion: rulesVersion }))
}

export const exampleRecords = () => load(EXAMPLES)

// Adds the examples this device has not had yet, and returns how many. Put
// back with their own saved time rather than now, so they sit below the
// player's own characters in the list.
export async function seedExamples(store: RosterStore, flag: SeedFlag = localSeedFlag, examples: Example[] = EXAMPLES): Promise<number> {
  const latest = Math.max(0, ...examples.map((e) => Math.max(e.round, e.portraitRound ?? 0)))
  const seeded = flag.get()
  if (seeded >= latest) return 0
  const present = new Set((await store.list()).map((r) => r.id))
  const due = await load(examples.filter((e) => e.round > seeded && !present.has(e.id)))
  for (const record of due) await store.restore(record)
  await addPortraits(store, examples.filter((e) => (e.portraitRound ?? 0) > seeded && present.has(e.id)))
  flag.set(latest)
  return due.length
}

// Gives an example already on this device the portrait it now ships with,
// and changes nothing else in it. One the player has given a photo of their
// own keeps theirs. Restored with its own saved time, so the list keeps its
// order.
async function addPortraits(store: RosterStore, examples: Example[]) {
  if (examples.length === 0) return
  const shipped = await load(examples)
  for (const example of shipped) {
    const loaded = await store.load(example.id)
    if (!loaded.ok) continue
    const record = loaded.record
    const index = record.entities.findIndex((e) => e.id === record.primaryEntityId)
    const portrait = example.entities.find((e) => e.id === example.primaryEntityId)?.portrait
    if (index < 0 || !portrait || record.entities[index].portrait) continue
    const entities = record.entities.map((e, i) => (i === index ? { ...e, portrait } : e)) as RosterRecord['entities']
    await store.restore({ ...record, entities })
  }
}

// Settings' "Put back the examples": every example as it shipped, replacing
// one already here, so a changed or deleted example can be started over.
export async function restoreExamples(store: RosterStore, examples: Example[] = EXAMPLES): Promise<RosterRecord[]> {
  const records = await load(examples)
  for (const record of records) await store.restore(record)
  return records
}
