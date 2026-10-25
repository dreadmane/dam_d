/* eslint-disable */
// Generated from src/save/schemas by `npm run gen-types`. Do not edit: change
// the schema, then regenerate. A test fails if this file is out of date.

/**
 * A rules-data id (kebab-case). Kept even when the device's data cannot resolve it, and shown as unresolved (§4.2).
 */
export type Id = string

/**
 * A saved roster at schemaVersion 1 (the d-amp-d spec §4.1): one D&D 2024 character plus, from M2, the companions they control. Only choices are stored; every derived value (ability modifiers, saves, skills, AC, max HP, the proficiency bonus, slots, resource maximums) is computed from the rules data. Open to change until M1 ships (the spec §8, D5's U3); frozen once a later version exists, so fixtures at this version keep validating against it.
 */
export interface RosterRecord {
  id: string
  schemaVersion: 1
  /**
   * The rulesVersion of the data snapshot this record was last checked against (data/rules/manifest.json). Bumped only after the player has seen a drift report (§4.2).
   */
  gameDataVersion: string
  createdAt: string
  updatedAt: string
  name: string
  primaryEntityId: string
  /**
   * @minItems 1
   */
  entities: [CharacterEntity, ...CharacterEntity[]]
}
export interface CharacterEntity {
  id: string
  kind: 'character'
  name: string
  /**
   * The character's classes, multiclassing from the start (A2). Empty until a class is chosen. The character level is the sum of their levels.
   */
  classes: ClassEntry[]
  /**
   * The order classes were taken; the first decides level 1's hit points and saving throws (the Multiclassing rules). Absent with one class or none.
   */
  classOrder?: Id[]
  species: null | {
    speciesId: Id
    /**
     * Where the species lets the player choose.
     */
    size?: 'small' | 'medium'
  }
  background: null | {
    backgroundId: Id
    /**
     * +2/+1 or +1/+1/+1 among the background's three abilities (the background rules).
     */
    abilityIncreases: {
      str?: number
      dex?: number
      con?: number
      int?: number
      wis?: number
      cha?: number
    }
  }
  abilities: {
    base: AbilityScores
    generation: {
      method: 'standard-array' | 'point-buy' | 'random' | 'entered'
      rolls: number[]
    }
  }
  /**
   * Every choice a level, the origin or a feat made (a lineage, a skill, a feat and that feat's own picks), each with where it came from, so changing an earlier choice knows what depends on it. A subclass is not here: it is its class entry's subclassId.
   */
  choices: Choice[]
  spells: SpellEntry[]
  /**
   * Max HP is derived, never stored.
   */
  hp: {
    current: number
    temp: number
  }
  deathSaves: {
    successes: number
    failures: number
    dead?: boolean
  }
  /**
   * Spent Hit Point Dice by die: { "d10": 1 }.
   */
  hitDiceSpent: {
    [k: string]: number
  }
  /**
   * Expended spell slots by slot level, "1" to "9".
   */
  slotsExpended: {
    [k: string]: number
  }
  pactSlotsExpended: number
  /**
   * Uses spent, by resource id (a class feature's resource effect).
   */
  resourcesUsed: {
    [k: string]: number
  }
  conditions: Condition[]
  exhaustion: number
  concentration: null | {
    spellId: Id
  }
  /**
   * Ongoing effects switched on from the quick bar (C4), by feature or spell id.
   */
  toggles: {
    [k: string]: boolean
  }
  inventory: Item[]
  coins: {
    cp: number
    sp: number
    ep: number
    gp: number
    pp: number
  }
  heroicInspiration: boolean
  levelling: {
    mode: 'xp' | 'milestone'
    xp: number
  }
  /**
   * The quick bar's slots (C4): eight. A bar saved with ten before 2026-10-19's eight-slot bar still reads, its first eight shown, and is saved as eight when a slot changes.
   *
   * @minItems 8
   * @maxItems 10
   */
  quickBar:
    | [
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot
      ]
    | [
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot
      ]
    | [
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot,
        null | QuickBarSlot
      ]
  /**
   * True once the player has changed a slot: the bar is theirs, even with every slot emptied. Absent, an empty bar is suggested from the sheet (2026-10-20: before it, emptying the last slot brought the suggestions back).
   */
  quickBarChosen?: boolean
  /**
   * M2. Empty until then.
   */
  companions: Companion[]
  details: {
    alignment: string
    languages: Id[]
    appearance: string
  }
  creation: {
    route: 'any-level' | 'level-1'
    complete: boolean
    /**
     * The starting equipment packages the build picked, by the class's and the background's option ids (a, b, c). What they added is tagged 'starting equipment' in the inventory.
     */
    equipment?: {
      class?: string
      background?: string
    }
  }
  /**
   * The Scratch pad, as typed.
   */
  notes: string
  portrait?: Portrait
  /**
   * Fields a migration could not map, kept rather than dropped (§4.3).
   */
  legacy?: {
    [k: string]: unknown
  }
}
export interface ClassEntry {
  classId: Id
  subclassId?: Id
  level: number
  /**
   * Each level of this class's hit points: the fixed value or a roll (C3). The first class's level 1 takes the die's maximum.
   */
  hp: {
    level: number
    method: 'max' | 'fixed' | 'rolled'
    /**
     * The roll, where method is rolled.
     */
    value?: number
  }[]
}
/**
 * Before the background's increases, feats and effects.
 */
export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}
export interface Choice {
  /**
   * What made the choice, as a path: class:fighter:4 (a class level), species:elf, background:sage, and a feat taken there after >, as class:fighter:4>feat:skilled or background:acolyte>feat:magic-initiate. Unique per choice, so a repeatable feat taken twice keeps its picks apart.
   */
  source: string
  /**
   * A rules-data id (kebab-case). Kept even when the device's data cannot resolve it, and shown as unresolved (§4.2).
   */
  choice: string
  /**
   * What was picked, as many as the choice allows: rules ids (skill, feat, option, weapon kind), or a feat's id where the choice grants a feat.
   */
  values: string[]
  /**
   * For ability-increase: where the increase went, as the effect's patterns allow ({ str: 2 }, or { str: 1, con: 1 }).
   */
  increases?: {
    str?: number
    dex?: number
    con?: number
    int?: number
    wis?: number
    cha?: number
  }
}
export interface SpellEntry {
  spellId: Id
  classId?: Id
  /**
   * class:wizard, species:tiefling, feat:magic-initiate.
   */
  source: string
  prepared: boolean
}
export interface Condition {
  id: string
  /**
   * A rules-data id (kebab-case). Kept even when the device's data cannot resolve it, and shown as unresolved (§4.2).
   */
  conditionId?: string
  custom?: {
    name: string
    text: string
  }
  duration?: string
}
/**
 * The flat item form's stored fields (Crawler Interface's §3.2, with D&D's fields): what an item does is copied onto it when added from the catalogue, so custom and catalogue items are one kind.
 */
export interface Item {
  id: string
  name: string
  description: string
  quantity: number
  tags: string[]
  /**
   * The catalogue record it was added from, equipment:<id> or magic-items:<id>. Absent on a custom item.
   */
  itemId?: string
  /**
   * The mundane weapon or armor a magic one is made from (Weapon, +1 as a Longsword: equipment:longsword), for its attack or its Armor Class. Only on a magic item whose base is a weapon or armor.
   */
  baseItemId?: string
  /**
   * Pounds, each.
   */
  weight?: number
  /**
   * Worn or held: armor and a Shield count toward Armor Class, and an item's effects apply, only while worn.
   */
  worn?: boolean
  /**
   * Attuned to it (Rules Glossary, Attunement): an item that requires Attunement applies its effects only while attuned and worn.
   */
  attuned?: boolean
  /**
   * Sets of weapons the DM has ruled this weapon into for this character, by the set's id in the rules data (an attackOption's id: monk-weapons, a Monk weapon for Martial Arts). Added 2026-10-25 for the user's Frye, whose DM awarded him a sword and a katana that count as Monk weapons.
   *
   * @minItems 1
   */
  countsAs?: [string, ...string[]]
  /**
   * Effects in the rules data's vocabulary (dnd-rules common.schema.json, effect), copied when added. M1 validates their shape.
   */
  effects?: {}[]
  lastUsedAt?: string
}
export interface QuickBarSlot {
  kind: 'attack' | 'spell' | 'item' | 'resource' | 'toggle'
  /**
   * The item's id, or the rules id of the spell, resource or toggle.
   */
  ref: string
}
/**
 * M2 fills this in (C5). Only its identity is fixed now.
 */
export interface Companion {
  id: string
  name: string
  portrait?: Portrait
}
/**
 * An optional photo of the character or a companion, shrunk on the player's device to at most 1024 px on its long side and kept whole; crop says which square of it is shown, so the framing can change without a new upload. Carried over from Crawler Interface unchanged.
 */
export interface Portrait {
  /**
   * The photo as a data URL. Only raster types a browser draws without running anything, and capped, so an imported file cannot carry something else or something huge.
   */
  image: string
  /**
   * The framed square, rendered small for the character list, which reads summaries rather than whole records. Derived from image and crop.
   */
  thumbnail?: string
  width: number
  height: number
  crop: {
    x: number
    y: number
    zoom: number
  }
}
