// Spells (the spec §3.2, Cast a spell; §3.3, Spells): what a character can
// cast, gathered from every place a spell comes from, the slots and Pact
// Magic, casting, and Concentration. Pure, so each rule is tested without
// React. The spells' own data (spells.json) says what each does; the
// numbers the rules print are read from core.json's playRules.

import type { Sheet, Spellcaster, Total } from '../rules/derive.ts'
import { spendResource } from './play.ts'
import type { Ability } from '../rules/expr.ts'
import type { Rules, Spell } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'

export interface SpellRow {
  spell: Spell
  // Where it comes from, as the player knows it: "Cleric", "Life Domain",
  // "High Elf", "Magic Initiate".
  from: string
  // The class whose spellcasting it uses, if any.
  classId?: string
  // Otherwise the spellcasting ability its feat or trait gives it (Magic
  // Initiate's, a lineage's), for its save DC and attack.
  ability?: Ability
  // Ready to cast: prepared, always prepared, or a cantrip.
  ready: boolean
  // Always prepared by a feature: it never counts against the class's
  // number (SRD p.104, Always-Prepared Spells).
  always: boolean
  // A cantrip a class feature adds to the class's number (Magician's,
  // Thaumaturge's, SRD pp.42, 37): chosen in Levels, and counted in it.
  extraCantrip?: boolean
  // A class spell the player can prepare or unprepare.
  preparable: boolean
  // The save DC and attack bonus the granting item prints for it, in place
  // of the caster's ("cast Web (save DC 13)", Cloak of Arachnida, SRD p.215).
  printed?: { dc?: number; attack?: number }
}

const ref = (r: string) => r.replace(/^spells:/, '')

// Every spell the character has: the class's prepared and known (and, for a
// Wizard, the spellbook), the subclass's always-prepared by class level, the
// spells traits and feats grant (a lineage's, Magic Initiate's), each once.
export function characterSpells(rules: Rules, entity: CharacterEntity, sheet: Sheet): SpellRow[] {
  const rows = new Map<string, SpellRow>()
  // A spell from two places is one row: ready or always if either says so,
  // keeping a class's spellcasting (for its rituals) where one has it.
  const add = (row: SpellRow) => {
    const held = rows.get(row.spell.id)
    if (!held) return void rows.set(row.spell.id, row)
    const always = held.always || row.always
    rows.set(row.spell.id, {
      ...held,
      // The source that makes it always prepared is the one to name.
      from: row.always && !held.always ? row.from : held.from,
      classId: held.classId ?? row.classId,
      ability: held.ability ?? row.ability,
      ready: held.ready || row.ready,
      always,
      preparable: !always && (held.preparable || row.preparable),
      // A class's spell is cast as the class's, whatever an item prints.
      printed: held.classId ?? row.classId ? undefined : (held.printed ?? row.printed),
      ...(held.extraCantrip || row.extraCantrip ? { extraCantrip: true } : {}),
    })
  }
  for (const s of entity.spells) {
    const spell = rules.spells.get(s.spellId)
    if (!spell) continue
    const cls = s.classId ? rules.classes.get(s.classId)?.name : undefined
    add({ spell, from: cls ?? s.source, classId: s.classId, ready: spell.level === 0 || s.prepared, always: false, preparable: spell.level > 0 && Boolean(s.classId) })
  }
  for (const entry of entity.classes) {
    const sub = entry.subclassId ? rules.subclasses.get(entry.subclassId) : undefined
    for (const group of sub?.spells ?? []) {
      if (group.level > entry.level) continue
      // A group that comes with one pick (a Circle of the Land's land, SRD
      // p.46) only while that is the pick; outside the class's counts like
      // every always-prepared spell (the user's ruling, 2026-10-26).
      const { choice } = group
      if (choice && !sheet.choices.some((c) => c.classId === entry.classId && c.choice === choice.id && c.made?.values.includes(choice.value))) continue
      for (const id of group.spells) {
        const spell = rules.spells.get(ref(id))
        if (spell) add({ spell, from: sub!.name, classId: entry.classId, ready: true, always: true, preparable: false })
      }
    }
  }
  // The spellcasting ability a feat or trait has the player choose, saved
  // beside its spells under the same source.
  const chosenAbility = (source: string | undefined) => sheet.choices.find((c) => c.source === source && c.kind === 'ability')?.made?.values[0] as Ability | undefined
  for (const a of sheet.effects) {
    if (a.effect.type !== 'grantSpell') continue
    if (a.effect.atLevel && a.effect.atLevel > sheet.level) continue
    const spell = rules.spells.get(ref(a.effect.spell))
    // A class feature's spell (Faithful Steed, an Oath's) is its class's.
    const ability = a.effect.ability === 'choice' ? chosenAbility(a.source) : a.effect.ability
    const printed = a.effect.dc !== undefined || a.effect.attack !== undefined ? { dc: a.effect.dc, attack: a.effect.attack } : undefined
    if (spell) add({ spell, from: a.from.replace(/^[^:]*: /, ''), ...(ability ? { ability } : a.classId ? { classId: a.classId } : {}), ready: true, always: Boolean(a.effect.alwaysPrepared) || spell.level === 0, preparable: false, ...(printed ? { printed } : {}) })
  }
  for (const c of sheet.choices) {
    if (c.kind !== 'spell' || !/spell|cantrip/.test(c.grants ?? '') || c.grants === 'spellbook') continue
    // A class feature's pick (Magical Discoveries, Magician's cantrip) is
    // that class's spell; a feat's casts with the ability chosen beside it.
    const ability = c.classId ? undefined : chosenAbility(c.source)
    for (const id of c.made?.values ?? []) {
      const spell = rules.spells.get(ref(id))
      const extraCantrip = Boolean(c.classId && c.grants === 'cantrip' && spell?.level === 0)
      if (spell) add({ spell, from: c.origin.name, ...(c.classId ? { classId: c.classId } : {}), ...(ability ? { ability } : {}), ready: true, always: true, preparable: false, ...(extraCantrip ? { extraCantrip } : {}) })
    }
  }
  return [...rows.values()].sort((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name))
}

// Prepared against the class's number (the features table's Prepared Spells
// column), the always-prepared not counted; cantrips against the Cantrips
// column and a feature's extra one, which is counted.
export function preparedCount(rows: SpellRow[], caster: Spellcaster) {
  const mine = rows.filter((r) => r.classId === caster.classId && !r.always)
  return {
    prepared: mine.filter((r) => r.spell.level > 0 && r.ready).length,
    cantrips: rows.filter((r) => r.classId === caster.classId && r.spell.level === 0 && (!r.always || r.extraCantrip)).length,
  }
}

export interface SlotLevel {
  level: number
  max: number
  left: number
}

export function slotLevels(sheet: Sheet, entity: CharacterEntity): SlotLevel[] {
  return sheet.slots.flatMap((max, i) => (max > 0 ? [{ level: i + 1, max, left: Math.max(0, max - (entity.slotsExpended[String(i + 1)] ?? 0)) }] : []))
}

export function pactSlots(sheet: Sheet, entity: CharacterEntity): SlotLevel | null {
  return sheet.pact && sheet.pact.count > 0 ? { level: sheet.pact.level, max: sheet.pact.count, left: Math.max(0, sheet.pact.count - entity.pactSlotsExpended) } : null
}

// A slot ticked used (1) or back (−1), within its maximum.
export function markSlot(entity: CharacterEntity, level: number, max: number, by: 1 | -1): CharacterEntity {
  const used = Math.max(0, Math.min(max, (entity.slotsExpended[String(level)] ?? 0) + by))
  return { ...entity, slotsExpended: { ...entity.slotsExpended, [String(level)]: used } }
}

export function markPact(entity: CharacterEntity, max: number, by: 1 | -1): CharacterEntity {
  return { ...entity, pactSlotsExpended: Math.max(0, Math.min(max, entity.pactSlotsExpended + by)) }
}

// free is a cast with no slot that a trait, feat, feature or item grants
// (sheet.resources' free-cast uses): key is its use, from what grants it.
export type CastWith = { kind: 'slot'; level: number } | { kind: 'pact'; level: number } | { kind: 'ritual' } | { kind: 'cantrip' } | { kind: 'free'; key: string; max: number; from: string }

// How a spell can be cast now (SRD p.104, Casting Spells): a cantrip with
// nothing; a levelled spell first with a free cast that has a use left
// (Magic Initiate's, a lineage's, Divine Smite's), then with a slot of its
// level or higher that is left, never lower; Pact Magic's slots where the
// spell fits under their level; and, for a ritual a class can cast as one,
// as a ritual with no slot.
export function castOptions(rules: Rules, sheet: Sheet, entity: CharacterEntity, row: SpellRow): CastWith[] {
  if (row.spell.level === 0) return [{ kind: 'cantrip' }]
  const free: CastWith[] = sheet.resources
    .filter((r) => (r.key === `free-cast:${row.spell.id}` || r.key.endsWith(`:free-cast:${row.spell.id}`)) && r.used < r.max)
    .map((r) => ({ kind: 'free', key: r.key, max: r.max, from: /\(([^)]*)\)$/.exec(r.name)?.[1] ?? r.from }))
  const out: CastWith[] = [
    ...free,
    ...slotLevels(sheet, entity)
      .filter((s) => s.level >= row.spell.level && s.left > 0)
      .map((s): CastWith => ({ kind: 'slot', level: s.level })),
  ]
  const pact = pactSlots(sheet, entity)
  if (pact && pact.left > 0 && pact.level >= row.spell.level) out.push({ kind: 'pact', level: pact.level })
  const ritualClass = row.classId ? rules.classes.get(row.classId)?.spellcasting?.ritual : false
  if (row.spell.castingTime.ritual && ritualClass) out.push({ kind: 'ritual' })
  return out
}

// What a cast spends, and whether it starts Concentration, ending another
// (SRD p.179: casting a Concentration spell ends the one before).
// A spell's effects the sheet can apply (Bless's 1d4, Mage Armor's AC),
// which casting it switches on and its end switches off (the quick bar's
// toggles, spec C4).
export const hasSheetEffects = (spell: Spell): boolean => (spell.effects ?? []).some((e) => e.type !== 'text' && e.type !== 'choice')

export function cast(entity: CharacterEntity, row: SpellRow, how: CastWith): CharacterEntity {
  let next = entity
  if (how.kind === 'slot') next = { ...next, slotsExpended: { ...next.slotsExpended, [String(how.level)]: (next.slotsExpended[String(how.level)] ?? 0) + 1 } }
  if (how.kind === 'pact') next = { ...next, pactSlotsExpended: next.pactSlotsExpended + 1 }
  if (how.kind === 'free') next = spendResource(next, how.key, how.max, 1)
  if (row.spell.duration.concentration) next = { ...endConcentration(next), concentration: { spellId: row.spell.id } }
  if (hasSheetEffects(row.spell)) next = { ...next, toggles: { ...next.toggles, [row.spell.id]: true } }
  return next
}

// Concentration ends, and with it the spell's effects on the sheet.
export function endConcentration(entity: CharacterEntity): CharacterEntity {
  const id = entity.concentration?.spellId
  if (!id) return entity
  const { [id]: _ended, ...toggles } = entity.toggles
  return { ...entity, concentration: null, toggles }
}

// The Constitution save to keep Concentration after damage (SRD p.179).
export function concentrationDc(rules: Rules, damage: number): number {
  const c = rules.data.core.playRules!.concentration!
  return Math.min(c.maximumDc, Math.max(c.minimumDc, Math.floor(damage / c.damageDivisor)))
}

// The save that damage asks of a character concentrating (spec §3.2, Take
// damage: the DC "with a roll"), named with its DC for the quick roll and
// the Rolls log. None when the damage ends Concentration by itself (0 HP)
// or there is none. The table resolves it: a failed save ends nothing here.
export function concentrationSave(rules: Rules, sheet: Sheet, entity: CharacterEntity, damage: { taken: number; entity: CharacterEntity }): { spell: string; dc: number; name: string; total: Total } | null {
  const id = entity.concentration?.spellId
  if (!id || !damage.entity.concentration) return null
  const dc = concentrationDc(rules, damage.taken)
  const ability = rules.data.core.abilities.find((a) => a.id === 'con')?.name ?? 'Constitution'
  return { spell: rules.spells.get(id)?.name ?? id, dc, name: `${ability} save for Concentration (DC ${dc})`, total: sheet.saves.con }
}

// A spell's damage at the level it is cast (spells.json scaling): a
// cantrip's dice step up with character level; a levelled spell adds its
// per-slot dice for each level above its own, the same die.
export function scaledDice(spell: Spell, dice: string, castLevel: number, characterLevel: number): string {
  const scaling = spell.scaling as { perSlot?: string; atLevels?: { level: number; dice: string }[] } | undefined
  if (spell.level === 0 && scaling?.atLevels) {
    let out = dice
    for (const step of scaling.atLevels) if (characterLevel >= step.level) out = step.dice
    return out
  }
  const extra = scaling?.perSlot ? /^(\d*)d(\d+)$/.exec(scaling.perSlot) : null
  const base = /^(\d*)d(\d+)$/.exec(dice)
  const above = castLevel - spell.level
  if (!extra || !base || above <= 0 || extra[2] !== base[2]) return dice
  return `${(Number(base[1]) || 1) + (Number(extra[1]) || 1) * above}d${base[2]}`
}

// Which caster a spell uses: its class's, or for a granted spell the
// character's first caster (or none), for the attack and the save DC shown.
// The save DC and attack a spell row casts with: its class's; else its own
// ability's, from a feat or trait; else, with neither known, the first
// class's.
export function casterFor(sheet: Sheet, row: SpellRow): Partial<Pick<Spellcaster, 'saveDc' | 'attack'>> | undefined {
  const own = row.classId ? sheet.spellcasting.find((c) => c.classId === row.classId) : undefined
  if (own) return own
  if (row.ability) return sheet.castingBy[row.ability]
  const first = sheet.spellcasting[0]
  if (!row.printed) return first
  // What the item prints, and the first class's for what it doesn't, if
  // there is a class to cast with.
  const fixed = (value: number): Total => ({ total: value, parts: [{ label: `${row.from}, as printed`, value }], notes: [], advantage: [], disadvantage: [] })
  const { dc, attack } = row.printed
  return { saveDc: dc !== undefined ? fixed(dc) : first?.saveDc, attack: attack !== undefined ? fixed(attack) : first?.attack }
}

// Preparing and the spellbook (§3.3): a class spell prepared or not; one
// added to the class's spells (a Wizard's spellbook, or a spell known);
// one removed.
export function setPrepared(entity: CharacterEntity, spellId: string, classId: string, prepared: boolean): CharacterEntity {
  return { ...entity, spells: entity.spells.map((s) => (s.spellId === spellId && s.classId === classId ? { ...s, prepared } : s)) }
}

export function addClassSpell(entity: CharacterEntity, spellId: string, classId: string, prepared: boolean): CharacterEntity {
  if (entity.spells.some((s) => s.spellId === spellId && s.classId === classId)) return setPrepared(entity, spellId, classId, prepared)
  return { ...entity, spells: [...entity.spells, { spellId, classId, source: `class:${classId}`, prepared }] }
}

export function removeClassSpell(entity: CharacterEntity, spellId: string, classId: string): CharacterEntity {
  return { ...entity, spells: entity.spells.filter((s) => !(s.spellId === spellId && s.classId === classId)) }
}

// The highest spell level a class can prepare: its own table's highest slot
// at its level, or Pact Magic's slot level (a multiclassed caster prepares
// each class's spells as if single-classed, SRD p.25).
export function classMaxSpellLevel(rules: Rules, classId: string, classLevel: number): number {
  const cls = rules.classes.get(classId)
  const sc = cls?.spellcasting
  const row = cls?.table.rows[classLevel - 1]
  if (!sc || !row) return 0
  if (sc.progression === 'pact') return Number(row.values[sc.slotColumns?.[1] ?? '']) || 0
  let max = 0
  ;(sc.slotColumns ?? []).forEach((col, i) => {
    if (Number(row.values[col]) > 0) max = i + 1
  })
  return max
}
