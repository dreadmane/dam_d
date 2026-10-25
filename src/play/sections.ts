import type { CharacterEntity } from '../save/record.ts'

// The counts that help find a section (A16): on the menu's rows and on the
// sections' own headings, from this one place, so a row and its heading
// never disagree. A section whose count would say nothing has none; Rolls
// counts today's itself (rolls/app-rolls.ts), since they are the device's.

export type CountedSection = 'inventory'

export function sectionCounts(entity: CharacterEntity): Record<CountedSection, string> {
  return {
    inventory: entity.inventory.length.toLocaleString(),
  }
}
