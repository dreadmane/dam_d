// Equipping a weapon (equipped.ts): only an equipped weapon is an attack,
// on Maren, the example Fighter, with her Greatsword and Chain Mail.

import { describe, expect, it } from 'vitest'
import { setWorn } from '../play/kit.ts'
import fighter from '../save/examples/fighter.json'
import type { CharacterEntity } from '../save/types.ts'
import { deriveSheet } from './derive.ts'
import { equipped } from './equipped.ts'
import { testRules } from './test-rules.ts'

const rules = testRules()
const maren = structuredClone(fighter.entities[0]) as unknown as CharacterEntity
const attacks = (e: CharacterEntity) => deriveSheet(rules, e).attacks.map((a) => a.id)
const weapon = maren.inventory.find((i) => i.itemId === 'equipment:greatsword')!
const armor = maren.inventory.find((i) => i.itemId === 'equipment:chain-mail')!

describe('equipping a weapon', () => {
  it('counts a weapon saved with no mark as equipped, so no saved character loses an attack', () => {
    expect(weapon.worn).toBeUndefined()
    expect(equipped(rules, weapon)).toBe(true)
    expect(attacks(maren)).toContain(weapon.id)
  })

  it('makes an unequipped weapon no attack, and equipping it again brings it back', () => {
    const off = setWorn(maren, weapon.id, false)
    expect(equipped(rules, off.inventory.find((i) => i.id === weapon.id)!)).toBe(false)
    expect(attacks(off)).not.toContain(weapon.id)
    expect(attacks(setWorn(off, weapon.id, true))).toContain(weapon.id)
  })

  it('leaves armor as it was: worn only once put on', () => {
    expect(equipped(rules, { ...armor, worn: undefined })).toBe(false)
    expect(equipped(rules, { ...armor, worn: true })).toBe(true)
  })
})
