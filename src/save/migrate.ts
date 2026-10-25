// Brings any saved roster up to the current schemaVersion (spec §4.3). Runs
// on every load and every import.
//
// A migration is a pure function from version n to n + 1, and MIGRATIONS[i]
// takes a record from version i + 1 to i + 2. The list is empty while version
// 1 is the only version; the runner and its refusal rules are tested now so
// the first real migration only has to add an entry and its fixture.
// d-amp-d's version 1 is its own (the spec §4.1): no Crawler Interface save
// is a D&D one, so none is migrated, and import refuses one by name
// (import.ts).

import { SCHEMA_VERSION, type RosterRecord } from './record.ts'

// Unvalidated JSON: a migration reads fields by name and must not assume the
// shape of any version but its own.
export type RawRecord = Record<string, unknown>

export interface Migration {
  // Plain language, shown to the player in the import report.
  describe: string
  run: (record: RawRecord) => RawRecord
}

export const MIGRATIONS: Migration[] = []

export type MigrateResult =
  | { ok: true; record: RosterRecord; from: number; applied: string[] }
  | { ok: false; reason: 'not-a-roster' | 'newer-than-app'; message: string }

export function migrate(
  input: unknown,
  migrations: Migration[] = MIGRATIONS,
  current: number = SCHEMA_VERSION,
): MigrateResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, reason: 'not-a-roster', message: 'This is not a saved character.' }
  }
  const from = (input as RawRecord).schemaVersion
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) {
    return { ok: false, reason: 'not-a-roster', message: 'This is not a saved character: it has no schema version.' }
  }
  if (from > current) {
    // Loading it anyway would drop whatever the newer version added.
    return {
      ok: false,
      reason: 'newer-than-app',
      message: `This character was saved by a newer version of the app (format ${from}; this app reads up to ${current}). Update the app to open it.`,
    }
  }

  let record = structuredClone(input) as RawRecord
  const applied: string[] = []
  for (let v = from; v < current; v++) {
    const step = migrations[v - 1]
    if (!step) throw new Error(`No migration from schema version ${v} to ${v + 1}`)
    record = { ...step.run(record), schemaVersion: v + 1 }
    applied.push(step.describe)
  }
  return { ok: true, record: record as unknown as RosterRecord, from, applied }
}
