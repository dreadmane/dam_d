// The turn (the spec §3.3, On your turn): what the character can do, grouped
// by the action it takes, Action, Bonus Action and Reaction, then Also for
// what has uses but no action of its own; and, Exploring, the checks, the
// rituals and the utility spells. Pure, so every grouping is tested without
// React (the play-view audit's recommendation 1, 2026-10-20).
//
// The group comes from the data, never from a name: a spell's casting time
// (spells.json castingTime.unit), a feature's action (classes.json and the
// rest, feature.action). A feature with uses or a switch but no action
// tagged goes to Also; it is not guessed into a group.

import type { Attack, Resource, Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { Feature } from '../rules/types.ts'
import type { CharacterEntity } from '../save/types.ts'
import { featureCost, reactions, toggles, type Reaction, type Toggle } from './kit.ts'
import { castOptions, characterSpells, type SpellRow } from './spells.ts'

export type TurnGroup = 'action' | 'bonus' | 'reaction' | 'also'

export type TurnRow =
  | { kind: 'attack'; key: string; attack: Attack }
  | { kind: 'spell'; key: string; row: SpellRow }
  | { kind: 'feature'; key: string; feature: Feature; from: string; cost?: Toggle['cost']; toggle?: Toggle }
  | { kind: 'resource'; key: string; resource: Resource }
  | { kind: 'opportunity'; key: string; reaction: Extract<Reaction, { kind: 'opportunity' }> }
  | { kind: 'actions'; key: string; actions: { id: string; name: string; text: string }[] }

export interface Turn {
  action: TurnRow[]
  bonus: TurnRow[]
  reaction: TurnRow[]
  also: TurnRow[]
}

// The order the groups are drawn in, with the names the rules give the first
// three (core.json's glossary: Action, Bonus Action, Reaction).
export const TURN_GROUPS: readonly TurnGroup[] = ['action', 'bonus', 'reaction', 'also']

export function groupNames(rules: Rules): Record<TurnGroup, string> {
  const named = (id: string, fallback: string) => rules.data.core.rules.find((r) => r.id === id)?.name ?? fallback
  return { action: named('action', 'Action'), bonus: named('bonus-action', 'Bonus Action'), reaction: named('reaction', 'Reaction'), also: 'Also' }
}

const SPELL_GROUP: Partial<Record<string, TurnGroup>> = { action: 'action', 'bonus-action': 'bonus', reaction: 'reaction' }
const FEATURE_GROUP: Partial<Record<string, TurnGroup>> = { action: 'action', 'bonus-action': 'bonus', reaction: 'reaction' }

// The group a spell's casting takes, or none for one cast over a minute or
// longer, which is no part of a turn.
export const spellGroup = (row: SpellRow): TurnGroup | null => SPELL_GROUP[row.spell.castingTime.unit] ?? null

// The pip a row spends when it is used: its group's, or none for Also.
export function rowGroup(row: TurnRow): Exclude<TurnGroup, 'also'> | null {
  switch (row.kind) {
    case 'attack':
    case 'actions':
      return 'action'
    case 'opportunity':
      return 'reaction'
    case 'spell': {
      const g = spellGroup(row.row)
      return g === 'also' ? null : g
    }
    case 'feature': {
      const g = FEATURE_GROUP[row.feature.action ?? '']
      return g === 'also' || !g ? null : g
    }
    case 'resource':
      return null
  }
}

// The actions anyone can take, as the glossary's Action entry lists them
// (SRD p.176), each with its own entry's text. Attack and Magic are left
// out: the attacks and the spells above them are those.
function commonActions(rules: Rules): { id: string; name: string; text: string }[] {
  const glossary = rules.data.core.rules
  const listed = glossary.find((r) => r.id === 'action')?.text ?? ''
  const names = [...listed.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim())
  const covered = new Set(['attack', 'magic'])
  return names.flatMap((name) => {
    const entry = glossary.find((r) => r.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    return entry && !covered.has(entry.id) ? [{ id: entry.id, name: entry.name, text: entry.text }] : []
  })
}

// Everything on the turn. Within a group: attacks, then spells by level
// (cantrips first) and name, then features; the actions anyone can take
// close the Action group. Reactions are the Reactions band's own list
// (play/kit.ts), so the two never disagree.
export function turnRows(rules: Rules, entity: CharacterEntity, sheet: Sheet): Turn {
  const turn: Turn = { action: [], bonus: [], reaction: [], also: [] }

  for (const a of sheet.attacks) turn.action.push({ kind: 'attack', key: `attack:${a.id}`, attack: a })

  for (const row of characterSpells(rules, entity, sheet)) {
    const g = spellGroup(row)
    if (!row.ready || !g || g === 'reaction') continue
    turn[g].push({ kind: 'spell', key: `spell:${row.spell.id}`, row })
  }

  const switches = new Map(toggles(rules, entity, sheet).map((t) => [t.ref, t]))
  const claimed = new Set<string>()
  const seen = new Set<string>()
  for (const g of sheet.features) {
    const f = g.feature
    if (seen.has(f.id)) continue
    const cost = featureCost(sheet, f, g.classId)
    const toggle = switches.get(f.id)
    const group = FEATURE_GROUP[f.action ?? '']
    // Reactions come from the band's list below.
    if (group === 'reaction') continue
    if (!group && !cost && !toggle) continue
    seen.add(f.id)
    if (cost) claimed.add(cost.key)
    turn[group ?? 'also'].push({ kind: 'feature', key: `feature:${f.id}`, feature: f, from: g.group, cost, toggle })
  }

  for (const r of reactions(rules, entity, sheet)) {
    if (r.kind === 'opportunity') turn.reaction.push({ kind: 'opportunity', key: 'opportunity', reaction: r })
    else if (r.kind === 'spell') turn.reaction.push({ kind: 'spell', key: `spell:${r.row.spell.id}`, row: r.row })
    else {
      const g = sheet.features.find((x) => x.feature.id === r.feature.id)
      const cost = featureCost(sheet, r.feature, g?.classId)
      if (cost) claimed.add(cost.key)
      turn.reaction.push({ kind: 'feature', key: `feature:${r.feature.id}`, feature: r.feature, from: r.detail, cost })
    }
  }

  // Uses no feature above names (a feat's, a species trait's).
  for (const r of sheet.resources) if (!claimed.has(r.key)) turn.also.push({ kind: 'resource', key: `resource:${r.key}`, resource: r })

  const actions = commonActions(rules)
  if (actions.length) turn.action.push({ kind: 'actions', key: 'actions', actions })
  return turn
}

// A spell that can't be cast now: a levelled spell with no slot left for it.
export const outOfSlots = (rules: Rules, sheet: Sheet, entity: CharacterEntity, row: SpellRow): boolean => row.spell.level > 0 && castOptions(rules, sheet, entity, row).length === 0

// ---------------------------------------------------------------- exploring

export interface Exploring {
  // The skills the character is proficient in, the best first: the checks a
  // table asks this character for. Every skill is still under Skills.
  checks: Sheet['skills']
  // Ready spells the character can cast as a ritual, spending no slot.
  rituals: SpellRow[]
  // Ready spells that make no attack, force no save and deal no damage, and
  // are not cast as a Reaction: the light, the hand, the armor.
  utility: SpellRow[]
}

export function exploring(rules: Rules, entity: CharacterEntity, sheet: Sheet): Exploring {
  const checks = sheet.skills.filter((s) => s.proficiency > 0).toSorted((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  const ready = characterSpells(rules, entity, sheet).filter((r) => r.ready)
  const rituals = ready.filter((r) => castOptions(rules, sheet, entity, r).some((o) => o.kind === 'ritual'))
  const ritualIds = new Set(rituals.map((r) => r.spell.id))
  const utility = ready.filter((r) => !ritualIds.has(r.spell.id) && r.spell.castingTime.unit !== 'reaction' && !r.spell.attack && !r.spell.save && !(r.spell.damage as unknown[] | undefined)?.length)
  return { checks, rituals, utility }
}
