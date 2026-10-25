// The kit (play/kit.ts): toggles, the quick bar, Reactions, Attunement,
// weight and the catalogue, on the examples and a Barbarian made from the
// Fighter.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import sefa from '../rules/audit/A.json'
import cleric from '../save/examples/cleric-fighter.json'
import fighter from '../save/examples/fighter.json'
import wizard from '../save/examples/wizard.json'
import type { CharacterEntity } from '../save/types.ts'
import { attunement, barCandidates, barSlots, baseOptions, canReact, carryingLine, catalogueItem, findInCatalogue, reactions, setAttuned, setBarSlot, setCountsAs, setWorn, switchToggle, toggleChoices, toggles, weaponSets } from './kit.ts'
import { takeDamage } from './play.ts'
import { cast, characterSpells, endConcentration } from './spells.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity

// Maren as a Barbarian 1: Rage, two uses (SRD p.28).
function barbarian(): CharacterEntity {
  const e = entity(fighter)
  return { ...e, classes: [{ classId: 'barbarian', level: 1, hp: [{ level: 1, method: 'max' }] }], choices: [] }
}

const withItem = (e: CharacterEntity, ref: string, base?: string, patch: object = {}) => {
  const item = catalogueItem(rules, ref, base, `test-${e.inventory.length}`)!
  return { ...e, inventory: [...e.inventory, { ...item, ...patch }] }
}

describe('toggles', () => {
  it('lists Rage with its cost, and keeps its uses on the sheet while it is off', () => {
    const e = barbarian()
    const sheet = deriveSheet(rules, e)
    expect(sheet.resources.find((r) => r.key === 'barbarian:rage')).toMatchObject({ max: 2, used: 0 })
    expect(toggles(rules, e, sheet).find((t) => t.ref === 'rage')).toMatchObject({ name: 'Rage', on: false, cost: { key: 'barbarian:rage', amount: 1, left: 2 } })
  })

  it('spends a use of Rage when switched on, applies its effects, and refuses with none left', () => {
    let e = barbarian()
    const rage = () => toggles(rules, e, deriveSheet(rules, e)).find((t) => t.ref === 'rage')!
    const on = switchToggle(e, rage(), true)
    expect(on.ok).toBe(true)
    if (!on.ok) return
    e = on.entity
    expect(e.resourcesUsed['barbarian:rage']).toBe(1)
    expect(on.line).toBe('Rage on. Rage: 1 left.')
    // Rage's Resistance to Bludgeoning, Piercing and Slashing damage (SRD p.28).
    expect(deriveSheet(rules, e).defenses.some((d) => d.from.includes('Rage') && d.damageTypes.includes('slashing'))).toBe(true)
    const off = switchToggle(e, rage(), false)
    expect(off.ok && off.entity.toggles.rage).toBeUndefined()
    e = { ...e, toggles: {}, resourcesUsed: { 'barbarian:rage': 2 } }
    expect(switchToggle(e, rage(), true)).toMatchObject({ ok: false })
  })

  it('switches a spell’s effects on when cast, and off when its Concentration ends', () => {
    const halvard = entity(cleric)
    const sheet = deriveSheet(rules, halvard)
    const bless = characterSpells(rules, halvard, sheet).find((r) => r.spell.id === 'bless')!
    const cast1 = cast(halvard, bless, { kind: 'slot', level: 1 })
    expect(cast1.toggles.bless).toBe(true)
    // Bless's 1d4 on attack rolls and saves, a die noted (SRD p.115).
    expect(deriveSheet(rules, cast1).saves.wis.notes.some((n) => n.text === '+1d4' && n.from === 'Bless')).toBe(true)
    expect(endConcentration(cast1).toggles.bless).toBeUndefined()
    // Dropping to 0 HP ends it too.
    const down = takeDamage(rules, cast1, deriveSheet(rules, cast1), 500, null)
    expect(down.entity.toggles.bless).toBeUndefined()
  })

  // Spec §3.2, Quick bar: casting the spell switches its effects on. A spell
  // toggle's window casts it first (its slot, its Concentration), and keeps
  // the free switch only for a spell someone else cast.
  it('offers a spell’s toggle as a cast first, and its effects alone second', () => {
    const halvard = entity(cleric)
    const sheet = deriveSheet(rules, halvard)
    const bless = toggles(rules, halvard, sheet).find((t) => t.ref === 'bless')!
    expect(bless.spell?.spell.id).toBe('bless')
    expect(toggleChoices(bless)).toEqual([
      { action: 'cast', label: 'Cast Bless' },
      { action: 'effects-only', label: 'Effects only: cast by someone else' },
    ])
    const on = toggles(rules, cast(halvard, bless.spell!, { kind: 'slot', level: 1 }), sheet).find((t) => t.ref === 'bless')!
    expect(toggleChoices(on)).toEqual([{ action: 'switch-off', label: 'Switch off' }])
    // A feature's toggle has no cast: Rage switches on, spending its use.
    const e = barbarian()
    const rage = toggles(rules, e, deriveSheet(rules, e)).find((t) => t.ref === 'rage')!
    expect(rage.spell).toBeUndefined()
    expect(toggleChoices(rage)).toEqual([{ action: 'switch-on', label: 'Switch on' }])
  })
})

describe('the quick bar', () => {
  it('suggests the toggles, attacks and resources until a slot is changed', () => {
    const e = barbarian()
    const sheet = deriveSheet(rules, e)
    const { slots, suggested } = barSlots(rules, e, sheet)
    expect(suggested).toBe(true)
    expect(slots[0]).toMatchObject({ kind: 'toggle', ref: 'rage' })
    expect(slots.filter((s) => s?.kind === 'attack').map((s) => s!.name)).not.toContain('Unarmed Strike')
    // Rage's uses are on its toggle, not a second slot.
    expect(slots.some((s) => s?.kind === 'resource' && s.ref === 'barbarian:rage')).toBe(false)
    expect(slots).toHaveLength(8)
  })

  it('keeps the suggestions when the first slot is changed, and marks a slot whose item is gone', () => {
    const e = barbarian()
    const sheet = deriveSheet(rules, e)
    const shown = barSlots(rules, e, sheet).slots
    const next = setBarSlot(e, shown, 7, { kind: 'attack', ref: 'unarmed' })
    const after = barSlots(rules, next, deriveSheet(rules, next))
    expect(after.suggested).toBe(false)
    expect(after.slots[0]).toMatchObject({ kind: 'toggle', ref: 'rage' })
    expect(after.slots[7]).toMatchObject({ kind: 'attack', name: 'Unarmed Strike' })
    expect(next.quickBar).toHaveLength(8)
    const itemId = next.inventory[0].id
    const pinned = setBarSlot(next, after.slots, 6, { kind: 'item', ref: itemId })
    const gone = { ...pinned, inventory: pinned.inventory.filter((i) => i.id !== itemId) }
    expect(barSlots(rules, gone, deriveSheet(rules, gone)).slots[6]).toEqual({ kind: 'missing', ref: itemId, was: 'item' })
  })

  // The user, 2026-10-20: removing every item one by one brought them all
  // back when the last went, read as a bar never changed.
  it('stays empty once the player has emptied every slot', () => {
    let e = barbarian()
    for (let i = 0; i < 8; i++) {
      const shown = barSlots(rules, e, deriveSheet(rules, e)).slots
      e = setBarSlot(e, shown, i, null)
    }
    const after = barSlots(rules, e, deriveSheet(rules, e))
    expect(after.suggested).toBe(false)
    expect(after.slots.every((s) => s === null)).toBe(true)
    // A new character's bar, never changed, is still suggested.
    expect(barSlots(rules, barbarian(), deriveSheet(rules, barbarian())).suggested).toBe(true)
  })

  it('reads a bar saved with ten slots as its first eight, and saves eight', () => {
    const e = barbarian()
    const ten = { ...e, quickBar: [...Array(9).fill(null), { kind: 'attack', ref: 'unarmed' }] } as unknown as CharacterEntity
    const { slots, suggested } = barSlots(rules, ten, deriveSheet(rules, ten))
    expect(slots).toHaveLength(8)
    expect(suggested).toBe(true)
    const kept = { ...e, quickBar: [{ kind: 'attack', ref: 'unarmed' }, ...Array(9).fill(null)] } as unknown as CharacterEntity
    const read = barSlots(rules, kept, deriveSheet(rules, kept))
    expect(read.slots[0]).toMatchObject({ name: 'Unarmed Strike' })
    expect(setBarSlot(kept, read.slots, 1, null).quickBar).toHaveLength(8)
  })

  it('offers every group: a Wizard’s ready spells, its resources and its items', () => {
    const ilsabet = entity(wizard)
    const kinds = new Set(barCandidates(rules, ilsabet, deriveSheet(rules, ilsabet)).map((c) => c.kind))
    expect([...kinds]).toEqual(expect.arrayContaining(['toggle', 'attack', 'spell', 'resource', 'item']))
  })
})

describe('reactions', () => {
  it('gives an Opportunity Attack with the melee attacks, and the ready reaction spells', () => {
    const ilsabet = entity(wizard)
    const list = reactions(rules, ilsabet, deriveSheet(rules, ilsabet))
    expect(list[0]).toMatchObject({ kind: 'opportunity', name: 'Opportunity Attack' })
    const oa = list[0]
    expect(oa.kind === 'opportunity' && oa.attacks.every((a) => a.melee)).toBe(true)
    const ready = new Set(characterSpells(rules, ilsabet, deriveSheet(rules, ilsabet)).filter((r) => r.ready).map((r) => r.spell.id))
    for (const id of ['shield', 'counterspell']) expect(list.some((r) => r.kind === 'spell' && r.row.spell.id === id)).toBe(ready.has(id))
  })

  it('names a feature used as a Reaction', () => {
    const e = { ...barbarian(), classes: [{ classId: 'rogue', level: 5, hp: [1, 2, 3, 4, 5].map((level) => ({ level, method: 'fixed' as const })) }] }
    expect(reactions(rules, e, deriveSheet(rules, e)).some((r) => r.kind === 'feature' && r.name === 'Uncanny Dodge')).toBe(true)
  })

  it('takes none at 0 HP or Incapacitated', () => {
    const e = barbarian()
    expect(canReact(e)).toBe(true)
    expect(canReact({ ...e, hp: { ...e.hp, current: 0 } })).toBe(false)
    expect(canReact({ ...e, conditions: [{ id: 'c', conditionId: 'incapacitated' }] })).toBe(false)
  })
})

describe('a weapon the DM rules a Monk weapon', () => {
  it('offers Martial Arts’ Monk weapons for Sefa’s Longsword, not for her Spear, and nothing to a Fighter', () => {
    const e = withItem(entity(sefa), 'equipment:longsword')
    expect(weaponSets(rules, e, e.inventory.at(-1)!)).toEqual([{ id: 'monk-weapons', name: 'Monk weapon', from: 'Monk 1: Martial Arts' }])
    expect(weaponSets(rules, e, e.inventory.find((i) => i.name === 'Spear')!)).toEqual([])
    const f = withItem(entity(fighter), 'equipment:longsword')
    expect(weaponSets(rules, f, f.inventory.at(-1)!)).toEqual([])
  })

  it('saves the ruling on the item, and takes it off again', () => {
    let e = withItem(entity(sefa), 'equipment:longsword')
    const id = e.inventory.at(-1)!.id
    const spear = (x: CharacterEntity) => deriveSheet(rules, x).attacks.find((a) => a.name === 'Spear')!.damage.dice
    expect(spear(e)).toBe('1d6')
    e = setCountsAs(e, id, 'monk-weapons', true)
    expect(e.inventory.at(-1)!.countsAs).toEqual(['monk-weapons'])
    expect(spear(e)).toBe('1d8')
    e = setCountsAs(e, id, 'monk-weapons', false)
    expect('countsAs' in e.inventory.at(-1)!).toBe(false)
    expect(spear(e)).toBe('1d6')
  })
})

describe('items: worn, attuned and weighed', () => {
  it('applies a Ring of Protection only while worn and attuned (SRD p.238)', () => {
    let e = withItem(entity(cleric), 'magic-items:ring-of-protection')
    const ac = deriveSheet(rules, e).ac.total
    const ring = e.inventory.at(-1)!.id
    e = setWorn(e, ring, true)
    expect(deriveSheet(rules, e).ac.total).toBe(ac)
    const r = setAttuned(rules, e, ring, true)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(deriveSheet(rules, r.entity).ac.total).toBe(ac + 1)
    expect(deriveSheet(rules, r.entity).saves.con.parts).toContainEqual({ label: 'Ring of Protection', value: 1 })
  })

  it('refuses a fourth attunement, naming the three, and a second copy', () => {
    let e = entity(fighter)
    for (const ref of ['magic-items:ring-of-protection', 'magic-items:cloak-of-protection', 'magic-items:amulet-of-health', 'magic-items:periapt-of-wound-closure']) e = withItem(e, ref)
    for (const item of e.inventory.slice(-4, -1)) {
      const r = setAttuned(rules, e, item.id, true)
      if (r.ok) e = r.entity
    }
    expect(attunement(rules, e).items).toHaveLength(3)
    const fourth = setAttuned(rules, e, e.inventory.at(-1)!.id, true)
    expect(fourth).toEqual({ ok: false, error: 'You’re attuned to 3 items already: Ring of Protection, Cloak of Protection and Amulet of Health. End one first.'.replace('’', "'") })
    const two = withItem(entity(fighter), 'magic-items:ring-of-protection')
    const both = withItem(two, 'magic-items:ring-of-protection')
    const first = setAttuned(rules, both, both.inventory.at(-2)!.id, true)
    expect(first.ok && setAttuned(rules, first.entity, both.inventory.at(-1)!.id, true)).toMatchObject({ ok: false })
  })

  it('makes a magic weapon its base’s attack, with its own bonus on that attack only', () => {
    const options = baseOptions(rules, 'magic-items:weapon-plus-1')!
    expect(options.printed).toBe('Any Simple or Martial')
    expect(options.ids).toContain('longsword')
    const e = withItem(entity(fighter), 'magic-items:weapon-plus-1', 'longsword')
    const sword = e.inventory.at(-1)!
    expect(sword).toMatchObject({ name: 'Weapon, +1 (Longsword)', baseItemId: 'equipment:longsword', weight: 3 })
    const sheet = deriveSheet(rules, e)
    const attack = sheet.attacks.find((a) => a.id === sword.id)!
    const plain = sheet.attacks.find((a) => a.name === 'Greatsword')!
    expect(attack.toHit.parts).toContainEqual({ label: 'Weapon, +1 (Longsword)', value: 1 })
    expect(plain.toHit.parts.some((p) => p.label.startsWith('Weapon, +1'))).toBe(false)
    expect(attack.damage.dice).toBe('1d8')
  })

  it('takes a base the record names, or the list it names', () => {
    expect(baseOptions(rules, 'magic-items:sun-blade')?.ids).toEqual(['longsword'])
    expect(baseOptions(rules, 'magic-items:berserker-axe')?.ids).toEqual(['battleaxe', 'greataxe', 'halberd'])
    expect(baseOptions(rules, 'magic-items:shield-plus-1')?.ids).toEqual(['shield'])
    expect(baseOptions(rules, 'magic-items:staff-of-striking')?.ids).toEqual(['quarterstaff'])
    expect(baseOptions(rules, 'magic-items:ammunition-plus-1')).toBeNull()
    expect(baseOptions(rules, 'magic-items:ring-of-protection')).toBeNull()
  })

  it('makes +1 armor its base’s Armor Class plus one, while worn', () => {
    // Without Maren's Defense fighting style.
    const e = { ...entity(fighter), inventory: [], choices: [] }
    const worn = withItem(e, 'magic-items:armor-plus-1', 'chain-mail', { worn: true })
    // Chain Mail 16, +1 (SRD p.92, p.210).
    expect(deriveSheet(rules, worn).ac).toMatchObject({ total: 17, formula: 'Armor, +1 (Chain Mail)' })
  })

  it('weighs the coins, fifty to the pound (SRD p.89)', () => {
    const e = { ...entity(fighter), inventory: [], coins: { cp: 0, sp: 0, ep: 0, gp: 100, pp: 0 } }
    const sheet = deriveSheet(rules, e)
    expect(sheet.carrying).toMatchObject({ carried: 2, coins: 2 })
    expect(carryingLine(sheet)).toBe(`Carrying 2 of ${sheet.carrying.capacity} lb, coins 2 lb`)
  })
})

describe('the catalogue', () => {
  it('finds by name within a kind', () => {
    expect(findInCatalogue(rules, 'longs', 'weapon').map((c) => c.name)).toEqual(['Longsword'])
    expect(findInCatalogue(rules, 'ring of prot', null)).toMatchObject([{ kind: 'magic', detail: 'Rare ring · attunement' }])
  })

  it('makes an item from gear with its weight and text', () => {
    const rope = catalogueItem(rules, 'equipment:rope', undefined, 'x')!
    expect(rope).toMatchObject({ name: 'Rope', itemId: 'equipment:rope', tags: ['gear'], quantity: 1 })
    expect(rope.weight).toBeGreaterThan(0)
  })

  it('keeps a magic item’s text as plain paragraphs, its markdown dropped', () => {
    const periapt = catalogueItem(rules, 'magic-items:periapt-of-wound-closure', undefined, 'x')!
    expect(periapt.description).toContain('Life Preservation.')
    expect(periapt.description).not.toContain('**')
  })
})
