import { paragraphs } from '../play/rule-text.ts'
import { rollNotes, signed, working } from '../play/vitals.ts'
import type { Attack, Part, Sheet } from '../rules/derive.ts'
import type { GainedFeature } from '../rules/effects.ts'
import type { Ability } from '../rules/expr.ts'
import type { Rules } from '../rules/load.ts'
import type { Rule } from './RuleCard.tsx'

// What more than one window shows the same way: an attack's or a spell's
// damage formula (Attacks, the quick bar, an Opportunity Attack, a spell's
// window) and a feature's rule card (Features and traits, the Reactions band);
// and an ability's card, kept here so Abilities.tsx exports components only.

// The dice, then each part of the modifier on its own, so a bonus shows
// where it comes in: "1d8 + 4 + 2" while raging. named labels each part, for
// the roll log: "1d8 + 4 STR + 2 Rage". dice replaces the attack's own (a
// Critical Hit's doubled dice).
export function damageFormula(a: Attack, { named = false, dice = a.damage.dice }: { named?: boolean; dice?: string } = {}): string {
  return formulaOf(dice, a.damage.parts, named)
}

export function formulaOf(dice: string, all: readonly Part[], named = false): string {
  const parts = all.filter((p) => p.value)
  if (!dice && !parts.length) return '0'
  const terms = parts.map((p, i) => {
    const name = named ? ` ${partName(p.label)}` : ''
    if (!dice && i === 0) return `${p.value < 0 ? '−' : ''}${Math.abs(p.value)}${name}`
    return `${p.value < 0 ? '−' : '+'} ${Math.abs(p.value)}${name}`
  })
  return [dice, ...terms].filter(Boolean).join(' ')
}

// A part's short name: "STR modifier" as STR, "Barbarian 1: Rage" as Rage.
const partName = (label: string) => label.replace(/ modifier$/, '').replace(/^.*: /, '')

export function featureRule(g: Pick<GainedFeature, 'feature'>, sheet?: Pick<Sheet, 'featureDcs'>): Rule {
  const f = g.feature
  const dc = sheet && featureDc(sheet, f.id)
  const notes: string[] = []
  if (dc?.ruled) notes.push(dc.ruled)
  if (f.source.ref === 'srd-5.2.1') notes.push('From the SRD 5.2.1, under CC-BY-4.0.')
  if (f.confidence !== 'printed' && f.note) notes.push(f.note)
  return { title: f.name, text: [...paragraphs(f.text), ...(dc ? [dc.line] : [])], page: f.source.page, notes }
}

// A feature's own save DC, as its card and its use window say it: "Save DC
// 14: 8 + WIS modifier + Proficiency Bonus". ruled says so where the book
// prints no DC for the feature and the user ruled this one (Open Hand
// Technique, p.52).
export function featureDc(sheet: Pick<Sheet, 'featureDcs'>, featureId: string): { total: number; line: string; ruled?: string } | undefined {
  const d = sheet.featureDcs.find((x) => x.id === featureId) ?? sheet.featureDcs.find((x) => x.feature === featureId)
  if (!d) return undefined
  return {
    total: d.dc.total,
    line: `Save DC ${d.dc.total}: 8 + ${d.ability.toUpperCase()} modifier + Proficiency Bonus`,
    ruled: d.ruling ? 'The book prints no DC for this; the app uses this one, a house ruling.' : undefined,
  }
}

// An ability's card (Abilities and saves): the score, the check and the save
// with their working. Its notes are what bears on each roll without being
// added in, each said with the roll it is for: the check's (Powerful Build,
// to end the Grappled condition) as well as the save's (dam_d#8).
export function abilityWorking(sheet: Sheet, rules: Rules, id: Ability): Rule {
  const name = rules.data.core.abilities.find((a) => a.id === id)?.name ?? id
  const ability = sheet.abilities[id]
  const save = sheet.saves[id]
  return {
    title: `${name} ${ability.score}`,
    text: [
      `Score: ${ability.parts.map((p, i) => (i === 0 ? `${p.label} ${p.value}` : `${p.label} ${signed(p.value)}`)).join(', ')}. Modifier ${signed(ability.modifier)}.`,
      `${name} check ${signed(sheet.checks[id].total)}: ${working(sheet.checks[id].parts).join(', ')}.`,
      `${name} saving throw ${signed(save.total)}: ${working(save.parts).join(', ')}.${save.proficient ? '' : ' Not proficient.'}`,
    ],
    notes: [...rollNotes(sheet.checks[id]).map((n) => `${name} check: ${n}`), ...rollNotes(save).map((n) => `${name} saving throw: ${n}`)],
  }
}
