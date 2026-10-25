// The damage formula (cards.ts): the dice, then each part of the modifier,
// so a bonus such as Rage shows where it comes in, and in the roll log by
// name. On Unga-Bunga, with Rage on and off.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import barbarian from '../save/examples/barbarian.json'
import type { CharacterEntity } from '../save/types.ts'
import { damageFormula } from './cards.ts'

const rules = testRules()
const unga = (raging: boolean) => {
  const e = structuredClone(barbarian.entities[0] as unknown) as CharacterEntity
  e.toggles = raging ? { rage: true } : {}
  return deriveSheet(rules, e)
}
const attack = (raging: boolean, name: string) => unga(raging).attacks.find((a) => a.name === name)!

describe('the damage formula', () => {
  it('is the dice and the ability modifier when nothing else adds', () => expect(damageFormula(attack(false, 'Greatclub'))).toBe('1d8 + 4'))

  it('shows each bonus on its own: Rage’s +2 after the Strength modifier', () => expect(damageFormula(attack(true, 'Greatclub'))).toBe('1d8 + 4 + 2'))

  it('names each part for the roll log', () => expect(damageFormula(attack(true, 'Greatclub'), { named: true })).toBe('1d8 + 4 STR + 2 Rage'))

  it('takes a Critical Hit’s doubled dice', () => expect(damageFormula(attack(true, 'Greatclub'), { named: true, dice: '2d8' })).toBe('2d8 + 4 STR + 2 Rage'))

  it('starts an attack with no dice at its first part: the Unarmed Strike', () => {
    expect(damageFormula(attack(false, 'Unarmed Strike'))).toBe('5')
    expect(damageFormula(attack(true, 'Unarmed Strike'))).toBe('5 + 2')
  })
})
