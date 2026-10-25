// The level engine (the spec §7.1, M1 item 2): for a class and a class level,
// what that level grants and which choices it asks for, read from the
// class's features table and its features. Starting at any level, levelling
// up and the guided level-1 build all ask it the same question, one level at
// a time or every level at once.
//
// The data's conventions it relies on (classes.json, meta.notes):
// - a table row lists the features gained at that level by id; a feature
//   listed again (Ability Score Improvement at 8, Expertise at Rogue 6) is
//   gained again, and its choice is made again;
// - `subclass-feature` marks the levels the subclass's features arrive;
// - a choice whose count is a table column (Weapon Mastery, Eldritch
//   Invocations) owes more picks at each level the column rises.

import { evaluateNumber, type Ability, type ExprContext } from './expr.ts'
import type { Rules } from './load.ts'
import type { Class, EffAbilityIncrease, EffChoice, Effect, Feature } from './types.ts'
import type { CharacterEntity, Choice } from '../save/types.ts'

// A choice the character owes, and the pick saved for it if one was made.
export interface OwedChoice {
  // What made it, as the save records it (save/types.ts Choice.source).
  source: string
  choice: string
  label: string
  // How many picks this source owes.
  count: number
  kind?: EffChoice['kind']
  from?: string
  options?: string[]
  grants?: string
  // Limits on a monsters query (Wild Shape's Beast Shapes), read at the
  // character's current level in the class.
  where?: EffChoice['where']
  // An ability increase the player places (the Ability Score Improvement
  // feat, an Epic Boon's +1).
  increase?: EffAbilityIncrease
  // The feature, trait or feat that asks, and the class level, for saying
  // each choice with its level (§3.1 A step 4).
  origin: { id: string; name: string }
  classId?: string
  level?: number
  // A pick the rules make rather than the player (a background's feat
  // naming its spell list): made already, and not saved.
  fixed?: string[]
  made?: Choice
}

export interface LevelGrant {
  classId: string
  level: number
  features: Feature[]
  choices: OwedChoice[]
  // This level asks for the subclass, which the class entry's subclassId
  // answers.
  subclass: boolean
}

export const SUBCLASS_FEATURE = 'subclass-feature'

// A features-table cell at a class level; "—" is no value.
export function classColumn(cls: Class, level: number, column: string): number | string | undefined {
  const value = cls.table.rows[level - 1]?.values[column]
  return value === '—' ? undefined : value
}

// Only the table matters for a choice's count, so its context reads the
// class's own columns at the given level and nothing about the character.
// A choice's numbers (its count, its where limits) at a level in its class.
export function choiceContext(rules: Rules, classId: string, level: number): ExprContext | undefined {
  const cls = rules.classes.get(classId)
  return cls && countContext(cls, level)
}

function countContext(cls: Class, level: number): ExprContext {
  return {
    self: cls.id,
    score: () => 10,
    proficiencyBonus: 0,
    level,
    classLevel: (id) => (id === cls.id ? level : 0),
    classColumn: (id, column) => (id === cls.id ? classColumn(cls, level, column) : undefined),
  }
}

const isChoice = (e: Effect): e is EffChoice => e.type === 'choice'

function owed(e: EffChoice, count: number, source: string, origin: { id: string; name: string }, classId?: string, level?: number): OwedChoice {
  return {
    source,
    choice: e.id,
    label: e.label ?? origin.name,
    count,
    kind: e.kind,
    from: e.from,
    options: e.options,
    grants: e.grants,
    where: e.where,
    origin,
    classId,
    level,
  }
}

// The class features a level lists, and the subclass's features at that
// level when the subclass is known.
export function featuresAt(rules: Rules, cls: Class, level: number, subclassId?: string): Feature[] {
  const row = cls.table.rows[level - 1]
  if (!row) return []
  const subclass = subclassId ? rules.subclasses.get(subclassId) : undefined
  const out: Feature[] = []
  for (const id of row.features) {
    if (id === SUBCLASS_FEATURE) {
      if (subclass) out.push(...subclass.features.filter((f) => f.level === level))
      continue
    }
    const feature = cls.features.find((f) => f.id === id)
    if (feature) out.push(feature)
  }
  // A subclass's level-3 features are on the row that names the class's
  // subclass feature, not on a subclass-feature row.
  if (subclass && !row.features.includes(SUBCLASS_FEATURE)) out.push(...subclass.features.filter((f) => f.level === level))
  return out
}

export function levelGrants(rules: Rules, classId: string, level: number, options: { subclassId?: string; first: boolean }): LevelGrant {
  const cls = rules.classes.get(classId)
  if (!cls) return { classId, level, features: [], choices: [], subclass: false }
  const source = `class:${classId}:${level}`
  const features = featuresAt(rules, cls, level, options.subclassId)
  const choices: OwedChoice[] = []
  let subclass = false

  // Level 1's proficiencies: the whole class for the first class, its
  // multiclass gains for any other (the Multiclassing rules).
  if (level === 1) {
    const origin = { id: classId, name: cls.name }
    if (options.first) {
      choices.push({
        source,
        choice: 'class-skills',
        label: `${cls.name} skills`,
        count: cls.skillChoice.count,
        kind: 'skill',
        options: cls.skillChoice.options.includes('any') ? undefined : cls.skillChoice.options,
        from: cls.skillChoice.options.includes('any') ? 'skills:any' : undefined,
        grants: 'proficiency',
        origin,
        classId,
        level,
      })
      const tool = cls.toolProficiencies?.choice
      if (tool) choices.push(owed(tool, evaluateNumber(tool.count, countContext(cls, level)), source, origin, classId, level))
    } else {
      for (const e of cls.multiclass.gains.filter(isChoice)) choices.push(owed(e, evaluateNumber(e.count, countContext(cls, level)), source, origin, classId, level))
    }
  }

  for (const feature of features) {
    const origin = { id: feature.id, name: feature.name }
    for (const e of feature.effects) {
      if (e.type === 'abilityIncrease' && (e.choose || e.patterns)) {
        choices.push({ source, choice: 'ability-increase', label: feature.name, count: 1, kind: 'ability', increase: e, origin, classId, level })
      }
      if (!isChoice(e)) continue
      if (e.grants === 'subclass') {
        subclass = true
        continue
      }
      const count = evaluateNumber(e.count, countContext(cls, level))
      if (count > 0) choices.push(owed(e, count, source, origin, classId, level))
    }
  }

  // A column-counted choice from a feature gained earlier owes the column's
  // rise at this level (Weapon Mastery 3 → 4 at Fighter 4).
  if (level > 1) {
    const listed = new Set(features.map((f) => f.id))
    for (let earlier = 1; earlier < level; earlier++) {
      for (const feature of featuresAt(rules, cls, earlier, options.subclassId)) {
        if (listed.has(feature.id)) continue
        for (const e of feature.effects.filter(isChoice)) {
          if (typeof e.count === 'number' || e.grants === 'subclass') continue
          const rise = evaluateNumber(e.count, countContext(cls, level)) - evaluateNumber(e.count, countContext(cls, level - 1))
          if (rise > 0) choices.push(owed(e, rise, source, { id: feature.id, name: feature.name }, classId, level))
        }
        listed.add(feature.id)
      }
    }
  }

  return { classId, level, features, choices, subclass }
}

// The classes in the order taken: classOrder where it is recorded, then any
// class it misses, in the order listed.
export function classesInOrder(entity: Pick<CharacterEntity, 'classes' | 'classOrder'>) {
  const order = entity.classOrder ?? []
  return [...entity.classes].sort((a, b) => {
    const ia = order.indexOf(a.classId)
    const ib = order.indexOf(b.classId)
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib)
  })
}

// Choices made inside a pick: a feat's own choices and ability increase, and
// a class option's choices (Pact of the Tome's cantrips). source is the
// pick's path, so a repeatable feat taken twice keeps its picks apart.
function nestedChoices(rules: Rules, made: OwedChoice): OwedChoice[] {
  if (!made.made) return []
  const out: OwedChoice[] = []
  for (const value of made.made.values) {
    const feat = made.grants === 'feat' || made.kind === 'feat' || made.kind === 'fighting-style' ? rules.feats.get(value) : undefined
    const option = !feat && made.classId ? findOption(rules, made.classId, value) : undefined
    const record = feat ?? option
    if (!record) continue
    const source = `${made.source}>${feat ? 'feat' : 'option'}:${value}`
    const origin = { id: record.id, name: record.name }
    for (const e of record.effects) {
      if (e.type === 'abilityIncrease' && (e.choose || e.patterns)) {
        out.push({ source, choice: 'ability-increase', label: record.name, count: 1, kind: 'ability', increase: e, origin, classId: made.classId, level: made.level })
      } else if (isChoice(e)) {
        const count = typeof e.count === 'number' ? e.count : 1
        out.push(owed(e, count, source, origin, made.classId, made.level))
      }
    }
  }
  return out
}

// A class option by id (a Metamagic option, an Eldritch Invocation, a
// Divine Order), from the class's option lists.
export function findOption(rules: Rules, classId: string, optionId: string): Feature | undefined {
  for (const list of rules.classes.get(classId)?.optionLists ?? []) {
    const found = list.options.find((o) => o.id === optionId)
    if (found) return found
  }
  return undefined
}

// Every choice the character owes, by origin and class level, each with the
// pick saved for it: the Finish review's list and the Features menu's.
export function characterChoices(rules: Rules, entity: CharacterEntity): OwedChoice[] {
  const out: OwedChoice[] = []

  if (entity.species) {
    const species = rules.species.get(entity.species.speciesId)
    if (species) {
      const source = `species:${species.id}`
      const origin = { id: species.id, name: species.name }
      if (species.lineages) {
        const trait = species.traits.find((t) => t.id === species.lineages?.traitId)
        out.push({
          source,
          choice: species.lineages.traitId,
          label: species.lineages.label,
          count: 1,
          kind: 'option',
          options: species.lineages.options.map((o) => o.id),
          grants: 'lineage',
          origin: trait ? { id: trait.id, name: trait.name } : origin,
        })
      }
      for (const trait of species.traits) {
        for (const e of trait.effects.filter(isChoice)) out.push(owed(e, typeof e.count === 'number' ? e.count : 1, source, { id: trait.id, name: trait.name }))
      }
    }
  }

  if (entity.background) {
    const background = rules.backgrounds.get(entity.background.backgroundId)
    const featId = background?.feat.feat.replace(/^feats:/, '')
    const feat = featId ? rules.feats.get(featId) : undefined
    const tool = background?.tool && 'choice' in background.tool ? background.tool.choice : undefined
    if (background && tool) out.push(owed(tool, typeof tool.count === 'number' ? tool.count : 1, `background:${background.id}`, { id: background.id, name: background.name }))
    if (background && feat) {
      // The background's feat is given, not chosen; its own picks are owed,
      // except one the background makes itself (Magic Initiate (Cleric)
      // fixes the spell list).
      const nested = nestedChoices(rules, {
        source: `background:${background.id}`,
        choice: 'origin-feat',
        label: feat.name,
        count: 1,
        grants: 'feat',
        origin: { id: background.id, name: background.name },
        made: { source: `background:${background.id}`, choice: 'origin-feat', values: [feat.id] },
      })
      const fixed = background.feat.choice && `classes:${background.feat.choice.toLowerCase()}`
      for (const n of nested) if (fixed && n.options?.includes(fixed)) n.fixed = [fixed]
      out.push(...nested)
    }
  }

  classesInOrder(entity).forEach((entry, i) => {
    for (let level = 1; level <= entry.level; level++) {
      out.push(...levelGrants(rules, entry.classId, level, { subclassId: entry.subclassId, first: i === 0 }).choices)
    }
  })

  // Attach the saved picks, then what those picks ask in turn.
  const result: OwedChoice[] = []
  const queue = [...out]
  while (queue.length) {
    const next = queue.shift()!
    next.made = next.fixed ? { source: next.source, choice: next.choice, values: next.fixed } : entity.choices.find((c) => c.source === next.source && c.choice === next.choice)
    result.push(next)
    queue.push(...nestedChoices(rules, next))
  }
  return result
}

// Whether an owed choice is fully made.
export function isMade(owed: OwedChoice): boolean {
  if (!owed.made) return false
  if (owed.increase) return Object.values(owed.made.increases ?? {}).some((n) => (n ?? 0) > 0)
  return owed.made.values.length >= owed.count
}

// The ability increase a made choice places, checked against its effect's
// patterns and abilities: a pick the effect doesn't allow counts for nothing,
// and the Finish review lists it as unmade.
export function placedIncrease(owed: OwedChoice): Partial<Record<Ability, number>> {
  const e = owed.increase
  const placed = owed.made?.increases
  if (!e || !placed) return {}
  const entries = Object.entries(placed).filter(([, n]) => (n ?? 0) > 0) as [Ability, number][]
  if (entries.some(([a]) => !e.abilities.includes(a))) return {}
  const amounts = entries.map(([, n]) => n).sort((a, b) => b - a)
  const patterns = e.patterns ?? [Array.from({ length: e.choose ?? e.abilities.length }, () => e.amount)]
  const fits = patterns.some((p) => p.length === amounts.length && [...p].sort((a, b) => b - a).every((n, i) => n === amounts[i]))
  return fits ? Object.fromEntries(entries) : {}
}
