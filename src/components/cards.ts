import { paragraphs } from '../play/rule-text.ts'
import type { Attack } from '../rules/derive.ts'
import type { GainedFeature } from '../rules/effects.ts'
import type { Rule } from './RuleCard.tsx'

// What more than one window shows the same way: an attack's damage formula
// (Attacks, the quick bar, an Opportunity Attack) and a feature's rule card
// (Features and traits, the Reactions band).

// The dice, then each part of the modifier on its own, so a bonus shows
// where it comes in: "1d8 + 4 + 2" while raging. named labels each part, for
// the roll log: "1d8 + 4 STR + 2 Rage". dice replaces the attack's own (a
// Critical Hit's doubled dice).
export function damageFormula(a: Attack, { named = false, dice = a.damage.dice }: { named?: boolean; dice?: string } = {}): string {
  const parts = a.damage.parts.filter((p) => p.value)
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

export function featureRule(g: Pick<GainedFeature, 'feature'>): Rule {
  const f = g.feature
  const notes: string[] = []
  if (f.source.ref === 'srd-5.2.1') notes.push('From the SRD 5.2.1, under CC-BY-4.0.')
  if (f.confidence !== 'printed' && f.note) notes.push(f.note)
  return { title: f.name, text: paragraphs(f.text), page: f.source.page, notes }
}
