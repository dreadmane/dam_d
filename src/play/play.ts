// Play at the table (the spec §3.2): rolling a d20 Test, taking damage and
// healing, temporary hit points, death saves, class resources and the two
// rests. Pure, so each rule is tested without React. Every number a rule
// prints is read from core.json's playRules (SRD pp.7-18, 185-187), never
// typed here; what this file decides is only how the app applies them.

import type { CheckRoll, Mode } from '../dice/describe.ts'
import { rollDie, type Random } from '../dice/roll.ts'
import type { Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'

const play = (rules: Rules) => rules.data.core.playRules!

// Advantage and Disadvantage (SRD p.7): any of either is one, and both
// together cancel. The table's own choice is one more reason.
export function rollMode(advantage: number, disadvantage: number, table: Mode = 'normal'): Mode {
  const a = advantage + (table === 'advantage' ? 1 : 0)
  const d = disadvantage + (table === 'disadvantage' ? 1 : 0)
  if (a && d) return 'normal'
  return a ? 'advantage' : d ? 'disadvantage' : 'normal'
}

// A d20 Test: one d20, or the rule's count of them under Advantage or
// Disadvantage, keeping the higher or the lower.
export function rollD20(rules: Rules, flat: number, mode: Mode, random?: Random): CheckRoll {
  const count = mode === 'normal' ? 1 : play(rules).advantage.dice
  const faces = Array.from({ length: count }, () => rollDie('1d20', random))
  const kept = mode === 'disadvantage' ? Math.min(...faces) : Math.max(...faces)
  return { faces, kept, total: kept + flat }
}

export interface DamageResult {
  entity: CharacterEntity
  // What happened, in order, for the preview and the flash.
  lines: string[]
  taken: number
}

// Damage (SRD p.17-18): Immunity, Resistance (halved, round down) and
// Vulnerability (doubled) for the type, each once however many grant it;
// then temporary hit points first, then hit points. At 0 HP, damage is a
// death save failure (two on a Critical Hit); damage left over when HP
// reaches 0 that equals the maximum or more is death (Massive Damage).
export function takeDamage(rules: Rules, entity: CharacterEntity, sheet: Sheet, amount: number, damageType: string | null, critical = false): DamageResult {
  const r = play(rules)
  const lines: string[] = []
  let n = Math.max(0, Math.floor(amount))
  if (damageType) {
    const has = (kind: string) => sheet.defenses.some((d) => d.defense === kind && !d.when && (d.damageTypes.includes(damageType as never) || d.damageTypes.includes('all' as never)))
    if (has('immunity')) {
      return { entity, lines: [`Immune to ${damageType}: no damage.`], taken: 0 }
    }
    if (has('resistance')) {
      n = Math.floor(n / r.damage.resistanceDivisor)
      lines.push(`Resistant to ${damageType}: halved to ${n}.`)
    }
    if (has('vulnerability')) {
      n = n * r.damage.vulnerabilityMultiplier
      lines.push(`Vulnerable to ${damageType}: doubled to ${n}.`)
    }
  }
  let { current, temp } = entity.hp
  let deathSaves = entity.deathSaves
  if (current === 0) {
    const failures = critical ? r.deathSaves.criticalFailures : r.deathSaves.damageFailures
    const dead = n >= sheet.hp.max || deathSaves.failures + failures >= r.deathSaves.toDie
    deathSaves = { ...deathSaves, failures: Math.min(r.deathSaves.toDie, deathSaves.failures + failures), ...(dead ? { dead: true } : {}) }
    lines.push(n >= sheet.hp.max ? `${n} damage at 0 HP, your maximum or more: you die.` : `Damage at 0 HP: ${failures} death save ${failures === 1 ? 'failure' : 'failures'}.`)
    return { entity: { ...entity, deathSaves }, lines, taken: n }
  }
  const fromTemp = Math.min(temp, n)
  if (fromTemp) lines.push(`Temp HP absorbs ${fromTemp}.`)
  temp -= fromTemp
  const left = n - fromTemp
  const fromHp = Math.min(current, left)
  current -= fromHp
  if (fromHp || !fromTemp) lines.push(`${fromHp} to HP.`)
  const remainder = left - fromHp
  if (current === 0) {
    if (r.damage.massiveDamage && remainder >= sheet.hp.max) {
      deathSaves = { successes: 0, failures: r.deathSaves.toDie, dead: true }
      lines.push(`${remainder} damage remains at 0 HP, your maximum or more: you die (Massive Damage).`)
    } else {
      deathSaves = { successes: 0, failures: 0 }
      lines.push('0 HP: Unconscious, making death saves.')
    }
  }
  // Unconscious is Incapacitated, which ends Concentration (SRD p.179), and
  // the spell's effects with it.
  const ends = current === 0 ? entity.concentration?.spellId : undefined
  const concentration = ends ? null : entity.concentration
  const toggles = ends ? Object.fromEntries(Object.entries(entity.toggles).filter(([id]) => id !== ends)) : entity.toggles
  if (ends) lines.push('Concentration ends.')
  return { entity: { ...entity, hp: { current, temp }, deathSaves, concentration, toggles }, lines, taken: n }
}

// Healing (SRD p.17): never past the maximum; any healing ends the death
// saves.
export function heal(entity: CharacterEntity, max: number, amount: number): CharacterEntity {
  if (entity.deathSaves.dead) return entity
  const current = Math.min(max, entity.hp.current + Math.max(0, Math.floor(amount)))
  return { ...entity, hp: { ...entity.hp, current }, deathSaves: { successes: 0, failures: 0 } }
}

// Temporary hit points (SRD p.18) don't stack: the higher is kept (the
// spec §3.2's reading of "you decide").
export function gainTemp(entity: CharacterEntity, amount: number): CharacterEntity {
  return { ...entity, hp: { ...entity.hp, temp: Math.max(entity.hp.temp, Math.max(0, Math.floor(amount))) } }
}

export type DeathSaveOutcome = 'success' | 'failure' | 'two failures' | 'regain 1 HP' | 'stable' | 'dead'

// A death save (SRD p.17): the d20's face against the rule's DC; a 1 is two
// failures, a 20 regains 1 HP. Three successes and the character is Stable,
// kept as three successes until HP is regained; three failures, dead.
export function deathSave(rules: Rules, entity: CharacterEntity, face: number): { entity: CharacterEntity; outcome: DeathSaveOutcome } {
  const r = play(rules).deathSaves
  const ds = entity.deathSaves
  if (face === 20) return { entity: { ...entity, hp: { ...entity.hp, current: r.naturalTwentyHp }, deathSaves: { successes: 0, failures: 0 } }, outcome: 'regain 1 HP' }
  if (face === 1) {
    const failures = Math.min(r.toDie, ds.failures + r.naturalOneFailures)
    return { entity: { ...entity, deathSaves: { ...ds, failures, ...(failures >= r.toDie ? { dead: true } : {}) } }, outcome: failures >= r.toDie ? 'dead' : 'two failures' }
  }
  if (face >= r.dc) {
    const successes = Math.min(r.toStabilize, ds.successes + 1)
    return { entity: { ...entity, deathSaves: { ...ds, successes } }, outcome: successes >= r.toStabilize ? 'stable' : 'success' }
  }
  const failures = Math.min(r.toDie, ds.failures + 1)
  return { entity: { ...entity, deathSaves: { ...ds, failures, ...(failures >= r.toDie ? { dead: true } : {}) } }, outcome: failures >= r.toDie ? 'dead' : 'failure' }
}

export const isStable = (rules: Rules, entity: CharacterEntity) => entity.hp.current === 0 && entity.deathSaves.successes >= play(rules).deathSaves.toStabilize

// A resource used (1) or regained (−1), within its maximum.
export function spendResource(entity: CharacterEntity, key: string, max: number, by: 1 | -1): CharacterEntity {
  const used = Math.max(0, Math.min(max, (entity.resourcesUsed[key] ?? 0) + by))
  return { ...entity, resourcesUsed: { ...entity.resourcesUsed, [key]: used } }
}

// One Hit Point Die spent on a Short Rest (SRD p.187): its roll plus the
// Constitution modifier, at least the rule's minimum.
export function spendHitDie(rules: Rules, entity: CharacterEntity, sheet: Sheet, die: number, roll: number): { entity: CharacterEntity; healed: number } {
  const pool = sheet.hitDice.find((h) => h.die === die)
  if (!pool || pool.spent >= pool.count) return { entity, healed: 0 }
  const healed = Math.max(play(rules).shortRest.hitDieMinimum, roll + sheet.abilities.con.modifier)
  const spent = { ...entity.hitDiceSpent, [`d${die}`]: pool.spent + 1 }
  const next = heal({ ...entity, hitDiceSpent: spent }, sheet.hp.max, healed)
  return { entity: next, healed: next.hp.current - entity.hp.current }
}

// What a rest brings back: the resources that recharge on it (a Short
// Rest's also come back on a Long Rest, common.schema.json's recharge).
function recharge(sheet: Sheet, entity: CharacterEntity, long: boolean): CharacterEntity['resourcesUsed'] {
  const used = { ...entity.resourcesUsed }
  for (const r of sheet.resources) {
    if (r.recharge === 'short-rest' || (long && (r.recharge === 'long-rest' || r.recharge === 'dawn'))) delete used[r.key]
  }
  return used
}

// A Short Rest's end (SRD p.187): the Hit Point Dice spent during it are
// already counted; the resources that recharge on a Short Rest come back.
export function finishShortRest(entity: CharacterEntity, sheet: Sheet): CharacterEntity {
  return { ...entity, resourcesUsed: recharge(sheet, entity, false), pactSlotsExpended: 0 }
}

// A Long Rest's end (SRD p.185): all HP and every Hit Point Die, temporary
// HP gone, Exhaustion down by the rule's step, every slot and resource back.
export function finishLongRest(rules: Rules, entity: CharacterEntity, sheet: Sheet): CharacterEntity {
  const r = play(rules).longRest
  return {
    ...entity,
    hp: { current: sheet.hp.max, temp: r.tempHpLost ? 0 : entity.hp.temp },
    hitDiceSpent: r.allHitDice ? {} : entity.hitDiceSpent,
    deathSaves: { successes: 0, failures: 0 },
    exhaustion: Math.max(0, entity.exhaustion - r.exhaustionReduction),
    slotsExpended: {},
    pactSlotsExpended: 0,
    resourcesUsed: recharge(sheet, entity, true),
  }
}

// What a resource's partial recharge says (Second Wind's "regain one
// expended use when you finish a Short Rest"), shown at a Short Rest for the
// player to apply, since the data keeps it as text.
export const partialRecharges = (sheet: Sheet) =>
  sheet.effects.flatMap((a) => (a.effect.type === 'resource' && a.effect.rechargePartial ? [{ name: a.effect.name, text: a.effect.rechargePartial }] : []))
