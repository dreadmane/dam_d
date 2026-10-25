// Every rules id a saved character refers to, checked against the rules data
// this app ships (spec §4.2, game-data drift). An id that no longer resolves
// is reported, never dropped: the record keeps it, and screens mark it.
//
// Loaded on demand with import(), only when an imported file was made
// against other rules data, so the main bundle never carries the rules files
// a check reads.
//
// M0 checks no id: no screen reads one yet, and a blank character holds
// none. Each check arrives in M1 with the screen that reads its id (a class,
// a species, a background, a spell, a condition, an item's catalogue
// record), each reading the rules file that owns it.

import type { RosterRecord } from './record.ts'

export interface UnresolvedId {
  // What kind of record the id names: "class", "spell".
  kind: string
  id: string
  // Where in the record, for the report: "Lia, spells" and so on.
  where: string
}

export function unresolvedIds(_record: RosterRecord): UnresolvedId[] {
  return []
}
