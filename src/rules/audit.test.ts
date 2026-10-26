// The rules audit's eight SRD characters (2026-10-24), each a fixture in
// ./audit/ whose sheet was worked by hand from the SRD 5.2.1 by an agent that
// never read the engine. Each finding the audit made gets its checks here
// when it is fixed, with the hand-worked number and its page.

import { describe, expect, it } from 'vitest'
import { deriveSheet } from './derive.ts'
import { casterFor, characterSpells, preparedCount } from '../play/spells.ts'
import { catalogueItem } from '../play/kit.ts'
import { featureRule } from '../components/cards.ts'
import { testRules } from './test-rules.ts'
import type { CharacterEntity } from '../save/types.ts'
import halvard from '../save/examples/cleric-fighter.json'
import A from './audit/A.json'
import B from './audit/B.json'
import C from './audit/C.json'
import D from './audit/D.json'
import E from './audit/E.json'
import F from './audit/F.json'
import G from './audit/G.json'
import H from './audit/H.json'

const rules = testRules()
const sheetOf = (record: { entities: unknown[] }) => deriveSheet(rules, structuredClone(record.entities[0]) as CharacterEntity)

describe('every audit character', () => {
  it.each([
    ['A', A],
    ['B', B],
    ['C', C],
    ['D', D],
    ['E', E],
    ['F', F],
    ['G', G],
    ['H', H],
  ])('%s owes no choice', (_, record) => expect(sheetOf(record).unmade.map((c) => `${c.source} ${c.choice}`)).toEqual([]))
})

describe('Extra Attack (finding 1)', () => {
  it('gives two attacks to a Monk 6 (p.51), a Paladin 8 (p.55) and a Ranger 20 (p.59)', () => {
    expect(sheetOf(A).attackCount).toBe(2)
    expect(sheetOf(E).attackCount).toBe(2)
    expect(sheetOf(H).attackCount).toBe(2)
  })

  it('gives three to a Fighter 11, Two Extra Attacks (p.48)', () => expect(sheetOf(D).attackCount).toBe(3))

  it('gives one to classes without it: Rogue 7, Sorcerer 3 / Warlock 3, Druid 5, Bard 6', () => {
    for (const record of [B, C, F, G]) expect(sheetOf(record).attackCount).toBe(1)
  })
})

describe('Martial weapons a Rogue or Monk is trained in (finding 3)', () => {
  // A copy with the named weapons added from the catalogue, each equipped.
  const holding = (record: { entities: unknown[] }, ids: string[]) => {
    const e = structuredClone(record.entities[0]) as CharacterEntity
    e.inventory.push(...ids.map((id) => ({ id: `test-${id}`, name: rules.weapons.get(id)!.name, description: '', quantity: 1, tags: ['weapon'], itemId: `equipment:${id}` })))
    return deriveSheet(rules, e)
  }
  const proficient = (sheet: ReturnType<typeof deriveSheet>, name: string) => sheet.attacks.find((a) => a.name === name)?.proficient

  it('gives a Rogue the Martial weapons with Finesse or Light (p.61): Pip’s Shortsword is +7', () => {
    const pip = sheetOf(B)
    expect(pip.attacks.find((a) => a.name === 'Shortsword')?.toHit.total).toBe(7)
    const armed = holding(B, ['rapier', 'whip', 'scimitar', 'hand-crossbow', 'longsword'])
    expect(['Rapier', 'Whip', 'Scimitar', 'Hand Crossbow'].map((n) => proficient(armed, n))).toEqual([true, true, true, true])
    expect(proficient(armed, 'Longsword')).toBe(false)
  })

  it('gives a Monk the Martial weapons with Light (p.49), not Finesse alone', () => {
    const armed = holding(A, ['shortsword', 'scimitar', 'hand-crossbow', 'rapier', 'whip'])
    expect(['Shortsword', 'Scimitar', 'Hand Crossbow'].map((n) => proficient(armed, n))).toEqual([true, true, true])
    expect(['Rapier', 'Whip'].map((n) => proficient(armed, n))).toEqual([false, false])
  })

  it('leaves a Bard, trained in Simple weapons only (p.31), without the Rapier', () => {
    expect(proficient(sheetOf(G), 'Rapier')).toBe(false)
  })
})

describe('Martial Arts (finding 4)', () => {
  // A copy of the character, changed, then worked.
  const changed = (record: { entities: unknown[] }, change: (e: CharacterEntity) => void) => {
    const e = structuredClone(record.entities[0]) as CharacterEntity
    change(e)
    return deriveSheet(rules, e)
  }
  const add = (e: CharacterEntity, id: string, worn?: boolean) =>
    e.inventory.push({ id: `test-${id}`, name: (rules.weapons.get(id) ?? rules.armor.get(id))!.name, description: '', quantity: 1, tags: [], itemId: `equipment:${id}`, ...(worn === undefined ? {} : { worn }) })
  // An attack row as the sheet shows it: its ability, to-hit, die and modifier.
  const row = (sheet: ReturnType<typeof deriveSheet>, name: string) => {
    const a = sheet.attacks.find((x) => x.name === name)!
    return [a.ability, a.toHit.total, a.damage.dice, a.damage.modifier]
  }

  it('gives Sefa, a Monk 6, Dexterity and the Martial Arts die, 1d8 (p.50): her Unarmed Strike, Spear and Dagger are each +6 for 1d8 + 3', () => {
    const sefa = sheetOf(A)
    expect(['Unarmed Strike', 'Spear', 'Dagger'].map((n) => row(sefa, n))).toEqual([
      ['dex', 6, '1d8', 3],
      ['dex', 6, '1d8', 3],
      ['dex', 6, '1d8', 3],
    ])
  })

  it('keeps a weapon’s own die where it is bigger: at Monk 1 the die is 1d6, and a Greatclub stays 1d8', () => {
    // Dex 15 (+2) before her level 4 increase; PB 2.
    const first = changed(A, (e) => {
      e.classes[0] = { ...e.classes[0], level: 1, hp: e.classes[0].hp.slice(0, 1) }
      add(e, 'greatclub')
    })
    expect(['Unarmed Strike', 'Spear', 'Greatclub'].map((n) => row(first, n))).toEqual([
      ['dex', 4, '1d6', 2],
      ['dex', 4, '1d6', 2],
      ['dex', 4, '1d8', 2],
    ])
  })

  it('lapses in armor, with a Shield, or wielding a weapon that isn’t a Monk weapon, and says why', () => {
    for (const change of [(e: CharacterEntity) => add(e, 'leather-armor', true), (e: CharacterEntity) => add(e, 'shield', true), (e: CharacterEntity) => add(e, 'longsword')]) {
      const sheet = changed(A, change)
      expect(row(sheet, 'Unarmed Strike')).toEqual(['str', 3, '', 1])
      expect(row(sheet, 'Spear')).toEqual(['str', 3, '1d6', 0])
      expect(sheet.attacks.find((a) => a.name === 'Spear')!.damage.notes.map((n) => n.from)).toContain('Monk 1: Martial Arts')
    }
  })

  it('says what turns it off, by name: a weapon that isn’t a Monk weapon, the armor, the Shield (#10)', () => {
    const note = (change: (e: CharacterEntity) => void) =>
      changed(A, change)
        .attacks.find((a) => a.name === 'Spear')!
        .damage.notes.find((n) => n.from === 'Monk 1: Martial Arts')?.text
    const said = '1d8 in place of 1d6, DEX in place of STR, not while you '
    expect(note((e) => add(e, 'longsword'))).toBe(`${said}wield the Longsword, which isn’t a Monk weapon`)
    expect(note((e) => (add(e, 'longsword'), add(e, 'greatsword')))).toBe(`${said}wield the Longsword and the Greatsword, which aren’t Monk weapons`)
    expect(note((e) => add(e, 'leather-armor', true))).toBe(`${said}wear the Leather Armor`)
    expect(note((e) => add(e, 'shield', true))).toBe(`${said}wield the Shield`)
    expect(note((e) => (add(e, 'shield', true), add(e, 'longsword')))).toBe(`${said}wield the Shield or wield the Longsword, which isn’t a Monk weapon`)
  })

  it('names a magic weapon by its own name: Frye’s Sun Blade', () => {
    const blade = catalogueItem(rules, 'magic-items:sun-blade', 'longsword', 'blade-1')!
    const sheet = changed(A, (e) => e.inventory.push({ ...blade, name: 'Sun Blade', attuned: true }))
    expect(sheet.attacks.find((a) => a.name === 'Spear')!.damage.notes.find((n) => n.from === 'Monk 1: Martial Arts')?.text).toBe('1d8 in place of 1d6, DEX in place of STR, not while you wield the Sun Blade, which isn’t a Monk weapon')
  })

  it('comes back once the Longsword is put away', () => {
    expect(row(changed(A, (e) => add(e, 'longsword', false)), 'Spear')).toEqual(['dex', 6, '1d8', 3])
  })

  it('counts a weapon the DM rules a Monk weapon (the item’s countsAs): the Longsword gets Martial Arts and leaves it on for the rest', () => {
    const ruled = changed(A, (e) => {
      add(e, 'longsword')
      e.inventory.at(-1)!.countsAs = ['monk-weapons']
    })
    // Not proficient with a Longsword (a Monk's Martial weapons need Light),
    // so Dex 3 alone; its own 1d8 is no smaller than the Monk 6 die.
    expect(row(ruled, 'Longsword')).toEqual(['dex', 3, '1d8', 3])
    expect(row(ruled, 'Spear')).toEqual(['dex', 6, '1d8', 3])
    expect(ruled.attacks.find((a) => a.name === 'Longsword')!.options.map((o) => o.from)).toEqual(['Monk 1: Martial Arts; a Monk weapon by your DM’s ruling'])
  })

  it('names the Monk weapons the Weapons table gives: every Simple Melee weapon, and the Martial Melee ones with Light (p.49, p.91)', () => {
    const option = rules.classes.get('monk')!.features.find((f) => f.id === 'martial-arts')!.effects.find((e) => e.type === 'attackOption')!
    const table = [...rules.weapons.values()].filter((w) => w.kind === 'melee' && (w.category === 'simple' || w.properties.some((p) => p.id === 'light'))).map((w) => w.id)
    expect([...option.attacks].sort()).toEqual(['unarmed', ...table].sort())
  })

  it('leaves everyone else’s Unarmed Strike at 1 + Strength (p.190)', () => {
    for (const record of [B, C, D, E, F, G, H]) {
      const unarmed = sheetOf(record).attacks.find((a) => a.id === 'unarmed')!
      expect([unarmed.ability, unarmed.damage.dice]).toEqual(['str', ''])
    }
  })
})

describe('Improved Critical (finding 6)', () => {
  it('crits a Champion 11 on 19 or 20 (p.49)', () => expect(sheetOf(D).critMin).toBe(19))

  it('leaves everyone else on a 20', () => {
    for (const record of [A, B, C, E, F, G, H]) expect(sheetOf(record).critMin).toBe(20)
  })
})

describe('a spell from a feat or a species casts with its own ability (finding 2)', () => {
  // Each spell row's save DC and attack, as the sheet shows them.
  const numbers = (record: { entities: unknown[] }, spellId: string, change?: (e: CharacterEntity) => void) => {
    const e = structuredClone(record.entities[0]) as CharacterEntity
    change?.(e)
    const sheet = deriveSheet(rules, e)
    const row = characterSpells(rules, e, sheet).find((r) => r.spell.id === spellId)!
    const caster = casterFor(sheet, row)
    return { dc: caster?.saveDc.total, attack: caster?.attack.total }
  }

  it('gives Magic Initiate (Wizard) on Int its own DC 12 and +4, beside the Druid’s 15 and +7 (p.87)', () => {
    expect(numbers(F, 'fire-bolt')).toEqual({ dc: 12, attack: 4 })
    expect(numbers(F, 'produce-flame')).toEqual({ dc: 15, attack: 7 })
  })

  it('gives a Monk, who has no class spellcasting, Magic Initiate (Cleric) on Wis: DC 14, +6', () => {
    expect(numbers(A, 'sacred-flame')).toEqual({ dc: 14, attack: 6 })
  })

  it('casts a Tiefling’s legacy spell with the legacy’s ability: Int 10 gives Fire Bolt +3 (p.86)', () => {
    expect(numbers(C, 'fire-bolt')).toEqual({ dc: 14, attack: 6 })
    const onInt = numbers(C, 'fire-bolt', (e) => {
      e.choices = e.choices.map((c) => (c.choice === 'fiendish-legacy-spellcasting-ability' ? { ...c, values: ['int'] } : c))
    })
    expect(onInt).toEqual({ dc: 11, attack: 3 })
  })

  it('keeps a class feature’s spell on its class: Magical Discoveries’ Guiding Bolt is a Bard spell, +7 (p.35)', () => {
    expect(numbers(G, 'guiding-bolt')).toEqual({ dc: 15, attack: 7 })
  })

  it('gives a class feature’s granted spell to its class: Paladin’s Smite’s Divine Smite is a Paladin spell (p.54)', () => {
    const e = structuredClone(E.entities[0] as unknown) as CharacterEntity
    const row = characterSpells(rules, e, deriveSheet(rules, e)).find((r) => r.spell.id === 'divine-smite')
    expect(row?.classId).toBe('paladin')
  })
})

// A copy of a fixture, changed, then worked.
const changed = (record: { entities: unknown[] }, change: (e: CharacterEntity) => void) => {
  const e = structuredClone(record.entities[0]) as CharacterEntity
  change(e)
  return deriveSheet(rules, e)
}
const atLevel = (level: number) => (e: CharacterEntity) => {
  e.classes[0] = { ...e.classes[0], level, hp: e.classes[0].hp.slice(0, level) }
}

describe('the Wood Elf’s Speed (finding 5)', () => {
  it('walks Sefa, a Wood Elf Monk 6, at 35 ft plus Unarmored Movement’s 15: 50 ft (pp.84, 50)', () => {
    const walk = sheetOf(A).speed.walk
    expect(walk.total).toBe(50)
    expect(walk.parts[0]).toEqual({ label: 'Elf: Wood Elf', value: 35 })
  })

  it('leaves an Elf of another lineage at the Elf’s 30: a Drow Sefa walks 45', () => {
    const drow = changed(A, (e) => {
      e.choices = e.choices.map((c) => (c.choice === 'elven-lineage' ? { ...c, values: ['drow'] } : c))
    })
    expect(drow.speed.walk.total).toBe(45)
  })
})

describe('Jack of All Trades (finding 7)', () => {
  // Fizzwick, a Bard 6: Proficiency Bonus 3, so half is 1 (p.32).
  const fizz = sheetOf(G)
  const totals = (ids: string[]) => ids.map((id) => fizz.skills.find((s) => s.id === id)!.total)

  it('adds half the Proficiency Bonus, +1, to each skill the Bard lacks (p.32)', () => {
    expect(totals(['acrobatics', 'animal-handling', 'athletics', 'intimidation', 'investigation', 'medicine', 'nature'])).toEqual([3, 2, 0, 5, 1, 2, 1])
    expect(fizz.skills.find((s) => s.id === 'athletics')!.parts).toContainEqual({ label: 'Bard 2: Jack of All Trades', value: 1 })
  })

  it('leaves a skill she is proficient in, or has Expertise in, at its own total', () => {
    expect(totals(['arcana', 'history', 'insight', 'perception', 'performance', 'deception'])).toEqual([3, 3, 4, 4, 7, 10])
    expect(fizz.passivePerception.total).toBe(14)
  })

  it('leaves Initiative, a Dexterity check with no skill, at +2', () => {
    expect(fizz.initiative.total).toBe(2)
  })
})

describe('free casts from species, features and items (finding 9)', () => {
  const free = (sheet: ReturnType<typeof deriveSheet>) => sheet.resources.filter((r) => r.key.includes('free-cast:')).map(({ key, name, max, recharge }) => ({ key, name, max, recharge }))

  it('counts a Wood Elf 6’s Longstrider and Pass without Trace, once each a Long Rest (p.84)', () => {
    expect(free(sheetOf(A))).toEqual([
      { key: 'free-cast:longstrider', name: 'Longstrider (Wood Elf)', max: 1, recharge: 'long-rest' },
      { key: 'free-cast:pass-without-trace', name: 'Pass without Trace (Wood Elf)', max: 1, recharge: 'long-rest' },
    ])
  })

  it('counts an Infernal Tiefling 6’s Hellish Rebuke and Darkness (p.86)', () => {
    expect(free(sheetOf(C)).map((r) => r.name)).toEqual(['Hellish Rebuke (Infernal)', 'Darkness (Infernal)'])
  })

  it('counts a Paladin 8’s Divine Smite (Paladin’s Smite, p.54) and Find Steed (Faithful Steed, p.55)', () => {
    expect(free(sheetOf(E))).toEqual([
      { key: 'paladin:free-cast:divine-smite', name: 'Divine Smite (Paladin’s Smite)', max: 1, recharge: 'long-rest' },
      { key: 'paladin:free-cast:find-steed', name: 'Find Steed (Faithful Steed)', max: 1, recharge: 'long-rest' },
    ])
  })

  it('gives a lineage’s spell its free cast at the character level it comes at: none at 2, Longstrider at 3', () => {
    expect(free(changed(A, atLevel(2)))).toEqual([])
    expect(free(changed(A, atLevel(3))).map((r) => r.key)).toEqual(['free-cast:longstrider'])
  })

  it('keeps what was spent', () => {
    const spent = changed(A, (e) => {
      e.resourcesUsed = { ...e.resourcesUsed, 'free-cast:longstrider': 1 }
    })
    expect(spent.resources.find((r) => r.key === 'free-cast:longstrider')?.used).toBe(1)
  })

  it('counts an item’s while it is worn and attuned, under the item’s own key: the Helm of Telepathy’s Detect Thoughts and Suggestion, each a dawn (p.226)', () => {
    const helm = catalogueItem(rules, 'magic-items:helm-of-telepathy', undefined, 'helm-1')!
    const wearing = (worn: boolean) => changed(A, (e) => e.inventory.push({ ...helm, worn, attuned: true }))
    expect(free(wearing(true)).slice(2)).toEqual([
      { key: 'helm-1:free-cast:detect-thoughts', name: 'Detect Thoughts (Helm of Telepathy)', max: 1, recharge: 'dawn' },
      { key: 'helm-1:free-cast:suggestion', name: 'Suggestion (Helm of Telepathy)', max: 1, recharge: 'dawn' },
    ])
    expect(free(wearing(false)).length).toBe(2)
  })
})

describe('a class’s extra cantrip from Magician or Thaumaturge (finding 10)', () => {
  const cantrips = (record: { entities: unknown[] }, classId: string, change?: (e: CharacterEntity) => void) => {
    const e = structuredClone(record.entities[0]) as CharacterEntity
    change?.(e)
    const sheet = deriveSheet(rules, e)
    const caster = sheet.spellcasting.find((c) => c.classId === classId)!
    return { of: caster.cantrips, chosen: preparedCount(characterSpells(rules, e, sheet), caster).cantrips }
  }

  it('gives a Magician Druid 5 four cantrips, the table’s three and Magician’s, and counts all four (pp.41–42)', () => {
    expect(cantrips(F, 'druid')).toEqual({ of: 4, chosen: 4 })
  })

  it('gives a Thaumaturge Cleric 5 five, the table’s four and one more (p.37), and a Protector the table’s four', () => {
    expect(cantrips(halvard, 'cleric')).toEqual({ of: 4, chosen: 4 })
    const thaumaturge = (e: CharacterEntity) => {
      e.choices = e.choices.map((c) => (c.choice === 'divine-order' ? { ...c, values: ['thaumaturge'] } : c))
      e.choices.push({ source: 'class:cleric:1>option:thaumaturge', choice: 'thaumaturge-cantrip', values: ['spare-the-dying'] })
    }
    expect(cantrips(halvard, 'cleric', thaumaturge)).toEqual({ of: 5, chosen: 5 })
  })
})

describe('Open Hand Technique’s save DC (#54, ruled in #9)', () => {
  const sefa = sheetOf(A)
  const card = (id: string) => featureRule({ feature: sefa.features.find((g) => g.feature.id === id)!.feature }, sefa)

  it('works Monk’s Focus and Open Hand Technique at DC 14 for a Monk 6 with Wisdom 16: 8 + 3 + 3 (p.50)', () => {
    expect(sefa.featureDcs.map((d) => [d.id, d.dc.total])).toEqual([
      ['monks-focus', 14],
      ['open-hand-technique', 14],
    ])
  })

  it('says the DC on both cards, and on Open Hand Technique’s that it is a house ruling (p.52)', () => {
    expect(card('monks-focus').text).toContain('Save DC 14: 8 + WIS modifier + Proficiency Bonus')
    expect(card('monks-focus').notes).not.toContainEqual(expect.stringContaining('house ruling'))
    expect(card('open-hand-technique').text).toContain('Save DC 14: 8 + WIS modifier + Proficiency Bonus')
    expect(card('open-hand-technique').notes).toContainEqual(expect.stringContaining('house ruling'))
  })

  it('gives a Fighter 11 no feature DC', () => expect(sheetOf(D).featureDcs).toEqual([]))
})

describe('Circle of the Land’s spells (#53, ruled in #9)', () => {
  const dunna = (land?: string) => {
    const record: { entities: unknown[] } = F
    const e = structuredClone(record.entities[0]) as CharacterEntity
    e.choices = e.choices.flatMap((c) => (c.choice !== 'land-type' ? [c] : land ? [{ ...c, values: [land] }] : []))
    const sheet = deriveSheet(rules, e)
    const rows = characterSpells(rules, e, sheet)
    const circle = rows.filter((r) => r.from === 'Circle of the Land').map((r) => r.spell.id)
    return { circle, rows, counted: preparedCount(rows, sheet.spellcasting.find((c) => c.classId === 'druid')!) }
  }

  it('gives a Temperate Druid 5 Shocking Grasp, Misty Step and Sleep (Druid 3) and Lightning Bolt (Druid 5), always prepared (p.46)', () => {
    const { circle, rows } = dunna('temperate')
    expect(circle.toSorted()).toEqual(['lightning-bolt', 'misty-step', 'shocking-grasp', 'sleep'])
    expect(rows.filter((r) => circle.includes(r.spell.id)).every((r) => r.always && r.ready && r.classId === 'druid')).toBe(true)
  })

  it('counts none of them against Prepared Spells or Cantrips: the counts are the same with no land', () => {
    expect(dunna('temperate').counted).toEqual(dunna().counted)
    expect(dunna().circle).toEqual([])
  })

  it('changes them when the land does: Arid’s Fire Bolt, Blur, Burning Hands and Fireball', () => {
    expect(dunna('arid').circle.toSorted()).toEqual(['blur', 'burning-hands', 'fire-bolt', 'fireball'])
  })

  it('names only spells the rules hold, in every subclass’s table', () => {
    const missing = [...rules.subclasses.values()].flatMap((s) => (s.spells ?? []).flatMap((g) => g.spells.filter((id) => !rules.spells.get(id)).map((id) => `${s.id}: ${id}`)))
    expect(missing).toEqual([])
  })
})
