// The save record (spec §4.1): a roster holding one or more entities. Its
// shape is src/save/schemas/roster-v<N>.schema.json, and the types below are
// generated from the newest one, so the schema is the one definition.
//
// Changing the shape: a new optional field needs no new version, because
// every existing record still validates without it. A renamed, removed,
// retyped, or newly required field means a new schema file at the next
// version (the old one stays, frozen), SCHEMA_VERSION raised to match, and a
// migration in migrate.ts with a fixture at the old version (spec §4.3).

export type { CharacterEntity, Item, Portrait, RosterRecord } from './types.ts'

export const SCHEMA_VERSION = 1
