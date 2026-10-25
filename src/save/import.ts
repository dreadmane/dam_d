// Reading a character file into a record the app can save (spec §4.2): parse,
// migrate to the current schema version, validate against the current
// schema, and check every rules id if the file was made against different
// rules data. Nothing is saved here; the screen shows the report first,
// because the record's gameDataVersion is bumped only after the player has
// seen it.

import { APP_NAME } from '../app-name.ts'
import { rulesVersion } from '../rules/data.ts'
import { migrate } from './migrate.ts'
import { SCHEMA_VERSION, type RosterRecord } from './record.ts'
import type { UnresolvedId } from './resolve-ids.ts'
import { validate } from './validate.ts'

export interface ImportReport {
  // The format version the file was written in, and what migrating it did.
  fromVersion: number
  migrations: string[]
  // The rules the file was last checked against, when they differ from ours.
  savedAgainst: string | null
  unresolved: UnresolvedId[]
}

export type ImportOutcome =
  | { ok: true; record: RosterRecord; report: ImportReport }
  | { ok: false; message: string; details: string[] }

const MAX_DETAILS = 8

// The refusal for a file from Crawler Interface, the Dungeon Crawler Carl app
// d-amp-d was forked from (M0, 2026-10-19).
export const CRAWLER_INTERFACE_FILE = `This is a Crawler Interface file. ${APP_NAME} keeps D&D characters.`

// Crawler Interface's rosters hold entities of kind "crawler"; d-amp-d's,
// kind "character".
export function isCrawlerInterfaceFile(parsed: unknown): boolean {
  const entities = (parsed as { entities?: unknown } | null)?.entities
  return Array.isArray(entities) && entities.some((e) => (e as { kind?: unknown } | null)?.kind === 'crawler')
}

// Chosen by SCHEMA_VERSION, so raising the version cannot leave import
// validating against the old shape. The older schemas are small.
const schemas = import.meta.glob<Record<string, unknown>>('./schemas/roster-v*.schema.json', { eager: true, import: 'default' })
const currentSchema = schemas[`./schemas/roster-v${SCHEMA_VERSION}.schema.json`]
if (!currentSchema) throw new Error(`No save schema for version ${SCHEMA_VERSION}`)

export async function readImport(text: string): Promise<ImportOutcome> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, message: 'This file is not a character save: it is not valid JSON.', details: [] }
  }

  // A Crawler Interface file is a version 1 roster too, so it would pass the
  // version check and fail the shape: it is named instead, plainly.
  if (isCrawlerInterfaceFile(parsed)) return { ok: false, message: CRAWLER_INTERFACE_FILE, details: [] }

  const migrated = migrate(parsed)
  if (!migrated.ok) return { ok: false, message: migrated.message, details: [] }

  // Validated after migrating, against the current schema, because that is
  // the shape about to be saved. The version check has already passed.
  const errors = validate(currentSchema, migrated.record)
  if (errors.length) {
    const details = errors.slice(0, MAX_DETAILS).map((e) => `${e.path} ${e.message}`)
    if (errors.length > MAX_DETAILS) details.push(`and ${errors.length - MAX_DETAILS} more`)
    return { ok: false, message: 'This file does not match the character save format, so it was not imported.', details }
  }

  const record = migrated.record
  const drifted = record.gameDataVersion !== rulesVersion
  const unresolved = drifted ? (await import('./resolve-ids.ts')).unresolvedIds(record) : []
  return {
    ok: true,
    record,
    report: {
      fromVersion: migrated.from,
      migrations: migrated.applied,
      savedAgainst: drifted ? record.gameDataVersion : null,
      unresolved,
    },
  }
}

// What is saved once the player has seen the report and chosen to import.
export function acceptImport(record: RosterRecord): RosterRecord {
  return { ...record, schemaVersion: SCHEMA_VERSION, gameDataVersion: rulesVersion }
}

// The same character under new ids, for importing a file whose character is
// already saved here without replacing it. "(copy)" keeps the two apart in
// the roster list.
export function asCopy(record: RosterRecord, newId: () => string = () => crypto.randomUUID()): RosterRecord {
  const idMap = new Map(record.entities.map((e) => [e.id, newId()]))
  const entities = record.entities.map((e) => ({
    ...e,
    id: idMap.get(e.id)!,
    name: e.id === record.primaryEntityId ? `${e.name} (copy)` : e.name,
  })) as RosterRecord['entities']
  return {
    ...record,
    id: newId(),
    name: `${record.name} (copy)`,
    primaryEntityId: idMap.get(record.primaryEntityId) ?? entities[0].id,
    entities,
  }
}
