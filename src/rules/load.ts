// The rules snapshot, loaded when a sheet first needs it (M1). The files are
// about 2 MB of JSON, most of it spells and magic items, so they are not in
// the startup bundle: each is imported dynamically, which Vite splits into a
// chunk of its own, and the whole set loads once per page and is kept.
//
// `indexRules` is the synchronous half, so tests build the same indexes from
// the files imported directly.

import { useEffect, useState } from 'react'
import { storedBookFile } from './book-store.ts'
import { withBooks } from './books.ts'
import type { Class, Feature, RulesData, Subclass } from './types.ts'

type Background = RulesData['backgrounds']['backgrounds'][number]
type Species = RulesData['species']['species'][number]
type Feat = RulesData['feats']['feats'][number]
type Skill = RulesData['skills']['skills'][number]
type Spell = RulesData['spells']['spells'][number]
type Weapon = RulesData['equipment']['weapons'][number]
type Armor = RulesData['equipment']['armor'][number]
type MagicItem = RulesData['magic-items']['items'][number]
type ConditionRecord = RulesData['conditions']['conditions'][number]
type Monster = RulesData['monsters']['monsters'][number]

export type { Armor, Background, ConditionRecord, Feat, MagicItem, Monster, Skill, Species, Spell, Weapon }

export interface Rules {
  data: RulesData
  classes: Map<string, Class>
  subclasses: Map<string, Subclass>
  species: Map<string, Species>
  backgrounds: Map<string, Background>
  feats: Map<string, Feat>
  skills: Map<string, Skill>
  spells: Map<string, Spell>
  weapons: Map<string, Weapon>
  armor: Map<string, Armor>
  magicItems: Map<string, MagicItem>
  conditions: Map<string, ConditionRecord>
  monsters: Map<string, Monster>
  // A class's option lists (Metamagic, Eldritch Invocations, Divine Order),
  // by list id, each option by its id.
  optionLists: Map<string, Map<string, Feature>>
}

const byId = <T extends { id: string }>(records: readonly T[]) => new Map(records.map((r) => [r.id, r]))

export function indexRules(data: RulesData): Rules {
  const classes = data.classes.classes
  const subclasses = [...classes.flatMap((c) => c.subclasses), ...(data.classes.subclasses ?? [])]
  const optionLists = new Map<string, Map<string, Feature>>()
  for (const c of classes) for (const list of c.optionLists ?? []) optionLists.set(list.id, byId(list.options))
  return {
    data,
    classes: byId(classes),
    subclasses: byId(subclasses),
    species: byId(data.species.species),
    backgrounds: byId(data.backgrounds.backgrounds),
    feats: byId(data.feats.feats),
    skills: byId(data.skills.skills),
    spells: byId(data.spells.spells),
    weapons: byId(data.equipment.weapons),
    armor: byId(data.equipment.armor),
    magicItems: byId(data['magic-items'].items),
    conditions: byId(data.conditions.conditions),
    monsters: byId(data.monsters.monsters),
    optionLists,
  }
}

let loading: Promise<Rules> | null = null

export function loadRules(): Promise<Rules> {
  loading ??= Promise.all([
    import('../../data/rules/srd/backgrounds.json'),
    import('../../data/rules/srd/classes.json'),
    import('../../data/rules/srd/conditions.json'),
    import('../../data/rules/srd/core.json'),
    import('../../data/rules/srd/derivations.json'),
    import('../../data/rules/srd/equipment.json'),
    import('../../data/rules/srd/feats.json'),
    import('../../data/rules/srd/magic-items.json'),
    import('../../data/rules/srd/monsters.json'),
    import('../../data/rules/srd/skills.json'),
    import('../../data/rules/srd/species.json'),
    import('../../data/rules/srd/spellcasting.json'),
    import('../../data/rules/srd/spells.json'),
    // The user's book file, if this device holds one (books.ts): its records
    // join the SRD's.
    storedBookFile(),
  ]).then(
    ([backgrounds, classes, conditions, core, derivations, equipment, feats, magicItems, monsters, skills, species, spellcasting, spells, book]) =>
      indexRules(withBooks({
        backgrounds: backgrounds.default,
        classes: classes.default,
        conditions: conditions.default,
        core: core.default,
        derivations: derivations.default,
        equipment: equipment.default,
        feats: feats.default,
        'magic-items': magicItems.default,
        monsters: monsters.default,
        skills: skills.default,
        species: species.default,
        spellcasting: spellcasting.default,
        spells: spells.default,
      } as unknown as RulesData, book?.file ?? null)),
    (error: unknown) => {
      // A failed chunk (offline mid-deploy) is retried on the next ask
      // rather than remembered.
      loading = null
      throw error
    },
  )
  return loading
}

// The book file loaded or removed (Settings): the rules load again, and every
// screen holding them takes the new set.
const listeners = new Set<() => void>()
export function reloadRules(): void {
  loading = null
  for (const l of listeners) l()
}

export type RulesStatus = { kind: 'loading' } | { kind: 'ready'; rules: Rules } | { kind: 'failed'; message: string }

export function useRules(): RulesStatus {
  const [status, setStatus] = useState<RulesStatus>({ kind: 'loading' })
  const [generation, setGeneration] = useState(0)
  useEffect(() => {
    const again = () => setGeneration((n) => n + 1)
    listeners.add(again)
    return () => {
      listeners.delete(again)
    }
  }, [])
  useEffect(() => {
    let live = true
    loadRules().then(
      (rules) => live && setStatus({ kind: 'ready', rules }),
      () => live && setStatus({ kind: 'failed', message: 'The rules could not load. Check the connection, then reload the page.' }),
    )
    return () => {
      live = false
    }
  }, [generation])
  return status
}
