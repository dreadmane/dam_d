// What a choice can pick from (the ladder's choice sheet). A choice in the
// rules data lists its options (`options`) or names a query (`from`); this
// turns either into the list the sheet shows. Each query is the data's own
// (classes.json meta.notes lists them), read here generically: "feats:origin"
// is the Origin feats, "spells:wizard-evocation-max-level-2" is Wizard
// Evocation spells of level 1 or 2. A query this cannot read returns null,
// and the sheet says so rather than guessing.

import type { Sheet } from '../rules/derive.ts'
import { evaluateNumber } from '../rules/expr.ts'
import { choiceContext, findOption, type OwedChoice } from '../rules/level.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'

export interface Option {
  id: string
  name: string
  // A word beside the name: a weapon's mastery, a feat's category, a spell's
  // level.
  detail?: string
  // Why it can't be taken (a feat's prerequisite unmet). Shown, never hidden:
  // tables vary (§5.2).
  unmet?: string
}

const ABILITY_NAMES: Record<string, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

const titled = (id: string) =>
  id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const byName = (a: Option, b: Option) => a.name.localeCompare(b.name)

function nameOf(rules: Rules, owed: OwedChoice, id: string): string {
  if (ABILITY_NAMES[id]) return ABILITY_NAMES[id]
  if (id.startsWith('classes:')) return rules.classes.get(id.slice(8))?.name ?? titled(id.slice(8))
  const skill = rules.skills.get(id)
  if (skill) return skill.name
  const option = owed.classId ? findOption(rules, owed.classId, id) : undefined
  if (option) return option.name
  for (const s of rules.data.species.species) {
    const lineage = s.lineages?.options.find((o) => o.id === id)
    if (lineage) return lineage.name
  }
  return titled(id)
}

export function optionsFor(rules: Rules, entity: CharacterEntity, sheet: Sheet, owed: OwedChoice): Option[] | null {
  // A query is the whole list; options beside one (the Rogue's to Wizard's
  // Ability Score Improvement name the ASI feat) only name one of it.
  const from = owed.from
  if (!from) return owed.options ? owed.options.map((id) => ({ id, name: nameOf(rules, owed, id) })) : null
  const out = from.split(',').map((q) => query(rules, entity, sheet, owed, q.trim()))
  if (out.some((o) => o === null)) return null
  return (out as Option[][]).flat()
}

function query(rules: Rules, entity: CharacterEntity, sheet: Sheet, owed: OwedChoice, q: string): Option[] | null {
  const [kind, rest = ''] = q.split(':')
  switch (kind) {
    case 'skills': {
      const all = rules.data.skills.skills.map((s) => ({ id: s.id, name: s.name, detail: s.ability.toUpperCase() }))
      // Expertise goes on a skill already proficient: the sheet's proficiency
      // without this choice's own picks, so a pick doesn't hide itself.
      if (rest === 'proficient') return all.filter((s) => (sheet.skills.find((x) => x.id === s.id)?.proficiency ?? 0) > 0 || owed.made?.values.includes(s.id))
      return all
    }
    case 'tools':
    case 'equipment':
      if (rest === 'simple-or-martial-melee-weapons') return weapons(rules, (w) => w.kind === 'melee')
      return toolOptions(rules, rest)
    case 'weapons':
      if (rest === 'proficient') return weapons(rules, (w) => sheet.proficiencies.weapons.includes(w.category) || sheet.proficiencies.weapons.includes(w.id))
      return weapons(rules, () => true)
    case 'languages':
      return (rules.data.core.languages ?? []).map((l) => ({ id: l.id, name: l.name }))
    case 'feats':
      return feats(rules, entity, sheet, rest)
    case 'options': {
      const list = rules.optionLists.get(rest)
      return list ? [...list.values()].map((o) => ({ id: o.id, name: o.name, unmet: o.prerequisite && unmetLevel(o.prerequisite, owed, entity) })) : null
    }
    case 'spells':
      return spells(rules, entity, owed, rest)
    case 'monsters':
      return monsters(rules, entity, owed, rest)
    default:
      return null
  }
}

const CR_FRACTIONS: Record<number, string> = { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }
export const crText = (cr: number) => CR_FRACTIONS[cr] ?? String(cr)

// "monsters:beast": the Beasts, by the choice's where limits read at the
// character's current level in the class (Wild Shape's Beast Shapes, SRD
// p.42). A form past a limit is shown with the reason, as an unmet
// prerequisite is, since the GM may allow it; a swarm the data rules out is
// left out.
function monsters(rules: Rules, entity: CharacterEntity, owed: OwedChoice, rest: string): Option[] | null {
  if (rest !== 'beast') return null
  const where = owed.where
  const level = entity.classes.find((c) => c.classId === owed.classId)?.level ?? owed.level ?? 0
  const ctx = owed.classId ? choiceContext(rules, owed.classId, level) : undefined
  const maxCr = where?.maxCr && ctx ? evaluateNumber(where.maxCr, ctx) : undefined
  const flyAllowed = where?.fly && ctx ? evaluateNumber(where.fly, ctx) > 0 : true
  const options = rules.data.monsters.monsters
    .filter((m) => m.creatureType === 'beast' && !(where?.swarm === false && m.swarm))
    .map((m) => {
      const fly = m.speed.fly !== undefined || m.speed.either?.modes.includes('fly')
      const unmet = maxCr !== undefined && m.cr > maxCr ? `Above CR ${crText(maxCr)}` : !flyAllowed && fly ? 'Has a Fly Speed' : undefined
      const moves = (['burrow', 'climb', 'fly', 'swim'] as const).filter((s) => m.speed[s] !== undefined).map(titled)
      return { id: m.id, name: m.name, detail: [`CR ${crText(m.cr)}`, ...moves].join(' · '), unmet }
    })
  return [...options.filter((o) => !o.unmet).sort(byName), ...options.filter((o) => o.unmet).sort(byName)]
}

function weapons(rules: Rules, keep: (w: { id: string; kind: string; category: string }) => boolean): Option[] {
  return rules.data.equipment.weapons.filter(keep).map((w) => ({ id: w.id, name: w.name, detail: w.mastery ? titled(w.mastery) : undefined }))
}

function toolOptions(rules: Rules, rest: string): Option[] {
  const tools = rules.data.equipment.tools
  if (rest === 'artisans-tools-or-musical-instrument') return tools.filter((t) => /tools|supplies|utensils/.test(t.id) || t.id === 'musical-instrument').map((t) => ({ id: t.id, name: t.name }))
  // Artisan's Tools alone (a book background's choice): the tools of kind
  // artisan.
  if (rest === 'artisans-tools') return tools.filter((t) => t.kind === 'artisan').map((t) => ({ id: t.id, name: t.name }))
  const one = tools.find((t) => t.id === rest)
  if (one) return [{ id: one.id, name: one.name }]
  return tools.map((t) => ({ id: t.id, name: t.name }))
}

// A level prerequisite on a class option ("Level 5+ Warlock"), against the
// class level the choice is made at.
function unmetLevel(pre: { level?: number; text: string }, owed: OwedChoice, entity: CharacterEntity): string | undefined {
  const at = owed.level ?? entity.classes.find((c) => c.classId === owed.classId)?.level ?? 0
  return pre.level && at < pre.level ? pre.text : undefined
}

// "feats:origin" and "feats:fighting-style" name a category. The others
// (any, qualifying, and the Epic Boon's epic-boon) are an Ability Score
// Improvement's or an Epic Boon's "or another feat you qualify for", which
// names none, so every category, each feat's prerequisite checked (SRD p.87,
// Parts of a Feat: "If you're instructed to choose a feat and no category is
// specified, you can choose from any category").
function feats(rules: Rules, entity: CharacterEntity, sheet: Sheet, rest: string): Option[] {
  const all = rules.data.feats.feats
  const list = rest === 'origin' || rest === 'fighting-style' ? all.filter((f) => f.category === rest) : all
  const features = new Set(sheet.features.map((g) => g.feature.id))
  return list
    .map((f) => {
      const pre = f.prerequisite
      let unmet: string | undefined
      if (pre?.level && sheet.level < pre.level) unmet = pre.text
      if (pre?.abilities?.length) {
        const meets = pre.abilities.map((a) => sheet.abilities[a.ability].score >= a.min)
        if (!(pre.abilitiesMode === 'all' ? meets.every(Boolean) : meets.some(Boolean))) unmet = pre.text
      }
      // A feature it needs: the Fighting Style feature, Spellcasting.
      if (pre?.requires?.some((id) => !features.has(id))) unmet = pre.text
      // A feat taken already, and not repeatable, says so.
      const taken = entity.choices.some((c) => c.values.includes(f.id)) && !f.repeatable?.allowed
      return { id: f.id, name: f.name, detail: titled(f.category), unmet: unmet ?? (taken ? 'Taken already' : undefined) }
    })
    .sort(byName)
}

// The data's spell queries, read word by word: a class or "any-class", the
// list a sibling choice picked ("chosen-list"), "cantrip(s)" or "level-N" or
// "max-level-N", a school, "ritual", "action", and "spellbook" (the spells
// the character's Wizard has recorded).
function spells(rules: Rules, entity: CharacterEntity, owed: OwedChoice, rest: string): Option[] | null {
  const words = rest.split('-')
  let list = rules.data.spells.spells as { id: string; name: string; level: number; school: string; classes: string[]; castingTime: { unit?: string; ritual?: boolean } }[]
  const has = (w: string) => words.includes(w)
  if (has('spellbook')) {
    const book = new Set(entity.spells.filter((s) => s.classId === 'wizard').map((s) => s.spellId))
    list = list.filter((s) => book.has(s.id))
  }
  if (has('chosen')) {
    const sibling = entity.choices.find((c) => c.source === owed.source && /spell-list$/.test(c.choice))?.values[0] ?? owed.made?.values[0]
    const fixed = sibling?.startsWith('classes:') ? sibling.slice(8) : undefined
    const background = entity.background && rules.backgrounds.get(entity.background.backgroundId)?.feat.choice?.toLowerCase()
    const cls = fixed ?? (owed.source.startsWith('background:') ? background : undefined)
    if (!cls) return []
    list = list.filter((s) => s.classes.includes(cls))
  }
  const classes = rest.split(',').map((p) => p.split('-')[0]).filter((c) => rules.classes.has(c))
  if (classes.length) list = list.filter((s) => s.classes.some((c) => classes.includes(c)))
  if (has('cantrip') || has('cantrips')) list = list.filter((s) => s.level === 0)
  const at = words.indexOf('level')
  if (at >= 0 && words[at + 1]) {
    const n = Number(words[at + 1])
    list = list.filter((s) => (words[at - 1] === 'max' ? s.level >= 1 && s.level <= n : s.level === n))
  }
  // One school, or several joined by or (a feat's "Divination or
  // Enchantment spell").
  const schools = words.filter((w) => ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'].includes(w))
  if (schools.length) list = list.filter((s) => schools.includes(s.school))
  // A subclass that casts from another class's list at the levels it has
  // slots for (an Eldritch Knight's Wizard spells): the data has no slot
  // table for a subclass yet, so this keeps the levelled spells, and the
  // player keeps to their slots.
  if (has('available') && has('slot')) list = list.filter((s) => s.level >= 1)
  if (has('ritual')) list = list.filter((s) => s.castingTime.ritual)
  if (has('action')) list = list.filter((s) => s.castingTime.unit === 'action')
  return list.map((s) => ({ id: s.id, name: s.name, detail: s.level === 0 ? 'Cantrip' : `Level ${s.level}` })).sort(byName)
}
