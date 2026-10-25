// The level ladder (the M1 concept round's direction B, picked 2026-10-19;
// the spec §3.1 A): every class level a rung with its features, its HP and
// its choices. Starting at any level fills the ladder, levelling up adds a
// rung, and the build from level 1 is its first rung. This file is the
// ladder's data and every edit it makes, pure, so they are tested without
// React; components/Ladder.tsx draws it.
//
// An edit never drops a pick. Lowering a level leaves the picks the higher
// levels made in the save, unused, so raising it again brings them back; the
// engine reads only the levels the character has.

import { characterChoices, classesInOrder, levelGrants, type OwedChoice } from '../rules/level.ts'
import type { Rules } from '../rules/load.ts'
import type { Ability } from '../rules/expr.ts'
import type { CharacterEntity, ClassEntry, Choice } from '../save/types.ts'
import type { Feature } from '../rules/types.ts'

export type HpMethod = ClassEntry['hp'][number]

export interface Rung {
  classId: string
  className: string
  level: number
  features: Feature[]
  choices: OwedChoice[]
  // This level asks for the subclass (the class entry's subclassId).
  subclass: boolean
  hp: { method: HpMethod['method']; value?: number; first: boolean }
}

// The ladder's rungs: each class in the order taken, levels 1 up, each with
// the choices that level owes (and what those picks ask in turn).
export function rungs(rules: Rules, entity: CharacterEntity): Rung[] {
  const owed = characterChoices(rules, entity)
  const out: Rung[] = []
  classesInOrder(entity).forEach((entry, i) => {
    const cls = rules.classes.get(entry.classId)
    for (let level = 1; level <= entry.level; level++) {
      const grant = levelGrants(rules, entry.classId, level, { subclassId: entry.subclassId, first: i === 0 })
      const source = `class:${entry.classId}:${level}`
      const stored = entry.hp.find((h) => h.level === level)
      const first = i === 0 && level === 1
      out.push({
        classId: entry.classId,
        className: cls?.name ?? entry.classId,
        level,
        features: grant.features,
        choices: owed.filter((c) => c.source === source || c.source.startsWith(`${source}>`)),
        subclass: grant.subclass,
        hp: { method: first ? 'max' : (stored?.method ?? 'fixed'), value: stored?.value, first },
      })
    }
  })
  return out
}

// The origin's choices (a lineage, Keen Senses, a background's feat's
// picks), shown on the ladder's origin rung.
export const originChoices = (rules: Rules, entity: CharacterEntity) =>
  characterChoices(rules, entity).filter((c) => c.source.startsWith('species:') || c.source.startsWith('background:'))

const withClass = (entity: CharacterEntity, classId: string, change: (entry: ClassEntry) => ClassEntry): CharacterEntity => ({
  ...entity,
  classes: entity.classes.map((c) => (c.classId === classId ? change(c) : c)),
})

// HP entries for every level up to `level`, keeping those already there: the
// first class's level 1 takes the die's maximum, any other level the fixed
// value until the player says otherwise (C3).
function hpTo(entry: ClassEntry, level: number, first: boolean): ClassEntry['hp'] {
  const hp = [...entry.hp]
  for (let l = 1; l <= level; l++) {
    if (!hp.some((h) => h.level === l)) hp.push({ level: l, method: first && l === 1 ? 'max' : 'fixed' })
  }
  return hp.sort((a, b) => a.level - b.level)
}

const isFirst = (entity: CharacterEntity, classId: string) => classesInOrder(entity)[0]?.classId === classId

// A class added at level 1, after the others in the order taken.
export function addClass(entity: CharacterEntity, classId: string): CharacterEntity {
  if (entity.classes.some((c) => c.classId === classId)) return entity
  const first = entity.classes.length === 0
  const entry: ClassEntry = { classId, level: 1, hp: [{ level: 1, method: first ? 'max' : 'fixed' }] }
  const order = classesInOrder(entity).map((c) => c.classId)
  return { ...entity, classes: [...entity.classes, entry], classOrder: [...order, classId] }
}

export function removeClass(entity: CharacterEntity, classId: string): CharacterEntity {
  const classes = entity.classes.filter((c) => c.classId !== classId)
  const order = (entity.classOrder ?? []).filter((id) => id !== classId)
  const next: CharacterEntity = { ...entity, classes, classOrder: order }
  // The class now first takes the die's maximum at its level 1.
  const first = classesInOrder(next)[0]
  return first ? withClass(next, first.classId, (e) => ({ ...e, hp: e.hp.map((h) => (h.level === 1 ? { level: 1, method: 'max' } : h)) })) : next
}

// A class's level, 1 to 20, keeping the character at 20 or under.
export function setClassLevel(entity: CharacterEntity, classId: string, level: number): CharacterEntity {
  const others = entity.classes.filter((c) => c.classId !== classId).reduce((n, c) => n + c.level, 0)
  const to = Math.max(1, Math.min(level, 20 - others))
  const first = isFirst(entity, classId)
  return withClass(entity, classId, (e) => ({ ...e, level: to, hp: hpTo(e, to, first) }))
}

export function setSubclass(entity: CharacterEntity, classId: string, subclassId: string | null): CharacterEntity {
  return withClass(entity, classId, (e) => {
    const { subclassId: _, ...rest } = e
    return subclassId ? { ...rest, subclassId } : rest
  })
}

// One level's HP: the fixed value, a roll (kept), or, for the first class's
// level 1, always the die's maximum.
export function setHp(entity: CharacterEntity, classId: string, level: number, method: 'fixed' | 'rolled', value?: number): CharacterEntity {
  if (isFirst(entity, classId) && level === 1) return entity
  return withClass(entity, classId, (e) => ({
    ...e,
    hp: e.hp.map((h) => (h.level === level ? (method === 'rolled' && value ? { level, method, value } : { level, method: 'fixed' }) : h)),
  }))
}

// A choice's picks, replacing what was there; none removes it.
export function setChoice(entity: CharacterEntity, owed: Pick<OwedChoice, 'source' | 'choice'>, values: string[], increases?: Partial<Record<Ability, number>>): CharacterEntity {
  const rest = entity.choices.filter((c) => !(c.source === owed.source && c.choice === owed.choice))
  const empty = values.length === 0 && !Object.values(increases ?? {}).some((n) => n)
  if (empty) return { ...entity, choices: rest }
  const choice: Choice = { source: owed.source, choice: owed.choice, values, ...(increases ? { increases } : {}) }
  return { ...entity, choices: [...rest, choice] }
}

// Level up (§3.2): one more level in a class held, or level 1 of a new one,
// with that level's HP as the player chose.
export function levelUp(entity: CharacterEntity, classId: string, hp: { method: 'fixed' | 'rolled'; value?: number }): CharacterEntity {
  const held = entity.classes.find((c) => c.classId === classId)
  const grown = held ? setClassLevel(entity, classId, held.level + 1) : addClass(entity, classId)
  const level = held ? held.level + 1 : 1
  return setHp(grown, classId, level, hp.method, hp.value)
}

export const characterLevel = (entity: CharacterEntity) => entity.classes.reduce((n, c) => n + c.level, 0)

// The origin. A new species or background clears its own picks (a Wood Elf's
// lineage means nothing to a Dwarf); the background's increases restart on
// the new background's three abilities.
export function setSpecies(entity: CharacterEntity, speciesId: string | null, rules: Rules): CharacterEntity {
  const old = entity.species?.speciesId
  const choices = entity.choices.filter((c) => !c.source.startsWith(`species:${old}`))
  if (!speciesId) return { ...entity, species: null, choices }
  const sizes = rules.species.get(speciesId)?.sizes ?? ['medium']
  return { ...entity, species: { speciesId, size: sizes[0] as 'small' | 'medium' }, choices }
}

export function setSize(entity: CharacterEntity, size: 'small' | 'medium'): CharacterEntity {
  return entity.species ? { ...entity, species: { ...entity.species, size } } : entity
}

export function setBackground(entity: CharacterEntity, backgroundId: string | null, rules: Rules): CharacterEntity {
  const old = entity.background?.backgroundId
  const choices = entity.choices.filter((c) => !c.source.startsWith(`background:${old}`))
  if (!backgroundId) return { ...entity, background: null, choices }
  // +2 to the background's ability with the highest score and +1 to the
  // next (the build has placed the class's scores by then), ties in the
  // order printed: the default the player changes (Crawler Interface's law
  // 13). The rules allow any of +2/+1 or +1/+1/+1 (SRD p.83).
  const printed = (rules.backgrounds.get(backgroundId)?.abilities ?? []) as Ability[]
  const abilities = [...printed].sort((x, y) => entity.abilities.base[y] - entity.abilities.base[x] || printed.indexOf(x) - printed.indexOf(y))
  const abilityIncreases = abilities.length >= 2 ? { [abilities[0]]: 2, [abilities[1]]: 1 } : {}
  return { ...entity, background: { backgroundId, abilityIncreases }, choices }
}

export function setBackgroundIncreases(entity: CharacterEntity, increases: Partial<Record<Ability, number>>): CharacterEntity {
  return entity.background ? { ...entity, background: { ...entity.background, abilityIncreases: increases } } : entity
}

// A base score typed in (the any-level route: the player copies a sheet).
export function setBaseScore(entity: CharacterEntity, ability: Ability, score: number): CharacterEntity {
  const value = Math.max(1, Math.min(30, Math.round(score) || 1))
  return { ...entity, abilities: { base: { ...entity.abilities.base, [ability]: value }, generation: { method: 'entered', rolls: [] } } }
}

// The background's increase patterns (+2/+1 or +1/+1/+1, SRD p.83) as the
// increases each allows: whether a placement fits.
export function backgroundIncreaseFits(increases: Partial<Record<Ability, number>>, abilities: readonly string[]): boolean {
  const placed = Object.entries(increases).filter(([, n]) => (n ?? 0) > 0)
  if (placed.some(([a]) => !abilities.includes(a))) return false
  const amounts = placed.map(([, n]) => n as number).sort((a, b) => b - a)
  return (amounts.length === 2 && amounts[0] === 2 && amounts[1] === 1) || (amounts.length === 3 && amounts.every((n) => n === 1))
}
