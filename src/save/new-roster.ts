// A new roster holding one blank character (the spec §3.3, M0's form): a name
// and nothing chosen. Everything here is a starting value of the save
// format, not a rule: no class, species or background, nothing spent or
// expended, an empty inventory and purse.
//
// The ability scores are the one field the format requires a number for
// before anything is chosen. Until M1's builder sets them they are 10 each,
// the score whose modifier is +0 in the SRD's Ability Modifiers table, marked
// `entered` since no method made them; no screen in M0 shows them.

import { rulesVersion } from '../rules/data.ts'
import { SCHEMA_VERSION, type CharacterEntity, type RosterRecord } from './record.ts'

// Injected so tests are deterministic. The defaults need a secure context
// (https or localhost), which both the dev server and Cloudflare provide.
export interface Clock {
  now: () => string
  newId: () => string
}

const systemClock: Clock = {
  now: () => new Date().toISOString(),
  newId: () => crypto.randomUUID(),
}

// The quick bar's eight slots (save/quick-bar.ts), empty.
import { QUICK_BAR_SLOTS } from './quick-bar.ts'
export { QUICK_BAR_SLOTS }

export function blankCharacter(id: string, name: string): CharacterEntity {
  return {
    id,
    kind: 'character',
    name,
    classes: [],
    species: null,
    background: null,
    abilities: { base: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, generation: { method: 'entered', rolls: [] } },
    choices: [],
    spells: [],
    hp: { current: 0, temp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    hitDiceSpent: {},
    slotsExpended: {},
    pactSlotsExpended: 0,
    resourcesUsed: {},
    conditions: [],
    exhaustion: 0,
    concentration: null,
    toggles: {},
    inventory: [],
    coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    heroicInspiration: false,
    levelling: { mode: 'xp', xp: 0 },
    quickBar: Array.from({ length: QUICK_BAR_SLOTS }, () => null) as CharacterEntity['quickBar'],
    companions: [],
    details: { alignment: '', languages: [], appearance: '' },
    creation: { route: 'any-level', complete: false },
    notes: '',
  }
}

export function newRoster({ name }: { name: string }, clock: Clock = systemClock): RosterRecord {
  const now = clock.now()
  const entityId = clock.newId()
  return {
    id: clock.newId(),
    schemaVersion: SCHEMA_VERSION,
    gameDataVersion: rulesVersion,
    createdAt: now,
    updatedAt: now,
    name,
    primaryEntityId: entityId,
    entities: [blankCharacter(entityId, name)],
  }
}
