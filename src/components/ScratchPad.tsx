import type { CharacterEntity, RosterRecord } from '../save/record.ts'
import { SheetSection } from './SheetSection.tsx'

// The Scratch pad (A9, carried from Crawler Interface): what the player jots
// down, saved with the character like everything else and printed with it.
// A menu (user, 2026-10-13), or pinned to the sheet.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

export function ScratchPad({ entity, update }: { entity: CharacterEntity; update: Update }) {
  return (
    <SheetSection id="scratch-pad" className="scratch-pad">
      <textarea aria-label="Scratch pad" rows={6} value={entity.notes} onChange={(e) => update((c) => ({ ...c, notes: e.target.value }))} />
      <p className="meta">Saved with the character as you type, and printed with its sheet.</p>
    </SheetSection>
  )
}
