// The guided build from level 1 (the spec §3.1 B; PHB ch.2, Create Your
// Character): Crawler Interface's creation flow, whose steps become the
// PHB's. The build is the ladder's first rung, so its choices are the same
// records the ladder makes (play/ladder.ts); this file holds what only the
// build does, pure and tested: the three ability score methods as the data
// prints them (core.json abilityScoreMethods, SRD p.21), the starting
// equipment, the starting languages, and the Finish review's list.

import { characterChoices, isMade } from '../rules/level.ts'
import { ABILITIES, type Ability } from '../rules/expr.ts'
import type { Rules } from '../rules/load.ts'
import type { AbilityScores, CharacterEntity, Item } from '../save/types.ts'

export const STEPS = ['class', 'origin', 'scores', 'level-1', 'details', 'gear', 'finish'] as const
export type Step = (typeof STEPS)[number]

export const STEP_NAME: Record<Step, string> = {
  class: 'Class',
  origin: 'Origin',
  scores: 'Scores',
  'level-1': 'Level 1',
  details: 'Details',
  gear: 'Gear',
  finish: 'Finish',
}

export type Method = 'standard-array' | 'point-buy' | 'random'

const methods = (rules: Rules) => rules.data.core.abilityScoreMethods!

// The Standard Array by Class table's suggestion (SRD p.21), the build's
// preassignment (Crawler Interface's law 13: defaults all the way through).
// Without a class, the array in the abilities' own order.
export function standardAssignment(rules: Rules, classId: string | undefined): AbilityScores {
  const byClass = classId ? methods(rules).standardArray.byClass[classId] : undefined
  if (byClass) return { ...byClass }
  const scores = methods(rules).standardArray.scores
  return Object.fromEntries(ABILITIES.map((a, i) => [a, scores[i]])) as unknown as AbilityScores
}

// One ability takes another's value and gives it its own, so an assignment
// from a fixed set (the array, six rolls) stays that set.
export function swapScore(base: AbilityScores, ability: Ability, value: number): AbilityScores {
  const holder = ABILITIES.find((a) => base[a] === value && a !== ability)
  const next = { ...base, [ability]: value }
  if (holder) next[holder] = base[ability]
  return next
}

// Point buy (SRD p.21): each score's cost from the table, the budget, and
// the scores the table covers.
export function pointCost(rules: Rules, score: number): number | undefined {
  return methods(rules).pointBuy.costs.find((c) => c.score === score)?.cost
}

export function pointsSpent(rules: Rules, base: AbilityScores): number {
  return ABILITIES.reduce((n, a) => n + (pointCost(rules, base[a]) ?? Infinity), 0)
}

export const pointBudget = (rules: Rules) => methods(rules).pointBuy.budget

export function pointRange(rules: Rules): { min: number; max: number } {
  const scores = methods(rules).pointBuy.costs.map((c) => c.score)
  return { min: Math.min(...scores), max: Math.max(...scores) }
}

// Point buy's start: every score at the table's lowest, nothing spent.
export function pointBuyStart(rules: Rules): AbilityScores {
  const { min } = pointRange(rules)
  return Object.fromEntries(ABILITIES.map((a) => [a, min])) as unknown as AbilityScores
}

// A score one step up or down in point buy, if the table and the budget
// allow it.
export function pointStep(rules: Rules, base: AbilityScores, ability: Ability, by: 1 | -1): AbilityScores | null {
  const next = { ...base, [ability]: base[ability] + by }
  if (pointCost(rules, next[ability]) === undefined) return null
  return pointsSpent(rules, next) <= pointBudget(rules) ? next : null
}

// Random generation (SRD p.21): each of six numbers is the highest three of
// four d6. Rolled on the app's dice by the screen; this keeps the highest.
export function keepHighest(faces: readonly number[], keep: number): number {
  return [...faces]
    .sort((a, b) => b - a)
    .slice(0, keep)
    .reduce((n, f) => n + f, 0)
}

export const randomRule = (rules: Rules) => methods(rules).random

// Six rolled numbers placed as the class's table places the array: the
// ability the table gives its highest score gets the highest roll, and so on.
export function placeRolls(rules: Rules, classId: string | undefined, rolls: readonly number[]): AbilityScores {
  const suggestion = standardAssignment(rules, classId)
  const order = [...ABILITIES].sort((a, b) => suggestion[b] - suggestion[a])
  const sorted = [...rolls].sort((a, b) => b - a)
  return Object.fromEntries(order.map((a, i) => [a, sorted[i] ?? 10])) as unknown as AbilityScores
}

export function setScores(entity: CharacterEntity, base: AbilityScores, method: Method, rolls: number[] = []): CharacterEntity {
  return { ...entity, abilities: { base, generation: { method, rolls } } }
}

// The build's class: the one class, at level 1, replacing any other (the
// build makes a level 1 character; the ladder makes the rest).
export function setBuildClass(entity: CharacterEntity, classId: string): CharacterEntity {
  return { ...entity, classes: [{ classId, level: 1, hp: [{ level: 1, method: 'max' }] }], classOrder: [classId] }
}

// Starting equipment (SRD p.21, step 1 and the background): the class's
// and the background's chosen packages as items, armor and a shield worn,
// and their gold. What an earlier pick added is replaced, so changing a
// package leaves no doubles; items the player added stay.
export const STARTING_TAG = 'starting equipment'

export interface Package {
  id: string
  text: string
  items?: { item: string; quantity: number; note?: string }[]
  gp?: number
}

export function packages(rules: Rules, entity: CharacterEntity): { class?: Package[]; background?: Package[] } {
  const cls = entity.classes[0] && rules.classes.get(entity.classes[0].classId)
  const bg = entity.background && rules.backgrounds.get(entity.background.backgroundId)
  return { class: cls?.startingEquipment as Package[] | undefined, background: bg?.equipment as Package[] | undefined }
}

function catalogue(rules: Rules, ref: string) {
  const id = ref.replace(/^equipment:/, '')
  const e = rules.data.equipment
  return [...e.weapons, ...e.armor, ...e.gear, ...e.tools].find((x) => x.id === id) as { id: string; name: string; weight?: number | string; category?: string } | undefined
}

export function applyStartingEquipment(rules: Rules, entity: CharacterEntity, picks: { class?: string; background?: string }, newId: () => string): CharacterEntity {
  const all = packages(rules, entity)
  const chosen = [all.class?.find((p) => p.id === picks.class), all.background?.find((p) => p.id === picks.background)].filter(Boolean) as Package[]
  const kept = entity.inventory.filter((i) => !i.tags.includes(STARTING_TAG))
  const added: Item[] = []
  let armorWorn = false
  for (const pack of chosen) {
    for (const line of pack.items ?? []) {
      const record = catalogue(rules, line.item)
      if (!record) continue
      const isArmor = rules.armor.has(record.id)
      const shield = rules.armor.get(record.id)?.category === 'shield'
      const wear = isArmor && (shield || !armorWorn)
      if (isArmor && !shield && wear) armorWorn = true
      added.push({
        id: newId(),
        name: record.name,
        description: line.note ?? '',
        quantity: line.quantity,
        tags: [STARTING_TAG],
        itemId: `equipment:${record.id}`,
        ...(typeof record.weight === 'number' ? { weight: record.weight } : {}),
        ...(wear ? { worn: true } : {}),
      })
    }
  }
  const gp = chosen.reduce((n, p) => n + (p.gp ?? 0), 0)
  return {
    ...entity,
    inventory: [...kept, ...added],
    coins: { ...entity.coins, gp },
    creation: { ...entity.creation, equipment: { ...picks } },
  }
}

// Languages (SRD p.20): the ones every character knows, and how many more
// from which kind.
export function languageRule(rules: Rules) {
  const rule = rules.data.core.startingLanguages!
  const known = rule.known
  const options = rules.data.core.languages.filter((l) => l.kind === rule.kind && !known.includes(l.id))
  return { known, choose: rule.choose, options }
}

export function setLanguages(rules: Rules, entity: CharacterEntity, chosen: string[]): CharacterEntity {
  const { known, choose } = languageRule(rules)
  const extra = chosen.filter((l) => !known.includes(l)).slice(0, choose)
  return { ...entity, details: { ...entity.details, languages: [...known, ...extra] } }
}

// The Finish review (Crawler Interface's Finish step; the spec §3.1 A step
// 7 and B): everything unfinished, each with the step that fixes it.
export interface Unfinished {
  step: Step
  text: string
}

export function unfinished(rules: Rules, entity: CharacterEntity): Unfinished[] {
  const out: Unfinished[] = []
  if (!entity.classes.length) out.push({ step: 'class', text: 'Choose a class.' })
  if (!entity.background) out.push({ step: 'origin', text: 'Choose a background.' })
  if (!entity.species) out.push({ step: 'origin', text: 'Choose a species.' })
  const method = entity.abilities.generation.method
  if (method === 'point-buy') {
    const spent = pointsSpent(rules, entity.abilities.base)
    if (spent !== pointBudget(rules)) out.push({ step: 'scores', text: `Point buy has ${spent > pointBudget(rules) ? 'gone over' : `${pointBudget(rules) - spent} points left`}.` })
  }
  if (method === 'random' && entity.abilities.generation.rolls.length < randomRule(rules).times) out.push({ step: 'scores', text: 'Roll the six scores.' })
  const owed = characterChoices(rules, entity).filter((c) => !isMade(c)).length
  if (owed) out.push({ step: 'level-1', text: `${owed} ${owed === 1 ? 'choice' : 'choices'} to make.` })
  if (!entity.name.trim()) out.push({ step: 'details', text: 'Name your character.' })
  const { known, choose } = languageRule(rules)
  const extra = entity.details.languages.filter((l) => !known.includes(l)).length
  if (extra < choose) out.push({ step: 'details', text: `Choose ${choose - extra} more ${choose - extra === 1 ? 'language' : 'languages'}.` })
  if (!entity.creation.equipment) out.push({ step: 'gear', text: 'Choose your starting equipment.' })
  return out
}


// Finish for a character started at any level (§3.1 A): what is still open
// before the sheet, in words, each where the Levels page or the sheet
// settles it. owed counts the ladder's choices still to make, a subclass
// among them. Like the build's Finish, nothing here blocks: Finish opens the
// sheet, and anything left stays where it is.
export function anyLevelUnfinished(rules: Rules, entity: CharacterEntity, owed: number): string[] {
  const out: string[] = []
  if (!entity.classes.length) out.push('Choose a class: + Class.')
  if (!entity.species || !entity.background) out.push('Choose a species and a background: the Species and background chip.')
  if (owed) out.push(`${owed} ${owed === 1 ? 'choice' : 'choices'} to make on the ladder.`)
  if (!entity.name.trim()) out.push('Name your character.')
  const { known, choose } = languageRule(rules)
  const extra = entity.details.languages.filter((l) => !known.includes(l)).length
  if (extra < choose) out.push(`Choose ${choose - extra} more ${choose - extra === 1 ? 'language' : 'languages'}.`)
  if (!entity.inventory.length) out.push('Nothing in the inventory yet: Add from catalogue, in the sheet’s Inventory.')
  return out
}
