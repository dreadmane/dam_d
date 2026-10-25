// The one door to persistence (spec §4.1, platform: local-first). Components
// never touch browser storage; they call a RosterStore.
//
// Two layers. A StorageBackend moves records in and out of somewhere (memory,
// the browser, later a sync service) and knows nothing about versions. The
// RosterStore above it migrates every record it reads and stamps every record
// it writes, so each backend stays a few lines and a sync backend replaces
// one without touching the rules here.
//
// Every method is async although the first backends need not be: a network
// or IndexedDB backend cannot be synchronous, and changing every caller later
// is the rewrite the platform rule exists to prevent.

import { migrate, type MigrateResult } from './migrate.ts'
import type { RosterRecord } from './record.ts'

// What a roster list shows without reading every whole record: the name, when
// it was saved, and the primary character's photo thumbnail. A summary saved
// without a thumbnail lacks it until that character is next saved, so a
// reader treats it as optional. The class line the row reads (the spec
// §3.3: "Level 7 · Fighter 5 / Rogue 2 · Elf") is written from the saved ids,
// so the list never loads the rules; one saved before it existed lacks it
// until that character is next saved.
export interface RosterSummary {
  id: string
  name: string
  updatedAt: string
  thumbnail?: string
  line?: string
}

// An id as a name: "wood-elf" is Wood Elf. The SRD's class and species ids
// are their names in kebab case, so the list can say them without the rules.
const named = (id: string) =>
  id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

export function classLine(entity: RosterRecord['entities'][number]): string | undefined {
  const order = entity.classOrder ?? []
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const classes = [...entity.classes].sort((a, b) => rank(a.classId) - rank(b.classId))
  if (!classes.length) return undefined
  const level = classes.reduce((n, c) => n + c.level, 0)
  const parts = [`Level ${level}`, classes.map((c) => `${named(c.classId)} ${c.level}`).join(' / ')]
  if (entity.species) parts.push(named(entity.species.speciesId))
  return parts.join(' · ')
}

function summaryOf(record: RosterRecord): RosterSummary {
  const primary = record.entities.find((e) => e.id === record.primaryEntityId) ?? record.entities[0]
  const thumbnail = primary.portrait?.thumbnail
  const line = classLine(primary)
  return {
    id: record.id,
    name: record.name,
    updatedAt: record.updatedAt,
    ...(thumbnail ? { thumbnail } : {}),
    ...(line ? { line } : {}),
  }
}

export interface StorageBackend {
  list(): Promise<RosterSummary[]>
  // The stored JSON as parsed, before migration; undefined if absent.
  get(id: string): Promise<unknown>
  put(summary: RosterSummary, record: RosterRecord): Promise<void>
  delete(id: string): Promise<void>
}

export type LoadResult = MigrateResult | { ok: false; reason: 'not-found'; message: string }

export interface RosterStore {
  // Most recently saved first.
  list(): Promise<RosterSummary[]>
  load(id: string): Promise<LoadResult>
  // Returns the record as stored, with updatedAt set to now.
  save(record: RosterRecord): Promise<RosterRecord>
  delete(id: string): Promise<void>
  // Puts back a record exactly as it was, updatedAt included: undoing a
  // delete is not an edit, so the character returns to its place in the list.
  restore(record: RosterRecord): Promise<void>
}

export function createStore(backend: StorageBackend, now: () => string = () => new Date().toISOString()): RosterStore {
  return {
    async list() {
      const all = await backend.list()
      return all.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },

    async load(id) {
      const raw = await backend.get(id)
      if (raw === undefined) return { ok: false, reason: 'not-found', message: 'No saved character has that id.' }
      // Not written back here: the next save stores the current version.
      return migrate(raw)
    },

    async save(record) {
      const stamped = { ...record, updatedAt: now() }
      await backend.put(summaryOf(stamped), stamped)
      return stamped
    },

    delete: (id) => backend.delete(id),

    restore: (record) => backend.put(summaryOf(record), record),
  }
}

// The same store, calling announce with the id after each write lands, so
// other open copies of the app can reload that character (changes.ts).
export function announcing(inner: RosterStore, announce: (id: string) => void): RosterStore {
  return {
    ...inner,
    async save(record) {
      const saved = await inner.save(record)
      announce(saved.id)
      return saved
    },
    async delete(id) {
      await inner.delete(id)
      announce(id)
    },
    async restore(record) {
      await inner.restore(record)
      announce(record.id)
    },
  }
}

// For tests. Stores a serialized copy, as a real backend would, so a caller
// mutating a record after saving it cannot change what was saved.
export function memoryBackend(): StorageBackend & { raw: Map<string, string> } {
  const raw = new Map<string, string>()
  const summaries = new Map<string, RosterSummary>()
  return {
    raw,
    list: async () => [...summaries.values()],
    get: async (id) => {
      const json = raw.get(id)
      return json === undefined ? undefined : JSON.parse(json)
    },
    put: async (summary, record) => {
      raw.set(summary.id, JSON.stringify(record))
      summaries.set(summary.id, summary)
    },
    delete: async (id) => {
      raw.delete(id)
      summaries.delete(id)
    },
  }
}
