// Copy, one of the three things done to a whole character (spec §3.2, beside
// export and delete): a second character identical to the first, to change
// without touching the original.

import { asCopy } from './import.ts'
import type { RosterRecord } from './record.ts'

// The same character under new ids, "(copy)" on its name, as import's "keep
// both" makes; but created now, because a copy is a new character, where an
// imported one keeps the date it was first made.
export function copyOf(
  record: RosterRecord,
  now: () => string = () => new Date().toISOString(),
  newId?: () => string,
): RosterRecord {
  return { ...asCopy(record, newId), createdAt: now() }
}
