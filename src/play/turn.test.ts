// The turn's groups (play/turn.ts) and the tracker (play/tracker.ts), on the
// examples: Halvard Stoneward (Cleric 5 / Fighter 2) and Ilsabet Vane
// (Wizard 5).

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import cleric from '../save/examples/cleric-fighter.json'
import wizard from '../save/examples/wizard.json'
import type { CharacterEntity } from '../save/types.ts'
import { FRESH, feetLeft, movementSteps, newTurn, parseTurns, setMode, spendPip, tapStep, togglePip, turnOf, withTurn } from './tracker.ts'
import { exploring, groupNames, outOfSlots, rowGroup, turnRows, type TurnRow } from './turn.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity
const names = (rows: TurnRow[]) =>
  rows.map((r) => (r.kind === 'attack' ? r.attack.name : r.kind === 'spell' ? r.row.spell.name : r.kind === 'feature' ? r.feature.name : r.kind === 'resource' ? r.resource.name : r.kind === 'opportunity' ? r.reaction.name : 'actions'))

describe('the turn, grouped by the action it takes', () => {
  const halvard = entity(cleric)
  const hSheet = deriveSheet(rules, halvard)
  const h = turnRows(rules, halvard, hSheet)
  const ilsabet = entity(wizard)
  const iSheet = deriveSheet(rules, ilsabet)
  const i = turnRows(rules, ilsabet, iSheet)

  it('names the groups as the glossary does', () => {
    expect(groupNames(rules)).toEqual({ action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', also: 'Also' })
  })

  it('puts every attack first in Action, and the actions anyone can take last', () => {
    expect(h.action.slice(0, hSheet.attacks.length).map((r) => r.kind)).toEqual(hSheet.attacks.map(() => 'attack'))
    const last = h.action.at(-1)!
    expect(last.kind).toBe('actions')
    // The glossary's list (SRD p.176), less Attack and Magic, which the rows above are.
    if (last.kind === 'actions') expect(last.actions.map((a) => a.name)).toEqual(['Dash', 'Disengage', 'Dodge', 'Help', 'Hide', 'Influence', 'Ready', 'Search', 'Study', 'Utilize'])
  })

  it('groups ready spells by their casting time', () => {
    for (const r of [...i.action, ...i.bonus]) if (r.kind === 'spell') expect(r.row.ready).toBe(true)
    expect(names(i.action)).toContain('Fire Bolt')
    expect(names(i.action)).toContain('Fireball')
    expect(names(i.bonus)).toContain('Misty Step')
    expect(names(i.action)).not.toContain('Misty Step')
    // A spell cast over a minute or more is no part of a turn.
    for (const r of [...i.action, ...i.bonus, ...i.reaction]) if (r.kind === 'spell') expect(['action', 'bonus-action', 'reaction']).toContain(r.row.spell.castingTime.unit)
  })

  it('takes Reaction from the Reactions band: the Opportunity Attack first, then Shield', () => {
    expect(i.reaction[0].kind).toBe('opportunity')
    expect(names(i.reaction)).toContain('Shield')
  })

  it('puts a feature tagged as a Bonus Action there, with its uses', () => {
    const wind = h.bonus.find((r) => r.kind === 'feature' && r.feature.id === 'second-wind')
    expect(wind).toMatchObject({ kind: 'feature', cost: { name: 'Second Wind' } })
  })

  it('puts a feature with uses but no action tagged in Also, never guessing a group', () => {
    const also = names(h.also)
    expect(also).toContain('Action Surge')
    expect(also).toContain('Channel Divinity')
    expect(names([...h.action, ...h.bonus, ...h.reaction])).not.toContain('Action Surge')
  })

  // The action types tagged 2026-10-20 (the workspace's
  // apps/d-amp-d/notes/2026-10-20-feature-action-types): each moves its
  // feature out of Also, or keeps it there with the tag said.
  describe('the features tagged with an action on 2026-10-20', () => {
    const as = (classId: string, level: number): CharacterEntity => {
      const e = entity(cleric)
      e.classes = [{ classId, level, hp: Array.from({ length: level }, (_, n) => ({ level: n + 1, method: n ? 'fixed' : 'max' })) }] as CharacterEntity['classes']
      return e
    }
    const turnOfChar = (e: CharacterEntity) => turnRows(rules, e, deriveSheet(rules, e))

    it("puts Monk's Focus under Bonus Action (SRD p.50)", () => {
      const t = turnOfChar(as('monk', 2))
      expect(names(t.bonus)).toContain('Monk’s Focus')
      expect(names(t.also)).not.toContain('Monk’s Focus')
    })

    it('puts Favored Enemy under Bonus Action and Tireless under Action (SRD p.58, p.59)', () => {
      const t = turnOfChar(as('ranger', 10))
      expect(names(t.bonus)).toContain('Favored Enemy')
      expect(names(t.action)).toContain('Tireless')
    })

    it('tags the Forest Gnome lineage as an action, which the turn reads as any trait’s', () => {
      expect(rules.species.get('gnome')?.lineages?.options.find((o) => o.id === 'forest-gnome')?.action).toBe('action')
    })

    it('keeps Action Surge in Also, tagged as taking no action', () => {
      expect(names(h.also)).toContain('Action Surge')
      const surge = h.also.find((r) => r.kind === 'feature' && r.feature.id === 'action-surge')
      expect(surge?.kind === 'feature' && surge.feature.action).toBe('none')
    })
  })

  it('lists each resource once: on its feature, or alone in Also', () => {
    const keys = [...h.action, ...h.bonus, ...h.reaction, ...h.also].flatMap((r) => (r.kind === 'feature' && r.cost ? [r.cost.key] : r.kind === 'resource' ? [r.resource.key] : []))
    expect(new Set(keys).size).toBe(keys.length)
    for (const r of hSheet.resources) expect(keys).toContain(r.key)
  })

  it('spends the pip of the group a row is in', () => {
    expect(rowGroup(h.action[0])).toBe('action')
    expect(rowGroup(i.reaction[0])).toBe('reaction')
    const misty = i.bonus.find((r) => r.kind === 'spell' && r.row.spell.id === 'misty-step')!
    expect(rowGroup(misty)).toBe('bonus')
    for (const r of h.also) expect(rowGroup(r)).toBeNull()
  })

  it('marks a levelled spell with no slot left', () => {
    const fireball = i.action.find((r) => r.kind === 'spell' && r.row.spell.id === 'fireball')
    if (fireball?.kind !== 'spell') throw new Error('no Fireball')
    expect(outOfSlots(rules, iSheet, ilsabet, fireball.row)).toBe(false)
    const spent = { ...ilsabet, slotsExpended: { '3': 2 } }
    expect(outOfSlots(rules, deriveSheet(rules, spent), spent, fireball.row)).toBe(true)
  })
})

describe('exploring', () => {
  const ilsabet = entity(wizard)
  const sheet = deriveSheet(rules, ilsabet)
  const e = exploring(rules, ilsabet, sheet)

  it('lists the proficient skills, the best first', () => {
    expect(e.checks.length).toBeGreaterThan(0)
    expect(e.checks.every((s) => s.proficiency > 0)).toBe(true)
    for (let k = 1; k < e.checks.length; k++) expect(e.checks[k - 1].total).toBeGreaterThanOrEqual(e.checks[k].total)
  })

  it('lists ready rituals, and utility spells that attack, force and deal nothing', () => {
    for (const r of e.rituals) expect(r.spell.castingTime.ritual).toBe(true)
    for (const r of e.utility) {
      expect(r.spell.attack).toBeUndefined()
      expect(r.spell.save).toBeUndefined()
      expect(r.spell.castingTime.unit).not.toBe('reaction')
    }
    const ritualIds = new Set(e.rituals.map((r) => r.spell.id))
    for (const r of e.utility) expect(ritualIds.has(r.spell.id)).toBe(false)
  })
})

describe('the tracker', () => {
  it('spends and gives back a pip, and New turn clears all but the mode', () => {
    let t = togglePip(FRESH, 'action')
    expect(t.action).toBe(true)
    expect(togglePip(t, 'action').action).toBe(false)
    t = spendPip(spendPip(t, 'bonus'), 'bonus')
    expect(t.bonus).toBe(true)
    t = setMode(tapStep(t, 2), 'explore')
    expect(newTurn(t)).toEqual({ ...FRESH, mode: 'explore' })
  })

  it('counts movement in 5-foot steps, and the last step tapped again comes back', () => {
    expect(movementSteps(30)).toBe(6)
    expect(movementSteps(25)).toBe(5)
    let t = tapStep(FRESH, 2)
    expect(t.moved).toBe(15)
    expect(feetLeft(t, 30)).toBe(15)
    t = tapStep(t, 2)
    expect(t.moved).toBe(10)
    t = tapStep(t, 5)
    expect(feetLeft(t, 30)).toBe(0)
  })

  it('keeps each character’s turn apart, and reads a damaged value as fresh', () => {
    const all = withTurn(withTurn({}, 'a', togglePip(FRESH, 'reaction')), 'b', FRESH)
    expect(turnOf(all, 'a').reaction).toBe(true)
    expect(turnOf(all, 'b').reaction).toBe(false)
    expect(turnOf(all, 'c')).toEqual(FRESH)
    expect(parseTurns(JSON.stringify(all))).toEqual(all)
    expect(parseTurns('not json')).toEqual({})
    expect(parseTurns('{"a":{"mode":"sideways","action":"yes","moved":-5}}')).toEqual({ a: FRESH })
    expect(parseTurns('{"a":{"moved":17}}').a.moved).toBe(15)
  })

  it('keeps the 50 most recent characters', () => {
    let all = {}
    for (let k = 0; k < 60; k++) all = withTurn(all, `c${k}`, FRESH)
    expect(Object.keys(all)).toHaveLength(50)
    expect(Object.keys(all)[0]).toBe('c10')
  })
})
