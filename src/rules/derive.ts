// The sheet: every derived value of a character (the spec §5.1), computed
// from its saved choices and the rules data, never stored. Each total keeps
// its parts and the notes that bear on it, so the sheet can say why a number
// is what it is ("explains why", §5.2).
//
// Formulas the data's compute trees can say are evaluated from
// derivations.json. The rest follow their derivation's computeNote, which
// says what the tree would need (the ability in question, a proficiency
// state, a stored roll); each is tested against the SRD's printed values.

import { activeEffects, gainedFeatures, type Active, type GainedFeature } from './effects.ts'
import { ABILITIES, evaluate, evaluateNumber, modifier, toNumber, type Ability, type ExprContext } from './expr.ts'
import { characterChoices, classColumn, classesInOrder, isMade, placedIncrease, type OwedChoice } from './level.ts'
import type { Rules, Weapon } from './load.ts'
import type { EffAbilityIncrease, EffAttackOption, Effect, Expression } from './types.ts'
import { equipped } from './equipped.ts'
import { unresolved } from './unresolved.ts'
import type { CharacterEntity, Item } from '../save/types.ts'

export interface Part {
  label: string
  value: number
}

// Something that bears on a roll without being added in: a printed
// condition the app can't decide, a die (Bless's 1d4), Advantage.
export interface Note {
  text: string
  from: string
}

export interface Total {
  total: number
  parts: Part[]
  notes: Note[]
  advantage: Note[]
  disadvantage: Note[]
}

export interface ClassLine {
  classId: string
  name: string
  level: number
  subclass?: string
}

export interface Attack {
  // The inventory item's id, or `unarmed`.
  id: string
  name: string
  ability: Ability
  proficient: boolean
  toHit: Total
  // modifier is the sum of parts: the ability, then each bonus by name.
  damage: { dice: string; modifier: number; parts: Part[]; type: string; notes: Note[] }
  properties: string[]
  mastery?: string
  range?: string
  // A melee attack (a melee weapon or an Unarmed Strike), which an
  // Opportunity Attack makes (Rules Glossary).
  melee: boolean
  // What an attackOption put in place of the attack's own ability or die
  // (Martial Arts: "1d8 in place of 1d6, DEX in place of STR").
  options: Note[]
}

export interface Resource {
  // The key resourcesUsed is stored under: classId:id for a class's.
  key: string
  name: string
  max: number
  used: number
  recharge: string
  from: string
}

export interface Spellcaster {
  classId: string
  name: string
  ability: Ability
  saveDc: Total
  attack: Total
  // The Cantrips column's number, and one more for each extra cantrip a
  // class feature gives (Magician, Thaumaturge: SRD pp.42, 37).
  cantrips?: number
  prepared?: number
}

export interface Sheet {
  level: number
  classes: ClassLine[]
  proficiencyBonus: number
  abilities: Record<Ability, { base: number; score: number; modifier: number; parts: Part[] }>
  saves: Record<Ability, Total & { proficient: boolean }>
  // A plain ability check, no skill: the modifier and every check bonus.
  checks: Record<Ability, Total>
  skills: (Total & { id: string; name: string; ability: Ability; proficiency: 0 | 1 | 2 })[]
  passivePerception: Total
  initiative: Total
  ac: Total & { formula: string }
  hp: { max: number; parts: Part[] }
  hitDice: { die: number; count: number; spent: number }[]
  speed: { walk: Total; other: { mode: string; feet: number; from: string }[] }
  size: string
  spellcasting: Spellcaster[]
  // A spell's save DC and attack by spellcasting ability, for a spell a feat
  // or trait grants with its own ability (Magic Initiate, a lineage's), worked
  // as a class's are (SRD p.104) with the same bonuses to spell DCs and
  // attacks.
  castingBy: Record<Ability, Pick<Spellcaster, 'saveDc' | 'attack'>>
  // A feature's own save DC, by the feature's id (Monk's Focus, SRD p.50).
  // ruling names the user's ruling where the feature prints no DC and uses
  // this one (Open Hand Technique, p.52).
  featureDcs: { id: string; ability: Ability; dc: Total; ruling?: string }[]
  // Slots by slot level, index 0 is level 1 (the Multiclass Spellcaster
  // table, or the one caster's own); Pact Magic apart.
  slots: number[]
  pact: { count: number; level: number } | null
  resources: Resource[]
  senses: { sense: string; feet: number; from: string }[]
  defenses: { defense: string; damageTypes: string[]; from: string; when?: string }[]
  conditionImmunities: { conditions: string[]; from: string; when?: string }[]
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; languages: string[] }
  weaponMasteries: string[]
  attackCount: number
  critMin: number
  attacks: Attack[]
  // carried includes the coins, which coins also gives alone; pounds.
  carrying: { capacity: number; carried: number; coins: number }
  armor: { worn?: string; shield: boolean; untrained: boolean }
  exhaustion: number
  features: GainedFeature[]
  choices: OwedChoice[]
  unmade: OwedChoice[]
  effects: Active[]
}

const emptyTotal = (): Total => ({ total: 0, parts: [], notes: [], advantage: [], disadvantage: [] })

const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`)

export function deriveSheet(rules: Rules, entity: CharacterEntity): Sheet {
  const ordered = classesInOrder(entity)
  const level = Math.min(20, ordered.reduce((n, c) => n + c.level, 0))
  const classLevel = (id: string) => entity.classes.find((c) => c.classId === id)?.level ?? 0
  const columnOf = (classId: string, column: string) => {
    const cls = rules.classes.get(classId)
    const at = classLevel(classId)
    return cls && at ? classColumn(cls, at, column) : undefined
  }
  const choices = characterChoices(rules, entity)
  const features = gainedFeatures(rules, entity, choices)

  // Inventory: what is worn, which the requires states and AC read.
  // A magic weapon or armor counts as its base (Weapon, +1 as a Longsword).
  const equipmentOf = (item: Item) => {
    const ref = item.baseItemId ?? item.itemId
    return ref?.startsWith('equipment:') ? ref.slice('equipment:'.length) : undefined
  }
  const wornArmor = entity.inventory.find((i) => i.worn && rules.armor.get(equipmentOf(i) ?? '')?.category !== 'shield' && rules.armor.has(equipmentOf(i) ?? ''))
  const armorRecord = wornArmor ? rules.armor.get(equipmentOf(wornArmor)!) : undefined
  const wornMagicArmor = entity.inventory.find((i) => i.worn && i.itemId?.startsWith('magic-items:') && rules.magicItems.get(i.itemId.slice(12))?.category === 'armor' && !/shield/i.test(i.name))
  const wornShield = entity.inventory.find((i) => i.worn && rules.armor.get(equipmentOf(i) ?? '')?.category === 'shield')
  const shieldRecord = wornShield && rules.armor.get(equipmentOf(wornShield)!)
  const shield = Boolean(shieldRecord)
  const wearingArmor = Boolean(armorRecord || wornMagicArmor)
  // Paralyzed, Petrified, Stunned and Unconscious include Incapacitated in
  // their text, which the data doesn't say as a field yet; until it does,
  // only the condition itself counts.
  const incapacitated = entity.conditions.some((c) => c.conditionId === 'incapacitated')

  // The `requires` states (common.schema.json): decided from the save,
  // strength-attack from the attack being totalled, where there is one, and
  // skill-not-proficient from the skill.
  const holds = (e: Effect, attackAbility?: Ability, unproficientSkill?: boolean) => {
    const requires = 'requires' in e ? e.requires : undefined
    switch (requires) {
      case undefined:
        return !('when' in e && e.when)
      case 'armor':
        return wearingArmor
      case 'no-armor':
        return !wearingArmor
      case 'no-armor-no-shield':
        return !wearingArmor && !shield
      case 'no-heavy-armor':
        return armorRecord?.category !== 'heavy'
      case 'not-incapacitated':
        return !incapacitated
      case 'skill-not-proficient':
        return Boolean(unproficientSkill)
      case 'strength-attack':
        return attackAbility === 'str'
      // An item's effects reach the sheet only while it is worn or held
      // (effects.ts), so this holds wherever it is read.
      case 'worn':
        return true
    }
  }

  const effects = activeEffects(rules, entity, choices, features)
  const of = <T extends Effect['type']>(type: T) => effects.filter((a): a is Active & { effect: Extract<Effect, { type: T }> } => a.effect.type === type)

  // Ability scores: base, the background's increases (none above 20), the
  // increases the player placed, the fixed ones, then any score an item sets.
  const abilities = {} as Sheet['abilities']
  for (const a of ABILITIES) abilities[a] = { base: entity.abilities.base[a], score: entity.abilities.base[a], modifier: 0, parts: [{ label: 'Base', value: entity.abilities.base[a] }] }
  const raise = (a: Ability, amount: number, cap: number, label: string) => {
    const before = abilities[a].score
    const after = before >= cap ? before : Math.min(cap, before + amount)
    if (after !== before) {
      abilities[a].score = after
      abilities[a].parts.push({ label, value: after - before })
    }
  }
  const background = entity.background && rules.backgrounds.get(entity.background.backgroundId)
  for (const a of ABILITIES) {
    const n = entity.background?.abilityIncreases[a] ?? 0
    if (n > 0 && background?.abilities.includes(a)) raise(a, n, 20, background.name)
  }
  for (const owed of choices) {
    if (!owed.increase) continue
    for (const [a, n] of Object.entries(placedIncrease(owed)) as [Ability, number][]) raise(a, n, owed.increase.max ?? 20, owed.origin.name)
  }
  for (const { effect, from } of of('abilityIncrease')) {
    const e = effect as EffAbilityIncrease
    if (e.choose || e.patterns) continue
    for (const a of e.abilities) raise(a, e.amount, e.max ?? 20, from)
  }
  for (const { effect, from } of of('setScore')) {
    const a = effect.ability
    if (abilities[a].score < effect.value) {
      abilities[a].parts.push({ label: from, value: effect.value - abilities[a].score })
      abilities[a].score = effect.value
    }
  }
  for (const a of ABILITIES) abilities[a].modifier = modifier(abilities[a].score)

  const score = (a: Ability) => abilities[a].score
  const baseContext = (pb: number): ExprContext => ({ score, proficiencyBonus: pb, level, classLevel, classColumn: columnOf })
  const derivation = (id: string) => rules.data.derivations.derivations.find((d) => d.id === id)
  const computeOf = (id: string, ctx: ExprContext) => {
    const compute = derivation(id)?.compute as Expression | undefined
    return compute ? toNumber(evaluate(compute, ctx)) : 0
  }

  // A total for some targets: the base parts, then every bonus effect aimed
  // at them, with the conditional ones and dice kept as notes. The data
  // prints a condition as its own sentence ("To avoid or end…"); after a
  // number or "Advantage" it starts lower case.
  const valueOf = (a: Active, value: number | Expression, pb: number) =>
    evaluateNumber(value, { ...baseContext(pb), self: a.classId, spellcasting: undefined })
  const midLine = (s = '') => s.charAt(0).toLowerCase() + s.slice(1)
  const total = (base: Part[], targets: string[], pb: number, item?: Item, ability?: Ability, unproficientSkill?: boolean): Total => {
    const t = emptyTotal()
    t.parts.push(...base)
    for (const a of effects) {
      const e = a.effect
      if (e.type === 'bonus' && targets.includes(e.target)) {
        if (e.target.endsWith(':this') && (!item || a.item !== item.id)) continue
        const v = valueOf(a, e.value, pb)
        if (!holds(e, ability, unproficientSkill)) t.notes.push({ text: `${e.dice ? `+${e.dice}` : signed(v)} ${midLine(e.when)}`.trim(), from: a.from })
        else if (e.dice) t.notes.push({ text: `+${e.dice}`, from: a.from })
        else if (v) t.parts.push({ label: a.from, value: v })
      }
      if (e.type === 'advantage' && targets.includes(e.on) && (e.who ?? 'self') === 'self') {
        const note = { text: midLine(e.when), from: a.from }
        if (holds(e)) (e.mode === 'advantage' ? t.advantage : t.disadvantage).push(note)
        else t.notes.push({ text: `${e.mode === 'advantage' ? 'Advantage' : 'Disadvantage'} ${midLine(e.when)}`, from: a.from })
      }
    }
    t.total = t.parts.reduce((n, p) => n + p.value, 0)
    return t
  }

  // Proficiency bonus by character level, plus any effect on it.
  const pbBase = level ? computeOf('proficiency-bonus', baseContext(0)) : 0
  const pbTotal = total([{ label: `Level ${level}`, value: pbBase }], ['proficiency-bonus'], pbBase)
  const pb = pbTotal.total

  // Proficiencies, from every proficiency and Expertise effect.
  const profs = { save: new Set<string>(), skill: new Set<string>(), tool: new Set<string>(), armor: new Set<string>(), weapon: new Set<string>(), language: new Set<string>(entity.details.languages) }
  for (const { effect } of of('proficiency')) for (const id of effect.ids) profs[effect.category].add(id)
  const expertise = new Set(of('expertise').flatMap((a) => a.effect.ids))

  const saves = {} as Sheet['saves']
  for (const a of ABILITIES) {
    const proficient = profs.save.has(a)
    const base: Part[] = [{ label: `${rules.data.core.abilities.find((x) => x.id === a)?.name ?? a} modifier`, value: abilities[a].modifier }]
    if (proficient) base.push({ label: 'Proficiency', value: pb })
    saves[a] = { ...total(base, [`save:${a}`, 'save:all', 'd20:all'], pb), proficient }
  }

  const checks = {} as Sheet['checks']
  for (const a of ABILITIES) checks[a] = total([{ label: `${a.toUpperCase()} modifier`, value: abilities[a].modifier }], [`check:${a}`, 'check:all', 'd20:all'], pb)

  const skills = rules.data.skills.skills.map((s) => {
    const ability = s.ability as Ability
    const proficiency: 0 | 1 | 2 = profs.skill.has(s.id) ? (expertise.has(s.id) ? 2 : 1) : 0
    const base: Part[] = [{ label: `${ability.toUpperCase()} modifier`, value: abilities[ability].modifier }]
    if (proficiency) base.push({ label: proficiency === 2 ? 'Expertise' : 'Proficiency', value: pb * proficiency })
    return { id: s.id, name: s.name, ability, proficiency, ...total(base, [`skill:${s.id}`, `check:${ability}`, 'check:all', 'd20:all'], pb, undefined, undefined, !proficiency) }
  })

  const perception = skills.find((s) => s.id === 'perception')!
  const passive = total([{ label: 'Base', value: 10 }, { label: 'Perception', value: perception.total }], ['passive:perception'], pb)
  const net = perception.advantage.length && !perception.disadvantage.length ? 5 : perception.disadvantage.length && !perception.advantage.length ? -5 : 0
  if (net) {
    passive.parts.push({ label: net > 0 ? 'Advantage' : 'Disadvantage', value: net })
    passive.total += net
  }

  // Initiative is a Dexterity check, so the check's bonuses apply (ruled
  // 2026-10-19, core.json initiative-includes-dexterity-check-bonuses).
  const initiative = total([{ label: 'DEX modifier', value: computeOf('initiative', baseContext(pb)) }], ['initiative', 'check:dex', 'check:all', 'd20:all'], pb)

  // Armor Class: the highest formula available, then a shield and bonuses.
  const dex = abilities.dex.modifier
  const formulas: { formula: string; parts: Part[] }[] = []
  if (armorRecord && 'base' in armorRecord.ac) {
    const ac = armorRecord.ac as { base: number; dex: string }
    const cap = ac.dex === 'none' ? 0 : ac.dex.startsWith('max-') ? Number(ac.dex.slice(4)) : Infinity
    const name = wornArmor?.baseItemId ? wornArmor.name : armorRecord.name
    const parts: Part[] = [{ label: name, value: ac.base }]
    if (cap > 0) parts.push({ label: 'DEX modifier', value: Math.min(dex, cap) })
    formulas.push({ formula: name, parts })
  } else if (!wearingArmor) {
    formulas.push({ formula: 'Unarmored', parts: [{ label: 'Base', value: 10 }, { label: 'DEX modifier', value: dex }] })
  }
  for (const { effect, from } of of('acFormula')) {
    if (!holds(effect) || (shield && effect.allowsShield === false)) continue
    const parts: Part[] = [{ label: from, value: effect.base }]
    for (const a of effect.abilities) parts.push({ label: `${a.toUpperCase()} modifier`, value: a === 'dex' && effect.maxDex !== undefined ? Math.min(dex, effect.maxDex) : abilities[a].modifier })
    formulas.push({ formula: from, parts })
  }
  const sum = (parts: Part[]) => parts.reduce((n, p) => n + p.value, 0)
  const best = formulas.reduce((a, b) => (sum(b.parts) > sum(a.parts) ? b : a), formulas[0] ?? { formula: 'Armor', parts: [{ label: 'Armor', value: 10 }] })
  const acBase = [...best.parts]
  const shieldAc = shieldRecord?.ac as { bonus?: number } | undefined
  if (shieldAc?.bonus) acBase.push({ label: wornShield?.baseItemId ? wornShield.name : shieldRecord!.name, value: shieldAc.bonus })
  const ac = { ...total(acBase, ['ac'], pb), formula: best.formula }

  // Max HP: the first class's die at level 1, then each level's stored
  // method, each plus the Constitution modifier (minimum 1 a level, the
  // fixed value too: ruled 2026-10-19, derivations.json
  // fixed-hit-points-minimum), plus effects.
  const con = abilities.con.modifier
  const hpParts: Part[] = []
  ordered.forEach((entry, i) => {
    const cls = rules.classes.get(entry.classId)
    if (!cls) return
    let gained = 0
    for (let l = 1; l <= entry.level; l++) {
      const stored = entry.hp.find((h) => h.level === l)
      const first = i === 0 && l === 1
      const die = first ? cls.hitDie : stored?.method === 'rolled' && stored.value ? stored.value : stored?.method === 'max' ? cls.hitDie : Math.floor(cls.hitDie / 2) + 1
      gained += first ? die + con : Math.max(1, die + con)
    }
    hpParts.push({ label: `${cls.name} ${entry.level}`, value: gained })
  })
  const hpTotal = total(hpParts, ['hp-max'], pb)
  const hp = { max: Math.max(level ? 1 : 0, hpTotal.total), parts: hpTotal.parts }

  const dice = new Map<number, number>()
  for (const entry of ordered) {
    const cls = rules.classes.get(entry.classId)
    if (cls) dice.set(cls.hitDie, (dice.get(cls.hitDie) ?? 0) + entry.level)
  }
  const hitDice = [...dice].sort((a, b) => b[0] - a[0]).map(([die, count]) => ({ die, count, spent: Math.min(count, entity.hitDiceSpent[`d${die}`] ?? 0) }))

  // Speed: the species' walking Speed, or a trait's where it sets a higher
  // one (Wood Elf, "Your Speed increases to 35 feet", SRD p.84), its
  // bonuses, Exhaustion, and heavy armor's Strength requirement.
  const species = entity.species && rules.species.get(entity.species.speciesId)
  let walkSet: Part = { label: species?.name ?? 'Speed', value: species?.speed ?? 30 }
  for (const { effect, from } of of('speed')) if (effect.mode === 'walk' && effect.feet && holds(effect) && effect.feet > walkSet.value) walkSet = { label: from, value: effect.feet }
  const walkBase: Part[] = [walkSet]
  if (armorRecord?.strength && score('str') < armorRecord.strength) walkBase.push({ label: `${armorRecord.name} (Strength ${armorRecord.strength})`, value: -10 })
  const walk = total(walkBase, ['speed:walk', 'speed:all'], pb)
  walk.total = Math.max(0, walk.total)
  const other: Sheet['speed']['other'] = []
  for (const { effect, from } of of('speed')) {
    if (!holds(effect)) continue
    const feet = effect.equalsWalk ? walk.total : (effect.feet ?? 0)
    if (effect.mode !== 'walk' && feet) other.push({ mode: effect.mode, feet, from })
  }

  // Spellcasting, per class.
  const spellcasting: Spellcaster[] = []
  for (const entry of ordered) {
    const cls = rules.classes.get(entry.classId)
    const sc = cls?.spellcasting
    if (!cls || !sc) continue
    const ctx: ExprContext = { ...baseContext(pb), self: cls.id, spellcasting: sc.ability }
    const mod = abilities[sc.ability].modifier
    const dcBase = computeOf('spell-save-dc', ctx)
    const attackBase = computeOf('spell-attack-bonus', ctx)
    spellcasting.push({
      classId: cls.id,
      name: cls.name,
      ability: sc.ability,
      saveDc: total([{ label: 'Base', value: dcBase - mod - pb }, { label: `${sc.ability.toUpperCase()} modifier`, value: mod }, { label: 'Proficiency', value: pb }], ['spell-dc'], pb),
      attack: total([{ label: `${sc.ability.toUpperCase()} modifier`, value: mod }, { label: 'Proficiency', value: attackBase - mod }], ['spell-attack', 'd20:all'], pb),
      cantrips: sc.cantripsColumn ? toNumber(columnOf(cls.id, sc.cantripsColumn)) + choices.filter((c) => c.classId === cls.id && c.kind === 'spell' && c.grants === 'cantrip').reduce((n, c) => n + c.count, 0) : undefined,
      prepared: sc.preparedColumn ? toNumber(columnOf(cls.id, sc.preparedColumn)) : undefined,
    })
  }
  const castingBy = Object.fromEntries(
    ABILITIES.map((ability) => {
      const ctx: ExprContext = { ...baseContext(pb), spellcasting: ability }
      const mod = abilities[ability].modifier
      const dcBase = computeOf('spell-save-dc', ctx)
      const attackBase = computeOf('spell-attack-bonus', ctx)
      return [
        ability,
        {
          saveDc: total([{ label: 'Base', value: dcBase - mod - pb }, { label: `${ability.toUpperCase()} modifier`, value: mod }, { label: 'Proficiency', value: pb }], ['spell-dc'], pb),
          attack: total([{ label: `${ability.toUpperCase()} modifier`, value: mod }, { label: 'Proficiency', value: attackBase - mod }], ['spell-attack', 'd20:all'], pb),
        },
      ]
    }),
  ) as Sheet['castingBy']

  // A feature's own save DC, 8 + the ability's modifier + Proficiency
  // Bonus, as the saveDc effect is defined (common.schema.json effSaveDc;
  // Monk's Focus, SRD p.50).
  const featureDcs: Sheet['featureDcs'] = of('saveDc').map(({ effect }) => {
    const mod = abilities[effect.ability].modifier
    const dc = total([{ label: 'Base', value: 8 }, { label: `${effect.ability.toUpperCase()} modifier`, value: mod }, { label: 'Proficiency', value: pb }], [], pb)
    return { id: effect.id, ability: effect.ability, dc, ruling: effect.ruling }
  })

  // Slots: one caster's own table, or the Multiclass Spellcaster table by
  // the multiclass caster level (SRD p.25). Pact Magic is apart.
  const casters = ordered.filter((e) => {
    const p = rules.classes.get(e.classId)?.spellcasting?.progression
    return p && p !== 'pact'
  })
  let slots = Array.from({ length: 9 }, () => 0)
  if (casters.length === 1) {
    const cls = rules.classes.get(casters[0].classId)!
    slots = slots.map((_, i) => toNumber(columnOf(cls.id, cls.spellcasting?.slotColumns?.[i] ?? '')))
  } else if (casters.length > 1) {
    const casterLevel = computeOf('multiclass-spellcaster-level', baseContext(pb))
    const row = rules.data.spellcasting.multiclassSlots.rows.find((r) => r.casterLevel === casterLevel)
    if (row) slots = [...row.slots]
  }
  const warlock = ordered.find((e) => rules.classes.get(e.classId)?.spellcasting?.progression === 'pact')
  const pactColumns = warlock && rules.classes.get(warlock.classId)?.spellcasting?.slotColumns
  const pact = warlock && pactColumns ? { count: toNumber(columnOf(warlock.classId, pactColumns[0])), level: toNumber(columnOf(warlock.classId, pactColumns[1])) } : null

  const resources: Resource[] = of('resource').map((a) => {
    const key = a.classId ? `${a.classId}:${a.effect.id}` : a.effect.id
    const max = valueOf(a, a.effect.max, pb)
    let recharge: string = a.effect.recharge
    const from = a.effect.rechargeFromLevel
    if (from && a.classId && classLevel(a.classId) >= from.level) recharge = from.recharge
    return { key, name: a.effect.name, max, used: Math.min(max, entity.resourcesUsed[key] ?? 0), recharge, from: a.from }
  })
  // A granted spell cast without a slot so many times a rest or a dawn (a
  // lineage's, Paladin's Smite's, an item's): a limited use like any other,
  // from the character level the grant comes at, named as Forest Gnome's
  // is, "Spell (what grants it)". An item's is keyed by the item, as two
  // items can grant the same spell.
  for (const a of of('grantSpell')) {
    const free = a.effect.freeCasts
    if (!free || (a.effect.atLevel && a.effect.atLevel > level)) continue
    const spellId = a.effect.spell.replace(/^spells:/, '')
    const key = [a.classId, a.item, `free-cast:${spellId}`].filter(Boolean).join(':')
    const max = valueOf(a, free.uses, pb)
    const name = `${rules.spells.get(spellId)?.name ?? unresolved(spellId)} (${a.from.replace(/^[^:]*: /, '')})`
    resources.push({ key, name, max, used: Math.min(max, entity.resourcesUsed[key] ?? 0), recharge: free.recharge, from: a.from })
  }

  // Senses: the longest of each, and an `extends` adds to one already held.
  const senseMap = new Map<string, { feet: number; from: string }>()
  for (const { effect, from } of of('sense')) {
    if (!holds(effect)) continue
    const held = senseMap.get(effect.sense)
    const feet = effect.extends && held ? held.feet + effect.feet : effect.feet
    if (!held || feet > held.feet) senseMap.set(effect.sense, { feet, from })
  }

  // Weapon masteries, attacks and their arithmetic (§3.2 Attack).
  const masteries = choices.filter((c) => c.kind === 'weapon-mastery').flatMap((c) => c.made?.values ?? [])
  const proficientWith = (w: Weapon) => profs.weapon.has(w.category) || profs.weapon.has(w.id)

  // attackOption effects (Martial Arts, SRD p.50): an ability and a die an
  // attack may use in place of its own, each taken where it is better, as
  // Finesse's choice is. One that doesn't hold is a note, where it would
  // change something. wieldingOnly holds while every weapon equipped is one
  // the option names. A weapon is one by the rules, or by the DM's ruling
  // for this character (the item's countsAs names the option's id). own is
  // the attack's die, or an Unarmed Strike's flat damage.
  const wielded = entity.inventory.filter((i) => equipped(rules, i) && rules.weapons.has(equipmentOf(i) ?? ''))
  const ruled = (e: EffAttackOption, item?: Item) => Boolean(e.id && item?.countsAs?.includes(e.id))
  const inSet = (e: EffAttackOption, id: string, item?: Item) => e.attacks.includes(id) || ruled(e, item)
  const mean = (dice: string) => {
    const m = dice.match(/^(\d*)d(\d+)$/)
    return m ? ((Number(m[1]) || 1) * (Number(m[2]) + 1)) / 2 : Number(dice) || 0
  }
  const optioned = (id: string, own: Ability, ownDice: string, item?: Item) => {
    let ability = own
    let dice = ownDice
    const options: Note[] = []
    const lapsed: Note[] = []
    for (const a of of('attackOption')) {
      const e = a.effect
      if (!inSet(e, id, item)) continue
      const from = ruled(e, item) && !e.attacks.includes(id) ? `${a.from}; a ${e.name} by your DM’s ruling` : a.from
      const die = typeof e.die === 'string' ? e.die : e.die && String(evaluate(e.die, { ...baseContext(pb), self: a.classId }))
      const better = {
        die: die && /^\d*d\d+$/.test(die) && mean(die) > mean(dice) ? die : undefined,
        ability: e.ability && abilities[e.ability].modifier > abilities[ability].modifier ? e.ability : undefined,
      }
      const said = [better.die && `${better.die} in place of ${dice}`, better.ability && `${better.ability.toUpperCase()} in place of ${ability.toUpperCase()}`].filter(Boolean).join(', ')
      if (!said) continue
      const others = e.wieldingOnly ? wielded.filter((w) => !inSet(e, equipmentOf(w)!, w)) : []
      if (holds(e) && !others.length) {
        dice = better.die ?? dice
        ability = better.ability ?? ability
        options.push({ text: said, from })
      } else lapsed.push({ text: [said, lapsedBy(e, others) ?? midLine(e.when)].filter(Boolean).join(', '), from })
    }
    return { ability, dice, options, lapsed }
  }
  // Why an attackOption lapses, naming what breaks it (the design system's
  // "a why names its cause"): the armor worn, the Shield, each weapon held
  // that the option doesn't name. Undefined where the app can't say, and the
  // printed condition stands.
  function lapsedBy(e: EffAttackOption, others: Item[]): string | undefined {
    const armor = wornArmor ?? wornMagicArmor
    const causes = [
      (e.requires === 'no-armor' || e.requires === 'no-armor-no-shield') && armor && `wear the ${armor.name}`,
      e.requires === 'no-armor-no-shield' && wornShield && `wield the ${wornShield.name}`,
      others.length && [`wield ${others.map((w) => `the ${w.name}`).join(' and ')}`, e.name && `which ${others.length > 1 ? `aren’t ${e.name}s` : `isn’t a ${e.name}`}`].filter(Boolean).join(', '),
    ].filter(Boolean)
    return causes.length ? `not while you ${causes.join(' or ')}` : undefined
  }

  const attacks: Attack[] = []
  for (const item of entity.inventory) {
    const weapon = rules.weapons.get(equipmentOf(item) ?? '')
    // Only an equipped weapon is an attack (equipped.ts).
    if (!weapon || !equipped(rules, item)) continue
    const finesse = weapon.properties.some((p) => p.id === 'finesse')
    const ranged = weapon.kind === 'ranged'
    const own: Ability = finesse ? (abilities.dex.modifier > abilities.str.modifier ? 'dex' : 'str') : ranged ? 'dex' : 'str'
    const { ability, dice, options, lapsed } = optioned(weapon.id, own, weapon.damage.dice, item)
    const proficient = proficientWith(weapon)
    const base: Part[] = [{ label: `${ability.toUpperCase()} modifier`, value: abilities[ability].modifier }]
    if (proficient) base.push({ label: 'Proficiency', value: pb })
    const kind = ranged ? 'ranged-weapon' : 'melee-weapon'
    const toHit = total(base, ['attack:all', 'attack:weapon', `attack:${kind}`, 'attack:this', 'd20:all'], pb, item)
    const damage = total([{ label: `${ability.toUpperCase()} modifier`, value: abilities[ability].modifier }], ['damage:weapon', `damage:${kind}`, 'damage:this'], pb, item, ability)
    damage.notes.push(...lapsed)
    const range = weapon.properties.find((p) => 'range' in p && p.range) as { range?: { normal: number; long: number } } | undefined
    attacks.push({
      id: item.id,
      name: item.name,
      ability,
      proficient,
      toHit,
      damage: { dice, modifier: damage.total, parts: damage.parts, type: weapon.damage.type, notes: damage.notes },
      properties: weapon.properties.map((p) => p.id),
      mastery: masteries.includes(weapon.id) && weapon.mastery ? weapon.mastery : undefined,
      range: range?.range ? `${range.range.normal}/${range.range.long} ft` : undefined,
      melee: !ranged,
      options,
    })
  }
  // An Unarmed Strike: 1 + STR (p.190), or a die in its place, with the
  // ability's modifier.
  const flat = computeOf('unarmed-strike-damage', baseContext(pb)) - abilities.str.modifier
  const unarmed = optioned('unarmed', 'str', String(flat))
  const rolled = unarmed.dice !== String(flat)
  const unarmedMod = { label: `${unarmed.ability.toUpperCase()} modifier`, value: abilities[unarmed.ability].modifier }
  const unarmedToHit = total([unarmedMod, { label: 'Proficiency', value: computeOf('unarmed-strike-attack-bonus', baseContext(pb)) - abilities.str.modifier }], ['attack:all', 'attack:unarmed', 'd20:all'], pb)
  const unarmedDamage = total(rolled ? [unarmedMod] : [{ label: 'Unarmed Strike', value: flat + unarmedMod.value }], ['damage:unarmed'], pb, undefined, unarmed.ability)
  unarmedDamage.notes.push(...unarmed.lapsed)
  attacks.push({
    id: 'unarmed',
    name: 'Unarmed Strike',
    ability: unarmed.ability,
    proficient: true,
    toHit: unarmedToHit,
    damage: { dice: rolled ? unarmed.dice : '', modifier: unarmedDamage.total, parts: unarmedDamage.parts, type: 'bludgeoning', notes: unarmedDamage.notes },
    properties: [],
    melee: true,
    options: unarmed.options,
  })

  // Carrying: Strength × the size's multiplier (Rules Glossary, Carrying
  // Capacity), against what the inventory and the coins weigh (fifty coins
  // to the pound, SRD p.89: playRules.carrying).
  const size = entity.species?.size ?? species?.sizes[0] ?? 'medium'
  const multiplier = rules.data.core.sizes.find((s) => s.id === size)?.carryingMultiplier ?? 15
  const coinCount = Object.values(entity.coins).reduce((n, c) => n + c, 0)
  const coinWeight = coinCount / rules.data.core.playRules!.carrying.coinsPerPound
  const carried = entity.inventory.reduce((n, i) => n + (i.weight ?? 0) * i.quantity, 0) + coinWeight

  const untrained = Boolean(armorRecord && !profs.armor.has(armorRecord.category))

  return {
    level,
    classes: ordered.map((e) => ({ classId: e.classId, name: rules.classes.get(e.classId)?.name ?? unresolved(e.classId), level: e.level, subclass: e.subclassId ? (rules.subclasses.get(e.subclassId)?.name ?? unresolved(e.subclassId)) : undefined })),
    proficiencyBonus: pb,
    abilities,
    saves,
    checks,
    skills,
    passivePerception: passive,
    initiative,
    ac,
    hp,
    hitDice,
    speed: { walk, other },
    size,
    spellcasting,
    castingBy,
    featureDcs,
    slots,
    pact,
    resources,
    senses: [...senseMap].map(([sense, s]) => ({ sense, ...s })),
    defenses: of('defense').map(({ effect, from }) => ({ defense: effect.defense, damageTypes: effect.damageTypes, from, when: holds(effect) ? undefined : effect.when })),
    conditionImmunities: of('conditionImmunity').map(({ effect, from }) => ({ conditions: effect.conditions, from, when: effect.when })),
    proficiencies: { armor: [...profs.armor], weapons: [...profs.weapon], tools: [...profs.tool], languages: [...profs.language] },
    weaponMasteries: masteries,
    attackCount: Math.max(1, ...of('attackCount').map((a) => a.effect.count)),
    critMin: Math.min(20, ...of('critRange').filter((a) => holds(a.effect)).map((a) => a.effect.min)),
    attacks,
    carrying: { capacity: score('str') * multiplier, carried, coins: coinWeight },
    armor: { worn: wornArmor?.name ?? wornMagicArmor?.name, shield, untrained },
    exhaustion: entity.exhaustion,
    features,
    choices,
    unmade: choices.filter((c) => !isMade(c)),
    effects,
  }
}

// "Level 7 · Fighter 5 / Rogue 2 · Wood Elf" (§3.3, the band and the list).
export function classSummary(sheet: Pick<Sheet, 'classes'>): string {
  return sheet.classes.map((c) => `${c.name} ${c.level}`).join(' / ')
}
