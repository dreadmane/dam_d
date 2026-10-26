// A D&D Beyond sheet (dndbeyond.ts) as a d-amp-d character (spec §7.2): every
// name the sheet prints looked up in the rules, by name, and saved as the
// choices a character is made of, with a report of what came in, what the
// player still places, and what was kept by name.
//
// The save keeps only choices and derives every figure (save/types.ts), so
// the sheet's figures aren't copied in: they are the check (checkRows) that
// dam’d's own come out the same. A name the rules lack is kept as its id
// (Locathah as locathah), as a file with missing book records is (§4.2), so
// it resolves on its own once the record is added; screens mark it
// unresolved. The books' prose on the sheet is never read.
//
// Where the sheet doesn't say (where a background's +2 and +1 went, a
// feat's +1), the player says, on the report card, before the base scores
// are worked back from the sheet's totals (placeIncreases). What can't be
// inferred without a guess is left owed, for the Levels page.

import { baseOptions, catalogue, catalogueItem } from '../play/kit.ts'
import { optionsFor } from '../play/options.ts'
import { deriveSheet, type Sheet } from '../rules/derive.ts'
import { isWeapon } from '../rules/equipped.ts'
import { ABILITIES, type Ability } from '../rules/expr.ts'
import { characterChoices, isMade, type OwedChoice } from '../rules/level.ts'
import type { Rules } from '../rules/load.ts'
import { blankCharacter } from '../save/new-roster.ts'
import type { CharacterEntity, Choice, Item, SpellEntry } from '../save/types.ts'
import type { DdbSheet } from './dndbeyond.ts'

// One ability increase the sheet doesn't place, for the report card: a
// background's +2 and +1, or a feat's +1, each a list of +1 steps the
// player puts on an ability. A +2 is two steps on one ability.
export interface Placement {
  // Where it is saved: 'background', or the feat's choice source.
  key: string
  label: string
  // The points to place, largest first: [2, 1] for a background's +2/+1.
  amounts: number[]
  abilities: Ability[]
}

export type Placed = Record<string, Ability[]>

export interface SheetReport {
  // Short lines, each a thing that came in.
  cameIn: string[]
  // A name the rules lack, kept as an id.
  keptByName: { what: string; name: string }[]
  customItems: string[]
  // What the import leaves out on purpose, in words.
  leftOut: string[]
  placements: Placement[]
  // The levelled spells of a class the sheet marks none of as prepared.
  preparedUnknown: string[]
}

export interface ImportedSheet {
  entity: CharacterEntity
  report: SheetReport
}

// A name compared loosely: case, curly apostrophes, punctuation and spacing
// don't count.
export const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'+]+/g, ' ')
    .trim()

// A name as an id, for keeping one the rules lack: "Arcana Domain" is
// arcana-domain.
export const idOf = (name: string) =>
  norm(name)
    .replace(/'/g, '')
    .replace(/\+/g, ' plus ')
    .trim()
    .replace(/\s+/g, '-')

// D&D Beyond's names for two SRD spells the SRD renamed and dropping the
// wizard's name doesn't reach (the general rule is in spellId below). Each
// pair's evidence: Nystul's Magic Aura is printed with PHB-2024 p.302 on
// D&D Beyond's own sheet (2026-10-24), and the PHB's caption for its
// illustration names Bigby's Hand.
const SPELL_NAMES: Record<string, string> = {
  "nystul's magic aura": 'arcanists-magic-aura',
  "bigby's hand": 'arcane-hand',
}

type Kind = 'class' | 'subclass' | 'species' | 'background' | 'feat' | 'spell' | 'skill' | 'language'

// Every record by its loose name, per kind, built once per rules.
let names: { rules: Rules; byKind: Record<Kind, Map<string, string>> } | null = null

function lookup(rules: Rules, kind: Kind, name: string): string | undefined {
  if (names?.rules !== rules) {
    const index = (records: Iterable<{ id: string; name: string }>) => new Map([...records].map((r) => [norm(r.name), r.id]))
    names = {
      rules,
      byKind: {
        class: index(rules.classes.values()),
        subclass: index(rules.subclasses.values()),
        species: index(rules.species.values()),
        background: index(rules.backgrounds.values()),
        feat: index(rules.feats.values()),
        spell: index(rules.spells.values()),
        skill: index(rules.skills.values()),
        language: index(rules.data.core.languages),
      },
    }
  }
  return names.byKind[kind].get(norm(name))
}

// A spell's id: its name, else D&D Beyond's older name for an SRD spell.
// The SRD dropped the wizards' names (Leomund's Secret Chest is its Secret
// Chest), so a name that matches once the owner is dropped is the same
// spell; only an exact match counts.
function spellId(rules: Rules, name: string): string | undefined {
  return lookup(rules, 'spell', name) ?? SPELL_NAMES[norm(name)] ?? (/^\S+'s\s/.test(norm(name)) ? lookup(rules, 'spell', norm(name).replace(/^\S+'s\s+/, '')) : undefined)
}

// What an item on the sheet is in the catalogue, the base of a magic
// weapon or armor, and, where it was worked out rather than named, how.
interface Found {
  ref: string
  baseId?: string
  how?: string
}

type Attack = DdbSheet['attacks'][number]

// An item's catalogue record:
// - by name, or by the forms D&D Beyond writes differently ("Traveler's
//   Clothes" is the catalogue's "Clothes, Traveler’s"), with a player's
//   renaming after a comma or a "+1" dropped ("Bracers of Defense +1,
//   Clamshell Shield");
// - a weapon or armor by the end of a name the player gave it ("Residence
//   Shortsword" is a Shortsword, "Gargarath Shield +2" a Shield, +2);
// - a weapon by its attack line, where nothing in its name says.
// A magic weapon or armor takes the base its record names, or the one of
// those its attack line fits.
function findItem(rules: Rules, name: string, attack: Attack | undefined): Found | undefined {
  const entries = catalogue(rules)
  const byName = new Map(entries.map((e) => [norm(e.name), e.ref]))
  const inverted = new Map(entries.filter((e) => e.name.includes(', ')).map((e) => [norm(e.name.split(', ').reverse().join(' ')), e.ref]))
  const plain = name.replace(/^\*/, '').trim()
  const named = (ref: string): Found => {
    const base = baseOptions(rules, ref)
    const baseId = base?.ids.length === 1 ? base.ids[0] : base && attack ? weaponFor(rules, attack, base.ids) : undefined
    return { ref, ...(baseId ? { baseId } : {}) }
  }
  for (const t of [plain, plain.replace(/\s*\+\d+.*$/, ''), plain.replace(/,.*$/, ''), plain.replace(/\s*\(.*\)$/, '')]) {
    const hit = byName.get(norm(t)) ?? inverted.get(norm(t))
    if (hit) return named(hit)
  }
  // The end of the name, a word at a time, among weapons and armor only:
  // elsewhere a last word ("Box", "Liquid") says too little.
  const gear = new Map(entries.filter((e) => e.kind === 'weapon' || e.kind === 'armor' || /^magic-items:(weapon|armor|shield)-plus/.test(e.ref)).map((e) => [norm(e.name), e]))
  const words = norm(plain.replace(/,.*$/, '')).split(' ')
  for (let i = 1; i < words.length; i++) {
    const hit = gear.get(words.slice(i).join(' '))
    if (hit) return { ...named(hit.ref), how: `a ${hit.name}, by its name` }
  }
  const weapon = attack && weaponFor(rules, attack)
  return weapon ? { ref: `equipment:${weapon}`, how: `a ${rules.weapons.get(weapon)?.name}, from its attack line` } : undefined
}

// The one weapon an attack line fits: its damage die and type, its
// category, every property it has, and its mastery, all printed there.
// None, or more than one, and it is left unsaid.
function weaponFor(rules: Rules, attack: Attack, among?: string[]): string | undefined {
  const damage = attack.damage.match(/^(\d*d\d+)\s*(?:[+-]\s*\d+)?\s+([a-z]+)/i)
  if (!damage) return undefined
  const printed = attack.notes.split(',').map(norm)
  const says = (word: string) => printed.some((p) => p === word || p.startsWith(`${word} `))
  const fits = [...rules.weapons.values()].filter(
    (w) =>
      (!among || among.includes(w.id)) &&
      w.damage.dice === damage[1].toLowerCase() &&
      norm(w.damage.type) === norm(damage[2]) &&
      says(norm(w.category)) &&
      w.properties.every((p) => says(norm(p.id.replace(/-/g, ' ')))) &&
      (!w.mastery || says(norm(w.mastery))),
  )
  return fits.length === 1 ? fits[0].id : undefined
}

// "Monk", "Cleric" as each class's rules id, in the order taken: the first
// class decides the saving throws (the Multiclassing rules), so the class
// whose two saves the sheet marks proficient came first; otherwise the
// order the sheet prints.
function classesFrom(rules: Rules, sheet: DdbSheet) {
  const found = sheet.classes.map((c) => ({ ...c, id: lookup(rules, 'class', c.name) }))
  const known = found.filter((c): c is typeof c & { id: string } => Boolean(c.id))
  const marked = ABILITIES.filter((a) => sheet.saveProficient[a])
  const first = known.find((c) => {
    const saves = rules.classes.get(c.id)?.savingThrows ?? []
    return saves.length === marked.length && saves.every((a) => marked.includes(a as Ability))
  })
  const ordered = first ? [first, ...known.filter((c) => c !== first)] : known
  return { ordered, unknown: found.filter((c) => !c.id) }
}

// What the sheet's features say was picked for an owed choice: the feature
// with the choice's name, its picks matched to the choice's options by name.
function picksFor(rules: Rules, entity: CharacterEntity, sheet: Sheet, ddb: DdbSheet, owed: OwedChoice): string[] {
  const feature = ddb.features.find((f) => norm(f.name) === norm(owed.origin.name) || norm(f.name) === norm(owed.label))
  if (!feature?.choices.length) return []
  const options = optionsFor(rules, entity, sheet, owed) ?? []
  return feature.choices.map((c) => options.find((o) => norm(o.name) === norm(c))?.id).filter((id): id is string => Boolean(id))
}

// A skill, tool or language choice the sheet answers only one way: of the
// options, those the sheet lists that nothing else here already grants.
// More of them than the choice's count is a guess, so it stays owed.
function onlyReading(rules: Rules, entity: CharacterEntity, sheet: Sheet, ddb: DdbSheet, owed: OwedChoice): string[] {
  const options = optionsFor(rules, entity, sheet, owed) ?? []
  const listed = new Set(
    owed.kind === 'skill'
      ? ddb.skills.filter((s) => s.mark).map((s) => norm(s.name))
      : owed.kind === 'tool'
        ? ddb.proficiencies.tools.map(norm)
        : owed.kind === 'language'
          ? ddb.proficiencies.languages.map(norm)
          : [],
  )
  const held = new Set(
    owed.kind === 'skill' ? sheet.skills.filter((s) => s.proficiency > 0).map((s) => s.id) : owed.kind === 'tool' ? sheet.proficiencies.tools : sheet.proficiencies.languages,
  )
  const candidates = options.filter((o) => listed.has(norm(o.name)) && !held.has(o.id)).map((o) => o.id)
  return candidates.length === owed.count ? candidates : []
}

const save = (entity: CharacterEntity, choice: Choice): CharacterEntity => ({
  ...entity,
  choices: [...entity.choices.filter((c) => !(c.source === choice.source && c.choice === choice.choice)), choice],
})

export function sheetToCharacter(rules: Rules, ddb: DdbSheet, newId: () => string = () => crypto.randomUUID()): ImportedSheet {
  const report: SheetReport = { cameIn: [], keptByName: [], customItems: [], leftOut: [], placements: [], preparedUnknown: [] }
  let entity = blankCharacter(newId(), ddb.name || 'Imported character')

  // Classes and levels: the first class's level 1 takes the die's maximum,
  // every other level the fixed value, as the sheet's Max HP is worked.
  const { ordered, unknown } = classesFrom(rules, ddb)
  entity = {
    ...entity,
    classes: ordered.map((c, i) => ({ classId: c.id, level: c.level, hp: Array.from({ length: c.level }, (_, l) => ({ level: l + 1, method: i === 0 && l === 0 ? 'max' : 'fixed' }) as const) })),
    ...(ordered.length > 1 ? { classOrder: ordered.map((c) => c.id) } : {}),
  }
  if (ordered.length) report.cameIn.push(`${ordered.map((c) => `${c.name} ${c.level}`).join(', then ')}${ordered.length > 1 ? ', as the saving throws show' : ''}`)
  for (const c of unknown) report.leftOut.push(`${c.name} ${c.level}: a class the rules don’t have, so its levels aren’t counted`)

  // Subclasses: the feature "<Class> Subclass" names it.
  entity = {
    ...entity,
    classes: entity.classes.map((entry) => {
      const name = rules.classes.get(entry.classId)?.name ?? ''
      const picked = ddb.features.find((f) => norm(f.name) === norm(`${name} Subclass`))?.choices[0]
      if (!picked) return entry
      const id = lookup(rules, 'subclass', picked)
      if (!id) report.keptByName.push({ what: `${name} subclass`, name: picked })
      return { ...entry, subclassId: id ?? idOf(picked) }
    }),
  }

  // Species and background, by name, or kept as ids.
  if (ddb.species) {
    const id = lookup(rules, 'species', ddb.species)
    if (!id) report.keptByName.push({ what: 'species', name: ddb.species })
    entity = { ...entity, species: { speciesId: id ?? idOf(ddb.species) } }
  }
  if (ddb.background) {
    const id = lookup(rules, 'background', ddb.background)
    if (!id) report.keptByName.push({ what: 'background', name: ddb.background })
    entity = { ...entity, background: { backgroundId: id ?? idOf(ddb.background), abilityIncreases: {} } }
    const bg = id ? rules.backgrounds.get(id) : undefined
    const feat = bg?.feat.feat.replace(/^feats:/, '')
    if (bg) report.cameIn.push(`${bg.name}${feat ? `, with ${rules.feats.get(feat)?.name ?? feat}` : ''}`)
    if (bg) {
      // The sheet prints the pattern ("Increase two scores (+2 / +1)").
      const line = ddb.features.flatMap((f) => f.choices).find((c) => /increase .*scores/i.test(c)) ?? ''
      const amounts = /\+1\s*\/\s*\+1\s*\/\s*\+1/.test(line) ? [1, 1, 1] : [2, 1]
      report.placements.push({ key: 'background', label: `${bg.name}’s increases`, amounts, abilities: bg.abilities as Ability[] })
    }
  }

  // Feats. A slot whose own feature names its pick (Fighting Style:
  // Defense) takes that. The others take the sheet's feats the background
  // didn't give, in the sheet's order: D&D Beyond's lists the class levels'
  // feats, then the background's (Frye's export), though not which level
  // took which. Each slot takes the next it offers, or one the rules lack,
  // kept as its id and marked unresolved until its record is added (§4.2);
  // then a slot still empty takes the next left, as D&D Beyond placed it
  // (its list can be wider than ours).
  const backgroundFeat = entity.background && rules.backgrounds.get(entity.background.backgroundId)?.feat.feat.replace(/^feats:/, '')
  const sheetFeats = ddb.features
    .filter((f) => f.section === 'FEATS' && !/ability score improvements?$/i.test(f.name))
    .map((f) => ({ name: f.name, id: lookup(rules, 'feat', f.name) }))
    .filter((f) => !(f.id && f.id === backgroundFeat))
  const featNames: string[] = []
  const take = (owed: OwedChoice, feat: { name: string; id: string | undefined }) => {
    entity = save(entity, { source: owed.source, choice: owed.choice, values: [feat.id ?? idOf(feat.name)] })
    featNames.push(feat.name)
    if (!feat.id) report.keptByName.push({ what: 'feat', name: feat.name })
    const at = sheetFeats.indexOf(feat)
    if (at >= 0) sheetFeats.splice(at, 1)
  }
  const slots = () => characterChoices(rules, entity).filter((o) => o.grants === 'feat' && !isMade(o))
  for (const owed of slots()) {
    const [id] = picksFor(rules, entity, deriveSheet(rules, entity), ddb, owed)
    if (id) take(owed, sheetFeats.find((f) => f.id === id) ?? { name: rules.feats.get(id)?.name ?? id, id })
  }
  for (const owed of slots()) {
    const offered = new Set((optionsFor(rules, entity, deriveSheet(rules, entity), owed) ?? []).map((o) => o.id))
    const next = sheetFeats.find((f) => !f.id || offered.has(f.id))
    if (next) take(owed, next)
  }
  for (const owed of slots()) {
    if (sheetFeats.length) take(owed, sheetFeats[0])
  }
  if (featNames.length) report.cameIn.push(featNames.join(', '))
  // A feat no slot was left for. With the background unresolved, its own
  // feat is among them, and comes with it once the rules have it.
  const backgroundUnresolved = entity.background && !rules.backgrounds.has(entity.background.backgroundId)
  for (const f of sheetFeats) report.leftOut.push(`${f.name}: a feat with no level left to take it at${backgroundUnresolved ? `. If it is ${ddb.background}’s, it comes with that background once the rules have it` : ''}`)

  // The other choices the sheet answers: a feature's picks by name (Divine
  // Order: Protector), and skills, tools and languages where only one
  // reading fits. Repeated until nothing more is answered, since a pick can
  // ask another choice in turn.
  const options: string[] = []
  for (let round = 0; round < 4; round++) {
    const sheet = deriveSheet(rules, entity)
    let changed = false
    for (const owed of characterChoices(rules, entity).filter((o) => !isMade(o) && !o.fixed && !o.increase && o.grants !== 'feat')) {
      const picks = owed.kind === 'skill' || owed.kind === 'tool' || owed.kind === 'language' ? onlyReading(rules, entity, sheet, ddb, owed) : picksFor(rules, entity, sheet, ddb, owed)
      if (!picks.length) continue
      entity = save(entity, { source: owed.source, choice: owed.choice, values: picks.slice(0, owed.count) })
      if (owed.kind === 'option') options.push(...picks.map((p) => optionsFor(rules, entity, sheet, owed)?.find((o) => o.id === p)?.name ?? p))
      changed = true
    }
    if (!changed) break
  }
  if (options.length) report.cameIn.push([...new Set(options)].join(', '))

  // The feats' own increases the sheet doesn't place.
  for (const owed of characterChoices(rules, entity).filter((o) => o.increase && !isMade(o))) {
    const inc = owed.increase!
    const amounts = (inc.patterns ?? [Array.from({ length: inc.choose ?? 1 }, () => inc.amount)]).toSorted((a, b) => b.length - a.length)[0]
    report.placements.push({ key: `${owed.source}|${owed.choice}`, label: `${owed.origin.name}’s increase`, amounts: amounts.flatMap((n) => Array.from({ length: n }, () => 1)), abilities: inc.abilities as Ability[] })
  }

  // Spells: the cantrips each class knows, and the levelled spells it has
  // ready. Where the sheet prints a class's whole list (more spells than
  // it can prepare), only those it marks are; where it prints no more than
  // it can prepare, that is the list prepared. A spell the sheet says is
  // always prepared, or from an item or a feat, comes from that feature or
  // item here, so it isn't saved.
  const spells: SpellEntry[] = []
  const sheet = deriveSheet(rules, entity)
  for (const caster of sheet.spellcasting) {
    const rows = ddb.spells.filter((s) => norm(s.source) === norm(caster.name))
    const levelled = rows.filter((s) => s.level > 0)
    const whole = levelled.length > (caster.prepared ?? 0)
    const ready = [...rows.filter((s) => s.level === 0), ...levelled.filter((s) => (whole ? !['O', ''].includes(s.mark) : true))]
    for (const s of ready) {
      const id = spellId(rules, s.name)
      if (!id) report.keptByName.push({ what: s.level ? `${caster.name} spell` : `${caster.name} cantrip`, name: s.name })
      if (!spells.some((x) => x.spellId === (id ?? idOf(s.name)) && x.classId === caster.classId)) spells.push({ spellId: id ?? idOf(s.name), classId: caster.classId, source: `class:${caster.classId}`, prepared: true })
    }
    const came = ready.filter((s) => spellId(rules, s.name))
    const cantrips = came.filter((s) => s.level === 0).length
    if (came.length) report.cameIn.push(`${caster.name} spells: ${cantrips} ${cantrips === 1 ? 'cantrip' : 'cantrips'}${came.length > cantrips ? `, ${came.length - cantrips} prepared` : ''}`)
    if (whole && levelled.every((s) => ['O', ''].includes(s.mark))) report.preparedUnknown.push(caster.name)
    if (whole) report.leftOut.push(`The rest of the ${caster.name} list, ${levelled.length - levelled.filter((s) => !['O', ''].includes(s.mark)).length} spells: dam’d keeps its own`)
  }
  const granted = ddb.spells.filter((s) => !sheet.spellcasting.some((c) => norm(c.name) === norm(s.source)))
  if (granted.length) report.leftOut.push(`${granted.length} ${granted.length === 1 ? 'spell' : 'spells'} always prepared, or from a feature or an item: dam’d gives each from its own feature or item, where it has it`)
  entity = { ...entity, spells }

  // Items: from the catalogue where the name is found, keeping the sheet's
  // name for it; otherwise a custom item with the sheet's quantity and
  // weight, and no effects guessed.
  const inventory: Item[] = []
  for (const row of ddb.items) {
    const attack = ddb.attacks.find((a) => norm(a.name) === norm(row.name))
    const found = findItem(rules, row.name, attack)
    const attuned = ddb.attuned.some((a) => norm(a) === norm(row.name))
    const from = found ? catalogueItem(rules, found.ref, found.baseId, newId()) : null
    const name = row.name.replace(/^\*/, '').trim()
    if (from) {
      if (found?.how) report.cameIn.push(`${name}: ${found.how}`)
      inventory.push({ ...from, name, quantity: row.quantity, ...(attuned ? { attuned: true, worn: true } : {}) })
    } else {
      report.customItems.push(name)
      inventory.push({ id: newId(), name, description: '', quantity: row.quantity, tags: [], ...(row.weight !== null ? { weight: row.weight } : {}), ...(attuned ? { attuned: true, worn: true } : {}) })
    }
  }
  const fromRules = inventory.length - report.customItems.length
  if (inventory.length) report.cameIn.push(`${fromRules} ${fromRules === 1 ? 'item' : 'items'} from the rules${ddb.attuned.length ? `, ${ddb.attuned.length} attuned` : ''}`)

  // Equipped: the weapons on the sheet's attack lines, which D&D Beyond
  // prints for what is equipped; every other weapon is carried, unequipped.
  for (const [i, item] of inventory.entries()) {
    if (!isWeapon(rules, item) || item.attuned) continue
    inventory[i] = { ...item, worn: ddb.attacks.some((a) => norm(a.name) === norm(item.name)) }
  }
  const held = inventory.filter((i) => isWeapon(rules, i) && i.worn).map((i) => i.name)
  if (held.length) report.cameIn.push(`Equipped: ${held.join(', ')}, as the sheet’s attack lines show`)

  // Languages the rules have. A dialect the rules print under its language
  // (Primordial's Aquan, SRD p.20) comes in as that language, once, and the
  // report says so. One they don't name can't be kept as an id, since the
  // language choices count the ids saved, so it is kept in the notes, in
  // words.
  const languages: string[] = []
  const otherLanguages: string[] = []
  const dialectOf = (name: string) => rules.data.core.languages.find((l) => l.dialects?.some((d) => norm(d) === norm(name)))
  for (const name of ddb.proficiencies.languages) {
    const id = lookup(rules, 'language', name)
    const language = id ? undefined : dialectOf(name)
    const got = id ?? language?.id
    if (got && !languages.includes(got)) languages.push(got)
    if (language) report.cameIn.push(`${name} as ${language.name}: it is one of ${language.name}’s dialects`)
    else if (!got) otherLanguages.push(name)
  }
  if (otherLanguages.length) report.leftOut.push(`${otherLanguages.join(', ')}: ${otherLanguages.length === 1 ? 'a language' : 'languages'} the rules don’t name, kept in the notes`)

  // The player's own words: the details into the appearance, the rest
  // into the notes.
  const appearance = ddb.details.filter((d) => ['Gender', 'Age', 'Height', 'Weight', 'Eyes', 'Skin', 'Hair', 'Faith', 'Appearance'].includes(d.label))
  const notes = ddb.details.filter((d) => !appearance.includes(d))
  const coins = ddb.coins
  const coinLine = Object.entries(coins)
    .filter(([, n]) => n)
    .map(([c, n]) => `${n.toLocaleString()} ${c}`)
    .join(', ')
  if (coinLine) report.cameIn.push(coinLine)
  report.cameIn.push(ddb.milestone ? 'Milestone levelling' : `${ddb.xp.toLocaleString()} XP`)

  entity = {
    ...entity,
    inventory,
    coins,
    heroicInspiration: ddb.heroicInspiration,
    levelling: { mode: ddb.milestone ? 'milestone' : 'xp', xp: ddb.xp },
    details: {
      alignment: ddb.alignment,
      languages: [...new Set([...entity.details.languages, ...languages])],
      appearance: appearance.map((d) => (d.label === 'Appearance' ? d.text : `${d.label}: ${d.text}`)).join('\n'),
    },
    notes: [...notes.map((d) => `${d.label}\n${d.text}`), ...(otherLanguages.length ? [`Languages from D&D Beyond\n${otherLanguages.join(', ')}`] : [])].join('\n\n'),
  }
  // Base scores for now, before any increase is placed (placeIncreases).
  entity = solveBase(rules, entity, ddb)
  entity = wornFromAc(rules, entity, ddb.printed.ac, report)
  return { entity: hitPointsFrom(rules, entity, ddb), report }
}

// The hit points the sheet has the character at, or full where it prints
// none, never more than dam’d's maximum. A blank character starts at 0,
// which the sheet reads as dying.
function hitPointsFrom(rules: Rules, entity: CharacterEntity, ddb: DdbSheet): CharacterEntity {
  const max = deriveSheet(rules, entity).hp.max
  return { ...entity, hp: { current: Math.min(ddb.hitPoints.current ?? max, max), temp: ddb.hitPoints.temp } }
}

// What is worn. The sheet doesn't say, but its AC does: of the armor and
// Shields carried, the one way of wearing them (one suit or none, a Shield
// or not) that gives the sheet's AC is put on. None, or more than one, and
// nothing is guessed.
function wornFromAc(rules: Rules, entity: CharacterEntity, ac: number | null, report: SheetReport): CharacterEntity {
  if (ac === null) return entity
  const armorOf = (item: Item) => rules.armor.get((item.baseItemId ?? item.itemId ?? '').replace(/^equipment:/, ''))
  const suits = entity.inventory.filter((i) => armorOf(i) && armorOf(i)?.category !== 'shield')
  const shields = entity.inventory.filter((i) => armorOf(i)?.category === 'shield')
  const wear = (items: Item[]): CharacterEntity => ({ ...entity, inventory: entity.inventory.map((i) => (items.includes(i) ? { ...i, worn: true } : i)) })
  const ways = [null, ...suits].flatMap((suit) => [null, ...shields].map((shield) => [suit, shield].filter((i): i is Item => i !== null)))
  const fits = ways.filter((items) => items.length && deriveSheet(rules, wear(items)).ac.total === ac)
  if (fits.length !== 1 || deriveSheet(rules, entity).ac.total === ac) return entity
  report.cameIn.push(`Wearing ${fits[0].map((i) => i.name).join(' and ')}, as the sheet’s AC shows`)
  return wear(fits[0])
}

// The placements made on the report card saved as choices, and the base
// scores worked back so dam’d's totals are the sheet's. An increase left
// unplaced stays owed on the Levels page.
export function placeIncreases(rules: Rules, imported: ImportedSheet, ddb: DdbSheet, placed: Placed): CharacterEntity {
  let entity = imported.entity
  for (const p of imported.report.placements) {
    const picks = placed[p.key] ?? []
    if (picks.length !== p.amounts.length || picks.some((a) => !a)) continue
    const increases: Partial<Record<Ability, number>> = {}
    picks.forEach((a, i) => (increases[a] = (increases[a] ?? 0) + p.amounts[i]))
    if (p.key === 'background' && entity.background) {
      entity = { ...entity, background: { ...entity.background, abilityIncreases: increases } }
    } else {
      const [source, choice] = p.key.split('|')
      entity = save(entity, { source, choice, values: [], increases })
    }
  }
  // A Constitution placed moves the maximum, so the hit points follow.
  return hitPointsFrom(rules, solveBase(rules, entity, ddb), ddb)
}

// Base scores such that each derived score is the sheet's. It starts from
// the sheet's score less the increases placed, and moves by what is still
// off until it settles: a cap of 20 can hold an increase back, and an item
// adds its own. Starting low finds the lowest base that gives the total.
function solveBase(rules: Rules, entity: CharacterEntity, ddb: DdbSheet): CharacterEntity {
  const placed = [entity.background?.abilityIncreases ?? {}, ...entity.choices.map((c) => c.increases ?? {})]
  let base = { ...entity.abilities.base }
  for (const a of ABILITIES) base[a] = (ddb.scores[a] ?? base[a]) - placed.reduce((n, inc) => n + (inc[a] ?? 0), 0)
  for (let i = 0; i < 4; i++) {
    const sheet = deriveSheet(rules, { ...entity, abilities: { ...entity.abilities, base } })
    let off = false
    const next = { ...base }
    for (const a of ABILITIES) {
      const want = ddb.scores[a]
      if (want === null) continue
      const gap = want - sheet.abilities[a].score
      if (gap) {
        next[a] = Math.max(1, Math.min(30, base[a] + gap))
        off = true
      }
    }
    base = next
    if (!off) break
  }
  return { ...entity, abilities: { base, generation: { method: 'entered', rolls: [] } } }
}

export interface CheckRow {
  label: string
  theirs: string
  ours: string
  same: boolean
}

const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`)

// dam’d's figures beside the sheet's, for what both work out.
export function checkRows(rules: Rules, entity: CharacterEntity, ddb: DdbSheet): CheckRow[] {
  const sheet = deriveSheet(rules, entity)
  const rows: CheckRow[] = []
  const row = (label: string, theirs: number | null, ours: number, show: (n: number) => string = String) => {
    if (theirs !== null) rows.push({ label, theirs: show(theirs), ours: show(ours), same: theirs === ours })
  }
  const scores = ABILITIES.map((a) => ddb.scores[a])
  if (scores.every((s) => s !== null)) {
    const ours = ABILITIES.map((a) => sheet.abilities[a].score)
    rows.push({ label: 'Scores', theirs: scores.join(' '), ours: ours.join(' '), same: ours.every((s, i) => s === scores[i]) })
  }
  row('Max HP', ddb.printed.maxHp, sheet.hp.max)
  row('AC', ddb.printed.ac, sheet.ac.total)
  row('Proficiency', ddb.printed.proficiency, sheet.proficiencyBonus, signed)
  row('Initiative', ddb.printed.initiative, sheet.initiative.total, signed)
  const walk = ddb.printed.speed.match(/(\d+)\s*ft\.?\s*\(Walking\)/i)?.[1] ?? ddb.printed.speed.match(/^(\d+)/)?.[1]
  row('Speed', walk ? Number(walk) : null, sheet.speed.walk.total, (n) => `${n} ft`)
  row('Passive Perception', ddb.printed.passivePerception, sheet.passivePerception.total)
  for (const c of ddb.printed.spellcasting) {
    const ours = sheet.spellcasting.find((s) => norm(s.name) === norm(c.className))
    if (!ours) continue
    const two = ddb.printed.spellcasting.length > 1
    row(two ? `${ours.name} spell save DC` : 'Spell save DC', c.saveDc, ours.saveDc.total)
    row(two ? `${ours.name} spell attack` : 'Spell attack', c.attack, ours.attack.total, signed)
  }
  return rows
}
