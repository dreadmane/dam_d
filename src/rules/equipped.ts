// Whether an item is worn or held for what it does (spec §3.3, Inventory).
// A weapon is equipped or not (the PHB's Attack action: "equip or unequip
// one weapon"), and only an equipped one is an attack. A weapon saved before
// weapons could be unequipped has no mark, and stays equipped, so no saved
// character loses an attack. Anything else counts only once put on.

import type { Rules } from './load.ts'
import type { Item } from '../save/types.ts'

// The catalogue record an item is, or is made from (a magic weapon's base).
export const equipmentId = (item: Item) => {
  const ref = item.baseItemId ?? item.itemId
  return ref?.startsWith('equipment:') ? ref.slice('equipment:'.length) : undefined
}

export const isWeapon = (rules: Rules, item: Item) => rules.weapons.has(equipmentId(item) ?? '')

export const equipped = (rules: Rules, item: Item) => (isWeapon(rules, item) ? item.worn !== false : Boolean(item.worn))

// Whether a weapon may be bonded to an attackOption that the player bonds
// (Pact of the Blade, SRD p.74): its bond lists melee, any melee weapon,
// and magic, a magic weapon of any kind.
export function bondable(rules: Rules, bond: readonly string[], item: Item): boolean {
  const weapon = rules.weapons.get(equipmentId(item) ?? '')
  if (!weapon) return false
  return (bond.includes('melee') && weapon.kind === 'melee') || (bond.includes('magic') && Boolean(item.itemId?.startsWith('magic-items:')))
}
