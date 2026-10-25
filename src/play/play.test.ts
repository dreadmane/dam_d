// Play at the table (play/play.ts), on the example characters. The SRD's own
// worked examples are used where it prints them.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import cleric from '../save/examples/cleric-fighter.json'
import fighter from '../save/examples/fighter.json'
import type { CharacterEntity } from '../save/types.ts'
import { deathSave, finishLongRest, finishShortRest, gainTemp, heal, isStable, rollD20, rollMode, spendHitDie, takeDamage, spendResource } from './play.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity
const halvard = () => entity(cleric)
const sheetOf = (e: CharacterEntity) => deriveSheet(rules, e)
// A random source that returns these d20 faces in turn.
const faces = (...f: number[]) => {
  let i = 0
  return () => (f[i++] - 1) / 20
}

describe('a d20 Test (SRD p.7)', () => {
  it('rolls two d20s with Advantage, keeping the higher, and the lower with Disadvantage', () => {
    expect(rollD20(rules, 5, 'advantage', faces(18, 3))).toEqual({ faces: [18, 3], kept: 18, total: 23 })
    expect(rollD20(rules, 5, 'disadvantage', faces(18, 3))).toEqual({ faces: [18, 3], kept: 3, total: 8 })
    expect(rollD20(rules, 5, 'normal', faces(11))).toEqual({ faces: [11], kept: 11, total: 16 })
  })

  it('cancels Advantage and Disadvantage, however many of each', () => {
    expect(rollMode(2, 0)).toBe('advantage')
    expect(rollMode(3, 1)).toBe('normal')
    expect(rollMode(0, 0, 'disadvantage')).toBe('disadvantage')
    expect(rollMode(1, 0, 'disadvantage')).toBe('normal')
  })
})

describe('damage and healing', () => {
  it('takes temporary HP first (SRD p.18’s example: 5 temp, 7 damage, 2 from HP)', () => {
    const e = gainTemp(halvard(), 5)
    const r = takeDamage(rules, e, sheetOf(e), 7, null)
    expect(r.entity.hp).toEqual({ current: 52, temp: 0 })
    expect(r.lines).toEqual(['Temp HP absorbs 5.', '2 to HP.'])
  })

  it('halves damage the character resists, rounding down (the Dwarf resists poison)', () => {
    const r = takeDamage(rules, halvard(), sheetOf(halvard()), 9, 'poison')
    expect(r.taken).toBe(4)
    expect(r.entity.hp.current).toBe(50)
  })

  it('drops to 0 and starts death saves; Massive Damage kills (SRD p.17’s example: max 12, at 6, 18 damage)', () => {
    const e = halvard()
    e.hp.current = 10
    expect(takeDamage(rules, e, sheetOf(e), 15, null).entity.deathSaves).toEqual({ successes: 0, failures: 0 })
    const maren = entity(fighter)
    maren.hp.current = 6
    const dead = takeDamage(rules, maren, sheetOf(maren), 18, null)
    expect(sheetOf(maren).hp.max).toBe(12)
    expect(dead.entity.deathSaves.dead).toBe(true)
  })

  it('ends Concentration at 0 HP, Unconscious being Incapacitated (SRD p.179)', () => {
    const e = { ...halvard(), concentration: { spellId: 'bless' } }
    expect(takeDamage(rules, e, sheetOf(e), 5, null).entity.concentration).toEqual({ spellId: 'bless' })
    expect(takeDamage(rules, e, sheetOf(e), 60, null).entity.concentration).toBeNull()
  })

  it('makes damage at 0 HP a death save failure, two on a Critical Hit', () => {
    const e = halvard()
    e.hp.current = 0
    expect(takeDamage(rules, e, sheetOf(e), 3, null).entity.deathSaves.failures).toBe(1)
    expect(takeDamage(rules, e, sheetOf(e), 3, null, true).entity.deathSaves.failures).toBe(2)
  })

  it('heals no further than the maximum (SRD p.17’s example), and ends the death saves', () => {
    const e = halvard()
    e.hp.current = 0
    e.deathSaves = { successes: 1, failures: 2 }
    const healed = heal(e, 54, 80)
    expect(healed.hp.current).toBe(54)
    expect(healed.deathSaves).toEqual({ successes: 0, failures: 0 })
  })

  it('keeps the higher temporary HP rather than adding them (SRD p.18: 12 or 10, not 22)', () => {
    expect(gainTemp(gainTemp(halvard(), 10), 12).hp.temp).toBe(12)
    expect(gainTemp(gainTemp(halvard(), 12), 10).hp.temp).toBe(12)
  })
})

describe('death saves (SRD p.17)', () => {
  const down = () => {
    const e = halvard()
    e.hp.current = 0
    return e
  }

  it('succeeds on 10 or higher, fails below', () => {
    expect(deathSave(rules, down(), 10).outcome).toBe('success')
    expect(deathSave(rules, down(), 9).outcome).toBe('failure')
  })

  it('makes a 1 two failures and a 20 one hit point', () => {
    expect(deathSave(rules, down(), 1).entity.deathSaves.failures).toBe(2)
    expect(deathSave(rules, down(), 20).entity.hp.current).toBe(1)
  })

  it('is Stable on the third success, dead on the third failure', () => {
    const e = down()
    e.deathSaves = { successes: 2, failures: 2 }
    const stable = deathSave(rules, e, 15)
    expect(stable.outcome).toBe('stable')
    expect(isStable(rules, stable.entity)).toBe(true)
    expect(deathSave(rules, e, 4)).toMatchObject({ outcome: 'dead', entity: { deathSaves: { dead: true } } })
  })
})

describe('resources and rests', () => {
  it('uses and regains a resource within its maximum', () => {
    let e = spendResource(halvard(), 'fighter:second-wind', 2, 1)
    e = spendResource(spendResource(e, 'fighter:second-wind', 2, 1), 'fighter:second-wind', 2, 1)
    expect(e.resourcesUsed['fighter:second-wind']).toBe(2)
    expect(spendResource(e, 'fighter:second-wind', 2, -1).resourcesUsed['fighter:second-wind']).toBe(1)
  })

  it('spends a Hit Point Die: its roll plus Con, at least 1 (SRD p.187)', () => {
    const e = halvard()
    e.hp.current = 30
    const r = spendHitDie(rules, e, sheetOf(e), 10, 7)
    expect(r.healed).toBe(8)
    expect(r.entity.hitDiceSpent).toEqual({ d10: 1 })
    const low = spendHitDie(rules, e, sheetOf(e), 8, 1)
    expect(low.healed).toBe(2)
  })

  it('brings back a Short Rest’s resources on a Short Rest, and everything on a Long Rest (SRD pp.185, 187)', () => {
    let e = halvard()
    e = spendResource(e, 'fighter:action-surge', 1, 1)
    e = spendResource(e, 'cleric:channel-divinity', 2, 1)
    const sheet = sheetOf(e)
    const short = finishShortRest(e, sheet)
    expect(short.resourcesUsed['fighter:action-surge']).toBeUndefined()
    expect(short.resourcesUsed['cleric:channel-divinity']).toBe(1)
    const long = finishLongRest(rules, { ...e, hp: { current: 3, temp: 4 }, exhaustion: 2, hitDiceSpent: { d8: 3 }, slotsExpended: { 1: 2 } }, sheet)
    expect(long).toMatchObject({ hp: { current: 54, temp: 0 }, exhaustion: 1, hitDiceSpent: {}, slotsExpended: {} })
    expect(long.resourcesUsed).toEqual({})
  })
})
