// Which effects reach a character, and from where (the spec §5.1, the
// modifier vocabulary): class features to each class's level, the subclass's,
// the species' traits and lineage, the background, every feat and option
// picked, items worn (and attuned where they need it), conditions, Exhaustion
// and the quick bar's toggles. Each carries the name of what granted it, so
// every number can say why it is what it is.

import { equipped } from './equipped.ts'
import { classesInOrder, featuresAt, findOption, type OwedChoice } from './level.ts'
import type { Rules } from './load.ts'
import type { Effect, Feature } from './types.ts'
import type { CharacterEntity } from '../save/types.ts'

export interface Active {
  effect: Effect
  // What granted it, as the player knows it: "Fighter 1: Second Wind",
  // "Elf: Fey Ancestry", "Ring of Protection".
  from: string
  // The class whose feature it is, for `self` in its expressions.
  classId?: string
  // A feature switched from the quick bar (Rage): its effects apply only
  // while on.
  toggle?: string
  // The inventory item that carries it, for rolls made with that item
  // (attack:this, damage:this).
  item?: string
  // Where its feature's own choices are saved (species:elf,
  // background:acolyte>feat:magic-initiate), so an effect can read a pick
  // made beside it: a granted spell's spellcasting ability.
  source?: string
  // The feature, trait, feat or option it is on, by id: a save DC is shown
  // on its feature's card (Breath Weapon's).
  feature?: string
}

export interface GainedFeature {
  feature: Feature
  group: string
  classId?: string
  level?: number
  // Where the feature's own choices are saved (Active.source).
  source?: string
}

// Every feature the character has, grouped as the Features menu groups them
// (§3.3), each once even where the table lists it again.
export function gainedFeatures(rules: Rules, entity: CharacterEntity, choices: OwedChoice[]): GainedFeature[] {
  const out: GainedFeature[] = []
  const seen = new Set<string>()
  const add = (g: GainedFeature, key: string) => {
    if (seen.has(key)) return
    seen.add(key)
    out.push(g)
  }

  for (const entry of classesInOrder(entity)) {
    const cls = rules.classes.get(entry.classId)
    if (!cls) continue
    const subclass = entry.subclassId ? rules.subclasses.get(entry.subclassId) : undefined
    const replaced = new Set<string>()
    for (let level = 1; level <= entry.level; level++) {
      for (const feature of featuresAt(rules, cls, level, entry.subclassId)) {
        if (feature.replaces) replaced.add(feature.replaces)
        const fromSubclass = subclass?.features.includes(feature)
        add({ feature, group: fromSubclass && subclass ? subclass.name : cls.name, classId: cls.id, level }, `${cls.id}:${feature.id}`)
      }
    }
    for (let i = out.length - 1; i >= 0; i--) if (out[i].classId === cls.id && replaced.has(out[i].feature.id)) out.splice(i, 1)
  }

  if (entity.species) {
    const species = rules.species.get(entity.species.speciesId)
    if (species) {
      for (const trait of species.traits) add({ feature: trait as Feature, group: species.name, source: `species:${species.id}` }, `species:${trait.id}`)
      const lineage = choices.find((c) => c.source === `species:${species.id}` && c.grants === 'lineage')?.made?.values[0]
      const option = species.lineages?.options.find((o) => o.id === lineage)
      if (option) add({ feature: { ...option, effects: option.effects ?? [] } as Feature, group: species.name, source: `species:${species.id}` }, `lineage:${option.id}`)
    }
  }

  if (entity.background) {
    const background = rules.backgrounds.get(entity.background.backgroundId)
    const feat = background && rules.feats.get(background.feat.feat.replace(/^feats:/, ''))
    if (feat) add({ feature: feat as Feature, group: 'Feats', source: `background:${entity.background.backgroundId}>feat:${feat.id}` }, `background-feat:${feat.id}`)
  }

  // Feats and class options picked, wherever they were picked.
  for (const owed of choices) {
    for (const value of owed.made?.values ?? []) {
      if (owed.grants === 'feat' || owed.kind === 'feat' || owed.kind === 'fighting-style') {
        const feat = rules.feats.get(value)
        if (feat) add({ feature: feat as Feature, group: 'Feats', classId: owed.classId, level: owed.level, source: `${owed.source}>feat:${value}` }, `feat:${owed.source}:${value}`)
      } else if (owed.classId && (owed.kind === 'option' || owed.kind === 'invocation')) {
        const option = findOption(rules, owed.classId, value)
        const cls = rules.classes.get(owed.classId)
        if (option) add({ feature: option, group: cls?.name ?? 'Options', classId: owed.classId, level: owed.level, source: `${owed.source}>option:${value}` }, `option:${owed.classId}:${value}`)
      }
    }
  }
  return out
}

// What a picked choice grants, as effects: a skill's proficiency, Expertise,
// a tool, a language, a weapon's mastery. Feats and options come in as
// features above, with their own effects.
function pickEffects(rules: Rules, owed: OwedChoice): Effect[] {
  const values = owed.made?.values ?? []
  if (!values.length) return []
  const grants = owed.grants ?? ''
  if (grants === 'expertise') return [{ type: 'expertise', ids: values }]
  if (owed.kind === 'language') return [{ type: 'proficiency', category: 'language', ids: values as [string, ...string[]] }]
  if ((owed.kind === 'skill' || owed.kind === 'tool' || owed.kind === 'other') && /proficiency/.test(grants)) {
    // Skilled's picks are skills or tools, so each is sorted by what it is.
    const skills = values.filter((v) => rules.skills.has(v))
    const tools = values.filter((v) => !rules.skills.has(v))
    const out: Effect[] = []
    if (skills.length) out.push({ type: 'proficiency', category: 'skill', ids: skills as [string, ...string[]] })
    if (tools.length) out.push({ type: 'proficiency', category: 'tool', ids: tools as [string, ...string[]] })
    return out
  }
  return []
}

export function activeEffects(rules: Rules, entity: CharacterEntity, choices: OwedChoice[], features: GainedFeature[]): Active[] {
  const out: Active[] = []
  const push = (effects: readonly Effect[] | undefined, from: string, classId?: string, toggle?: string, item?: string, source?: string, feature?: string) => {
    for (const effect of effects ?? []) if (effect.type !== 'choice') out.push({ effect, from, classId, toggle, item, ...(source ? { source } : {}), ...(feature ? { feature } : {}) })
  }

  // The first class's proficiencies, then each later class's multiclass
  // gains (the Multiclassing rules).
  classesInOrder(entity).forEach((entry, i) => {
    const cls = rules.classes.get(entry.classId)
    if (!cls) return
    if (i === 0) {
      push([{ type: 'proficiency', category: 'save', ids: cls.savingThrows }], cls.name, cls.id)
      if (cls.armorTraining.length) push([{ type: 'proficiency', category: 'armor', ids: cls.armorTraining as [string, ...string[]] }], cls.name, cls.id)
      if (cls.weaponProficiencies.length) push([{ type: 'proficiency', category: 'weapon', ids: cls.weaponProficiencies as [string, ...string[]] }], cls.name, cls.id)
      if (cls.toolProficiencies?.ids?.length) push([{ type: 'proficiency', category: 'tool', ids: cls.toolProficiencies.ids as [string, ...string[]] }], cls.name, cls.id)
    } else {
      push(cls.multiclass.gains, `${cls.name} (multiclass)`, cls.id)
    }
  })

  for (const g of features) {
    const label = g.level ? `${g.group} ${g.level}: ${g.feature.name}` : `${g.group}: ${g.feature.name}`
    push(g.feature.effects, label, g.classId, g.feature.toggle ? g.feature.id : undefined, undefined, g.source, g.feature.id)
  }

  if (entity.background) {
    const background = rules.backgrounds.get(entity.background.backgroundId)
    if (background) {
      push([{ type: 'proficiency', category: 'skill', ids: background.skills as [string, ...string[]] }], background.name)
      if (background.tool?.id) push([{ type: 'proficiency', category: 'tool', ids: [background.tool.id] }], background.name)
    }
  }

  for (const owed of choices) push(pickEffects(rules, owed), owed.origin.name, owed.classId)

  // Items: worn or wielded (equipped.ts: a weapon is unless unequipped), and
  // attuned where the item needs it. A bonus to rolls made with the item
  // itself (attack:this) needs no worn mark: an attack with it is made
  // holding it.
  for (const item of entity.inventory) {
    if (!item.effects?.length) continue
    const record = item.itemId?.startsWith('magic-items:') ? rules.magicItems.get(item.itemId.slice('magic-items:'.length)) : undefined
    if (record?.attunement.required && !item.attuned) continue
    const effects = equipped(rules, item) ? (item.effects as Effect[]) : (item.effects as Effect[]).filter((e) => 'target' in e && e.target.endsWith(':this'))
    push(effects, item.name, undefined, undefined, item.id)
  }

  for (const condition of entity.conditions) {
    const record = condition.conditionId ? rules.conditions.get(condition.conditionId) : undefined
    if (record) push(record.effects, record.name)
  }
  if (entity.exhaustion > 0) {
    const exhaustion = rules.conditions.get('exhaustion')
    for (const e of exhaustion?.levels?.perLevel ?? []) {
      if (e.type === 'bonus' && typeof e.value === 'number') out.push({ effect: { ...e, value: e.value * entity.exhaustion }, from: `Exhaustion ${entity.exhaustion}` })
    }
  }

  // A spell's effects switched on (Bless, Mage Armor), from the quick bar or
  // by casting it: on the caster's sheet while on, as a feature's toggle is.
  const featureToggles = new Set(features.filter((g) => g.feature.toggle).map((g) => g.feature.id))
  for (const [id, on] of Object.entries(entity.toggles)) {
    const spell = on && !featureToggles.has(id) ? rules.spells.get(id) : undefined
    if (spell) push(spell.effects as Effect[] | undefined, spell.name, undefined, id)
  }

  // A toggle's effects only while it is on; its resource always, so its uses
  // show whether or not it is on (Rage's).
  return out.filter((a) => !a.toggle || a.effect.type === 'resource' || entity.toggles[a.toggle])
}
