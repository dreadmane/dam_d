// The kit at the table (the spec §3.3): the quick bar with its toggles
// (C4), the Reactions band, and the inventory's catalogue, weight and
// Attunement. Pure, so every change is tested without React.
//
// What the rules print is read from the data: a toggle's resource from its
// feature's own effects, Attunement's limit and the coins' weight from
// core.json's playRules, a reaction from a spell's casting time or a
// feature's action, a magic weapon's or armor's base from its record.

import type { Attack, Resource, Sheet } from '../rules/derive.ts'
import { activeEffects, gainedFeatures } from '../rules/effects.ts'
import { equipmentId } from '../rules/equipped.ts'
import { characterChoices } from '../rules/level.ts'
import type { MagicItem, Rules } from '../rules/load.ts'
import type { Feature } from '../rules/types.ts'
import { QUICK_BAR_SLOTS } from '../save/quick-bar.ts'
import type { CharacterEntity, Item, QuickBarSlot } from '../save/types.ts'
import { paragraphs } from './rule-text.ts'
import { characterSpells, hasSheetEffects, type SpellRow } from './spells.ts'

// ---------------------------------------------------------------- toggles

export interface Toggle {
  // The feature's or the spell's id, as entity.toggles keys it.
  ref: string
  name: string
  on: boolean
  // What switching it on spends (Rage: one of its uses).
  cost?: { key: string; name: string; amount: number; left: number }
  // A spell's effects: the spell, which casting switches on (spec §3.2).
  spell?: SpellRow
}

// The resource a feature spends (Rage, when switched on): the resource its
// own effects define (Rage, Innate Sorcery), or what its cost names.
export function featureCost(sheet: Sheet, feature: Feature, classId: string | undefined): Toggle['cost'] {
  const own = feature.effects.find((e) => e.type === 'resource')
  const resourceId = own && own.type === 'resource' ? own.id : typeof feature.cost?.amount === 'number' ? feature.cost.resource : undefined
  if (!resourceId) return undefined
  const key = classId ? `${classId}:${resourceId}` : resourceId
  const r = sheet.resources.find((x) => x.key === key)
  if (!r) return undefined
  const amount = own ? 1 : (feature.cost!.amount as number)
  return { key, name: r.name, amount, left: r.max - r.used }
}

// Every toggle the character has: features that switch (Rage, Superior
// Defense), then the spells they have whose effects the sheet can apply
// (Bless, Mage Armor), each once.
export function toggles(rules: Rules, entity: CharacterEntity, sheet: Sheet): Toggle[] {
  const out: Toggle[] = []
  const seen = new Set<string>()
  for (const g of sheet.features) {
    if (!g.feature.toggle || seen.has(g.feature.id)) continue
    seen.add(g.feature.id)
    out.push({ ref: g.feature.id, name: g.feature.name, on: Boolean(entity.toggles[g.feature.id]), cost: featureCost(sheet, g.feature, g.classId) })
  }
  for (const row of characterSpells(rules, entity, sheet)) {
    if (!hasSheetEffects(row.spell) || seen.has(row.spell.id)) continue
    seen.add(row.spell.id)
    out.push({ ref: row.spell.id, name: row.spell.name, on: Boolean(entity.toggles[row.spell.id]), spell: row })
  }
  return out
}

// What is switched on now, by name, for the Conditions and effects section.
// A spell switched on stays listed even if the character no longer has it.
export function activeToggles(rules: Rules, entity: CharacterEntity, sheet: Sheet): { ref: string; name: string }[] {
  const named = new Map(sheet.features.map((g) => [g.feature.id, g.feature.name]))
  return Object.entries(entity.toggles)
    .filter(([, on]) => on)
    .map(([ref]) => ({ ref, name: named.get(ref) ?? rules.spells.get(ref)?.name ?? ref }))
}

export type Switched = { ok: true; entity: CharacterEntity; line: string } | { ok: false; error: string }

// A toggle switched on or off. On spends its cost, and refuses when none is
// left; off spends nothing and gives nothing back (Rage's use is spent when
// it starts, SRD p.29).
export function switchToggle(entity: CharacterEntity, toggle: Toggle, on: boolean): Switched {
  if (!on) {
    const { [toggle.ref]: _off, ...rest } = entity.toggles
    return { ok: true, entity: { ...entity, toggles: rest }, line: `${toggle.name} ends.` }
  }
  let next: CharacterEntity = { ...entity, toggles: { ...entity.toggles, [toggle.ref]: true } }
  const cost = toggle.cost
  if (cost) {
    if (cost.left < cost.amount) return { ok: false, error: `No ${cost.name} left: none of its uses remain.` }
    next = { ...next, resourcesUsed: { ...next.resourcesUsed, [cost.key]: (next.resourcesUsed[cost.key] ?? 0) + cost.amount } }
    const left = cost.left - cost.amount
    return { ok: true, entity: next, line: `${toggle.name} on. ${cost.name}: ${left} left.` }
  }
  return { ok: true, entity: next, line: `${toggle.name} on.` }
}

export type ToggleChoice = { action: 'cast' | 'effects-only' | 'switch-on' | 'switch-off'; label: string }

// What a toggle's window offers, the first its main button. A spell's
// effects come on by casting it (spec §3.2: its slot and its Concentration,
// through the spell's window), or, for a spell someone else cast on the
// character, by switching on its effects alone, which spends nothing.
export function toggleChoices(toggle: Toggle): ToggleChoice[] {
  if (toggle.on) return [{ action: 'switch-off', label: 'Switch off' }]
  if (toggle.spell)
    return [
      { action: 'cast', label: `Cast ${toggle.name}` },
      { action: 'effects-only', label: 'Effects only: cast by someone else' },
    ]
  return [{ action: 'switch-on', label: 'Switch on' }]
}

// ---------------------------------------------------------------- quick bar

export type BarEntry =
  | { kind: 'toggle'; ref: string; name: string; toggle: Toggle }
  | { kind: 'attack'; ref: string; name: string; attack: Attack }
  | { kind: 'spell'; ref: string; name: string; row: SpellRow }
  | { kind: 'resource'; ref: string; name: string; resource: Resource }
  | { kind: 'item'; ref: string; name: string; item: Item }

// A slot: what it holds, something it held that is gone, or empty.
export type BarSlot = BarEntry | { kind: 'missing'; ref: string; was: QuickBarSlot['kind'] } | null

// Eight slots, four to a row. A bar saved with ten (before 2026-10-19's
// eight) shows its first eight, and is saved as eight when a slot changes.
export const BAR_SIZE = QUICK_BAR_SLOTS

export const BAR_GROUPS: { kind: BarEntry['kind']; name: string }[] = [
  { kind: 'toggle', name: 'Toggles' },
  { kind: 'attack', name: 'Attacks' },
  { kind: 'spell', name: 'Spells' },
  { kind: 'resource', name: 'Class resources' },
  { kind: 'item', name: 'Items' },
]

// Everything that could go in a slot, in BAR_GROUPS's order.
export function barCandidates(rules: Rules, entity: CharacterEntity, sheet: Sheet): BarEntry[] {
  const spells = characterSpells(rules, entity, sheet)
    .filter((r) => r.ready)
    .toSorted((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name))
  return [
    ...toggles(rules, entity, sheet).map((t): BarEntry => ({ kind: 'toggle', ref: t.ref, name: t.name, toggle: t })),
    ...sheet.attacks.map((a): BarEntry => ({ kind: 'attack', ref: a.id, name: a.name, attack: a })),
    ...spells.map((r): BarEntry => ({ kind: 'spell', ref: r.spell.id, name: r.spell.name, row: r })),
    ...sheet.resources.map((r): BarEntry => ({ kind: 'resource', ref: r.key, name: r.name, resource: r })),
    ...entity.inventory.map((i): BarEntry => ({ kind: 'item', ref: i.id, name: i.name || 'Unnamed item', item: i })),
  ]
}

// Suggested only while the player has never changed a slot: a bar they
// emptied themselves stays empty (quickBarChosen, 2026-10-20).
const isEmpty = (entity: CharacterEntity) => !entity.quickBarChosen && entity.quickBar.slice(0, BAR_SIZE).every((s) => s === null)

// The bar until the player changes a slot: the toggles, the attacks (an
// Unarmed Strike only when there is no other), the class resources but the
// ones a toggle spends (Rage's uses, on its toggle), then the levelled
// spells ready to cast, eight at most. Derived, so it follows the sheet until
// the player makes it their own.
function suggested(candidates: BarEntry[]): BarEntry[] {
  const attacks = candidates.filter((c) => c.kind === 'attack')
  const armed = attacks.filter((c) => c.ref !== 'unarmed')
  const spent = new Set(candidates.flatMap((c) => (c.kind === 'toggle' && c.toggle.cost ? [c.toggle.cost.key] : [])))
  return [
    ...candidates.filter((c) => c.kind === 'toggle'),
    ...(armed.length ? armed : attacks),
    ...candidates.filter((c) => c.kind === 'resource' && !spent.has(c.ref)),
    ...candidates.filter((c) => c.kind === 'spell' && c.row.spell.level > 0),
  ].slice(0, BAR_SIZE)
}

export function barSlots(rules: Rules, entity: CharacterEntity, sheet: Sheet): { slots: BarSlot[]; suggested: boolean } {
  const candidates = barCandidates(rules, entity, sheet)
  if (isEmpty(entity)) {
    const s = suggested(candidates)
    return { slots: Array.from({ length: BAR_SIZE }, (_, i) => s[i] ?? null), suggested: true }
  }
  return {
    slots: entity.quickBar.slice(0, BAR_SIZE).map((stored) => (stored ? (candidates.find((c) => c.kind === stored.kind && c.ref === stored.ref) ?? { kind: 'missing', ref: stored.ref, was: stored.kind }) : null)),
    suggested: false,
  }
}

const stored = (slot: BarSlot): QuickBarSlot | null => (slot === null ? null : slot.kind === 'missing' ? { kind: slot.was, ref: slot.ref } : { kind: slot.kind, ref: slot.ref })

// One slot set or emptied. The first change keeps the suggestions in the
// other slots, so the bar the player saw is the bar they keep.
export function setBarSlot(entity: CharacterEntity, shown: readonly BarSlot[], index: number, slot: QuickBarSlot | null): CharacterEntity {
  const bar = shown.map(stored) as CharacterEntity['quickBar']
  bar[index] = slot
  return { ...entity, quickBar: bar, quickBarChosen: true }
}

// ---------------------------------------------------------------- reactions

export type Reaction =
  | { kind: 'opportunity'; name: string; detail: string; attacks: Attack[]; rule: string }
  | { kind: 'spell'; name: string; detail: string; row: SpellRow }
  | { kind: 'feature'; name: string; detail: string; feature: Feature }

// Who can't take a Reaction: at 0 HP, Unconscious; and Incapacitated. Only
// the condition itself counts, until the data says which conditions include
// it (derive.ts says the same).
export const canReact = (entity: CharacterEntity) => entity.hp.current > 0 && !entity.conditions.some((c) => c.conditionId === 'incapacitated' || c.conditionId === 'unconscious')

// The Reactions band (§3.3): an Opportunity Attack always (one melee attack
// with a weapon or an Unarmed Strike, Rules Glossary); then the ready
// spells cast as a Reaction (Shield, Counterspell), then the features used
// as one (Uncanny Dodge).
export function reactions(rules: Rules, entity: CharacterEntity, sheet: Sheet): Reaction[] {
  const rule = rules.data.core.rules.find((r) => r.id === 'opportunity-attacks')
  const out: Reaction[] = [{ kind: 'opportunity', name: rule?.name.replace(/s$/, '') ?? 'Opportunity Attack', detail: 'One melee attack', attacks: sheet.attacks.filter((a) => a.melee), rule: rule?.text ?? '' }]
  for (const row of characterSpells(rules, entity, sheet)) {
    if (!row.ready || row.spell.castingTime.unit !== 'reaction') continue
    out.push({ kind: 'spell', name: row.spell.name, detail: row.spell.level ? `Spell, level ${row.spell.level}` : 'Cantrip', row })
  }
  const seen = new Set<string>()
  for (const g of sheet.features) {
    if (g.feature.action !== 'reaction' || seen.has(g.feature.id)) continue
    seen.add(g.feature.id)
    out.push({ kind: 'feature', name: g.feature.name, detail: g.group, feature: g.feature })
  }
  return out
}

// ---------------------------------------------------------------- attunement

const magicRecord = (rules: Rules, item: Item): MagicItem | undefined => (item.itemId?.startsWith('magic-items:') ? rules.magicItems.get(item.itemId.slice('magic-items:'.length)) : undefined)

export const needsAttunement = (rules: Rules, item: Item): boolean => Boolean(magicRecord(rules, item)?.attunement.required)

// Whether an item can be worn or held for what it does: armor, a Shield, a
// magic item, or anything that carries effects.
export const wearable = (rules: Rules, item: Item): boolean => Boolean(item.effects?.length || magicRecord(rules, item) || rules.armor.has((item.baseItemId ?? item.itemId ?? '').replace(/^equipment:/, '')))

export function attunement(rules: Rules, entity: CharacterEntity): { items: Item[]; max: number } {
  return { items: entity.inventory.filter((i) => i.attuned), max: rules.data.core.playRules!.attunement.maxItems }
}

const listed = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`)

export type Changed = { ok: true; entity: CharacterEntity } | { ok: false; error: string }

const withItem = (entity: CharacterEntity, id: string, patch: Partial<Item>): CharacterEntity => ({ ...entity, inventory: entity.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) })

// Attuning (SRD p.102): no more than three items, and one copy of an item.
// A fourth refuses, naming the three.
export function setAttuned(rules: Rules, entity: CharacterEntity, itemId: string, on: boolean): Changed {
  const item = entity.inventory.find((i) => i.id === itemId)
  if (!item) return { ok: false, error: 'That item is no longer in the inventory.' }
  if (!on) return { ok: true, entity: withItem(entity, itemId, { attuned: false }) }
  const r = rules.data.core.playRules!.attunement
  const { items } = attunement(rules, entity)
  const others = items.filter((i) => i.id !== itemId)
  if (others.length >= r.maxItems) return { ok: false, error: `You're attuned to ${others.length} items already: ${listed(others.map((i) => i.name || 'Unnamed item'))}. End one first.` }
  const copy = r.oneCopy && item.itemId ? others.find((i) => i.itemId === item.itemId) : undefined
  if (copy) return { ok: false, error: `You're already attuned to a copy of ${copy.name}; only one copy of an item can be attuned.` }
  return { ok: true, entity: withItem(entity, itemId, { attuned: true }) }
}

export const setWorn = (entity: CharacterEntity, itemId: string, on: boolean): CharacterEntity => withItem(entity, itemId, { worn: on })

// The sets of weapons the character's features name (Martial Arts' Monk
// weapons) that this weapon isn't in by the rules: the DM may rule it in for
// this character, saved as the item's countsAs. Each set's id and name, and
// what grants it.
export function weaponSets(rules: Rules, entity: CharacterEntity, item: Item): { id: string; name: string; from: string }[] {
  const weapon = equipmentId(item)
  if (!weapon || !rules.weapons.has(weapon)) return []
  const choices = characterChoices(rules, entity)
  const sets = new Map<string, { id: string; name: string; from: string }>()
  for (const { effect, from } of activeEffects(rules, entity, choices, gainedFeatures(rules, entity, choices))) {
    if (effect.type === 'attackOption' && effect.id && effect.name && !effect.attacks.includes(weapon)) sets.set(effect.id, { id: effect.id, name: effect.name, from })
  }
  return [...sets.values()]
}

// The DM's ruling on a weapon, on or off; an item with none keeps no field.
export function setCountsAs(entity: CharacterEntity, itemId: string, set: string, on: boolean): CharacterEntity {
  return {
    ...entity,
    inventory: entity.inventory.map((i) => {
      if (i.id !== itemId) return i
      const { countsAs = [], ...rest } = i
      const sets = on ? [...new Set([...countsAs, set])] : countsAs.filter((s) => s !== set)
      return sets.length ? { ...rest, countsAs: sets as [string, ...string[]] } : rest
    }),
  }
}

// The inventory's weight against the carrying capacity, in words.
export function carryingLine(sheet: Sheet): string {
  const lb = (n: number) => Number(n.toFixed(2)).toLocaleString()
  const coins = sheet.carrying.coins ? `, coins ${lb(sheet.carrying.coins)} lb` : ''
  return `Carrying ${lb(sheet.carrying.carried)} of ${lb(sheet.carrying.capacity)} lb${coins}`
}

// ---------------------------------------------------------------- catalogue

export type CatalogueKind = 'weapon' | 'armor' | 'gear' | 'tool' | 'magic'

export const CATALOGUE_KINDS: { kind: CatalogueKind; name: string }[] = [
  { kind: 'weapon', name: 'Weapons' },
  { kind: 'armor', name: 'Armor' },
  { kind: 'gear', name: 'Adventuring gear' },
  { kind: 'tool', name: 'Tools' },
  { kind: 'magic', name: 'Magic items' },
]

export interface CatalogueEntry {
  ref: string
  name: string
  kind: CatalogueKind
  detail: string
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const words = (id: string) => id.replace(/-/g, ' ')
const pounds = (w: unknown) => (typeof w === 'number' ? ` · ${w.toLocaleString()} lb` : '')

let cached: { rules: Rules; entries: CatalogueEntry[] } | null = null

// Every record an item can be added from, by name within its kind.
export function catalogue(rules: Rules): CatalogueEntry[] {
  if (cached?.rules === rules) return cached.entries
  const e = rules.data.equipment
  const byName = (a: CatalogueEntry, b: CatalogueEntry) => a.name.localeCompare(b.name)
  const entries = [
    ...e.weapons.map((w): CatalogueEntry => ({ ref: `equipment:${w.id}`, name: w.name, kind: 'weapon', detail: `${cap(w.category)} ${w.kind}${pounds(w.weight)}` })),
    ...e.armor.map((a): CatalogueEntry => ({ ref: `equipment:${a.id}`, name: a.name, kind: 'armor', detail: `${a.category === 'shield' ? 'Shield' : `${cap(a.category)} armor`}${pounds(a.weight)}` })),
    ...e.gear.map((g): CatalogueEntry => ({ ref: `equipment:${g.id}`, name: g.name, kind: 'gear', detail: `Gear${pounds(g.weight)}` })),
    ...e.tools.map((t): CatalogueEntry => ({ ref: `equipment:${t.id}`, name: t.name, kind: 'tool', detail: `${cap(words(t.kind))} tool${pounds(t.weight)}` })),
    ...rules.data['magic-items'].items.map((m): CatalogueEntry => ({ ref: `magic-items:${m.id}`, name: m.name, kind: 'magic', detail: `${cap(words(m.rarity))} ${words(m.category)}${m.attunement.required ? ' · attunement' : ''}` })),
  ].toSorted(byName)
  cached = { rules, entries }
  return entries
}

export function findInCatalogue(rules: Rules, query: string, kind: CatalogueKind | null): CatalogueEntry[] {
  const q = query.trim().toLocaleLowerCase()
  return catalogue(rules).filter((c) => (kind === null || c.kind === kind) && (!q || c.name.toLocaleLowerCase().includes(q)))
}

// What a magic weapon or armor is made from (its record's baseItem): one
// named item, a list the record names, or, for "Any…", every weapon or every
// armor, with the printed words shown beside them. None for ammunition or
// an item with no weapon or armor base.
export function baseOptions(rules: Rules, ref: string): { printed: string; ids: string[] } | null {
  const record = ref.startsWith('magic-items:') ? rules.magicItems.get(ref.slice('magic-items:'.length)) : undefined
  const printed = record?.baseItem
  if (!record || !printed) return null
  if (printed.startsWith('equipment:')) return { printed, ids: [printed.slice('equipment:'.length)] }
  const e = rules.data.equipment
  const pool = record.category === 'weapon' ? e.weapons : record.category === 'armor' ? e.armor : []
  if (!pool.length || /ammunition/i.test(printed)) return null
  const names = printed.split(/,\s*(?:or\s+)?|\s+or\s+/).map((n) => n.trim().toLocaleLowerCase())
  const named = pool.filter((r) => names.includes(r.name.toLocaleLowerCase()))
  if (named.length) return { printed, ids: named.map((r) => r.id) }
  const shield = /shield/i.test(printed)
  return { printed, ids: pool.filter((r) => record.category !== 'armor' || ('category' in r && (r.category === 'shield') === shield)).map((r) => r.id) }
}

const equipmentRecord = (rules: Rules, id: string) => {
  const e = rules.data.equipment
  return ([...e.weapons, ...e.armor, ...e.gear, ...e.tools] as { id: string; name: string; weight?: unknown; text?: string }[]).find((r) => r.id === id)
}

// A weapon's or armor's line, for its card: what the table prints for it.
function equipmentLine(rules: Rules, id: string): string {
  const w = rules.weapons.get(id)
  if (w) {
    const props = w.properties.map((p) => rules.data.equipment.weaponProperties.find((x) => x.id === p.id)?.name ?? p.id)
    return [`${w.damage.dice} ${w.damage.type}`, ...props, w.mastery ? `Mastery: ${cap(words(w.mastery))}` : ''].filter(Boolean).join(' · ')
  }
  const a = rules.armor.get(id)
  if (a) return `AC ${a.ac.text}${a.stealthDisadvantage ? ' · Stealth Disadvantage' : ''}${a.strength ? ` · Strength ${a.strength}` : ''}`
  return ''
}

// The item a catalogue record adds: its name, what it does in words (the
// SRD's text as plain paragraphs, its markdown dropped, as the cards show
// it), its weight, and for a magic item its effects (copied, as the save
// says) and its base.
const plain = (text: string) => paragraphs(text).join('\n\n')

export function catalogueItem(rules: Rules, ref: string, baseId: string | undefined, id: string): Item | null {
  if (ref.startsWith('equipment:')) {
    const r = equipmentRecord(rules, ref.slice('equipment:'.length))
    if (!r) return null
    const kind = catalogue(rules).find((c) => c.ref === ref)?.kind ?? 'gear'
    return {
      id,
      name: r.name,
      description: equipmentLine(rules, r.id) || plain(r.text ?? ''),
      quantity: 1,
      tags: [kind],
      itemId: ref,
      ...(typeof r.weight === 'number' ? { weight: r.weight } : {}),
    }
  }
  const m = rules.magicItems.get(ref.slice('magic-items:'.length))
  if (!m) return null
  const base = baseId ? equipmentRecord(rules, baseId) : undefined
  const line = base ? equipmentLine(rules, base.id) : ''
  const effects = m.effects.filter((e) => e.type !== 'text')
  return {
    id,
    name: base && !m.baseItem?.startsWith('equipment:') ? `${m.name} (${base.name})` : m.name,
    description: [line, plain(m.text)].filter(Boolean).join('\n\n'),
    quantity: 1,
    tags: ['magic item'],
    itemId: ref,
    ...(base ? { baseItemId: `equipment:${base.id}` } : {}),
    ...(base && typeof base.weight === 'number' ? { weight: base.weight } : {}),
    ...(effects.length ? { effects } : {}),
  }
}
