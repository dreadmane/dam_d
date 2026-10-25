import { named } from './components/character-name.ts'
import type { NoticeInput } from './notify/store.ts'
import type { LevelGrant } from './rules/level.ts'

// The Handbook's register (the spec §6.1, user 2026-10-23): where d-amp-d
// speaks, it speaks as the rules talk to the player, in the second person,
// warm and plain, with the character by name. The lines are the concept's
// voice tile's (notes/2026-10-22-journal-pages-concept/mock/voice.html),
// each made a template so it reads right for any character, class or count.
//
// It speaks loudest at the finish of Build from level 1, briefly when a level
// is gained, and quietly in empty states, a character imported and a Long
// Rest with nothing to restore. It never speaks in a label, navigation,
// validation or a confirmation, or in a state read mid-fight: the Tucked-in
// note and the Dying and Stable lines keep their plain words, with at most an
// aside under Stable. Every voiced line keeps every fact and number of the
// plain line it replaced, so a player in a hurry loses nothing. Names and
// numbers come in from the character and the rules data, never typed here.

// The character by name, or "your character" before the player gives one: the
// app's "Unnamed character" reads as a label, not as someone in a sentence.
export const who = (name: string, { start = false } = {}) => (named(name) ? name.trim() : start ? 'Your character' : 'your character')

// "A", "A and B", "A, B, and C": the rules' own lists keep the serial comma.
const listed = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

// The list with no character yet (RosterList).
export const ROSTER_EMPTY = 'Your characters will gather here; none are saved in this browser yet. Start a new one, or import a .dnd.json file.'

// A character imported, under the flash's plain kicker "Imported" (RosterList).
export const importedLine = (name: string) => `${named(name) ? name.trim() : 'An unnamed character'} is imported and ready to play.`

// Build from level 1's finish, with nothing left to choose (BuildScreen). Its
// figures line stays plain.
export const buildFinishedLine = (name: string) => `Everything is chosen: ${who(name)} is ready for adventure.`

// A Long Rest with nothing to restore (Resources' LongRestWindow).
export const LONG_REST_NOTHING = 'Nothing to restore: you’re already at full strength.'

// The aside under Stable at 0 HP (Health's DeathSavesSection). The Stable
// line above it stays plain.
export const stableAside = (name: string) => `Breathe easy: ${who(name)} is holding on.`

// An Inventory with nothing in it (Inventory).
export const INVENTORY_EMPTY = 'Your inventory is empty for now.'

// What a level brings, as Level up's new rung lists it: the features gained,
// whether a subclass is to be chosen, and how many choices are to be made.
export interface Brings {
  features: string[]
  subclass: boolean
  choices: number
}

// The rung's list from the level's grant (rules/level.ts), so the rung and
// the flash say the same.
export const bringsOf = (grant: LevelGrant): Brings => ({ features: grant.features.map((f) => f.name), subclass: grant.subclass, choices: grant.choices.length })

export interface LevelGained {
  name: string
  // The character's level after it.
  level: number
  // The class the level went to, and the class's level after it.
  className: string
  classLevel: number
  brings: Brings
  // Max HP after it.
  maxHp: number
}

// A level gained (Levels' Add level), filed in the character's folder and
// flashed in the gold tier, which the flashes keep for a level-up. The kicker
// is a label and stays plain. The class is named only when it is not the
// character's whole level, a multiclass level.
export function levelGained({ name, level, className, classLevel, brings, maxHp }: LevelGained): NoticeInput {
  const reached = `${who(name, { start: true })} reaches level ${level}${classLevel !== level ? ` (${className} ${classLevel})` : ''}.`
  const owed = [brings.subclass && 'a subclass to choose', brings.choices > 0 && `${brings.choices} ${brings.choices === 1 ? 'choice' : 'choices'} to make`].filter((s): s is string => Boolean(s))
  const gained = brings.features.length
    ? `You gain ${listed(brings.features)}${owed.length ? `, with ${listed(owed)}` : ''}`
    : `This level brings no new feature${owed.length ? `, but ${listed(owed)}` : ''}`
  return { kicker: `Level ${level}`, tier: 'gold', lines: [`${reached} ${gained}; Max HP ${maxHp}.`] }
}
