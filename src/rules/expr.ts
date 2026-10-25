// Evaluates the rules data's compute trees (dnd-rules common.schema.json,
// expression). Every printed formula the data can say is one of these, so the
// app's arithmetic for it lives in the data, not here: this file only knows
// what each node means.

import type { Expression } from './types.ts'

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
export const ABILITIES: readonly Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export interface ExprContext {
  score: (ability: Ability) => number
  // The class whose feature this is, for `self`, and its spellcasting
  // ability, for abilityMod spellcasting.
  self?: string
  spellcasting?: Ability
  proficiencyBonus: number
  level: number
  classLevel: (classId: string) => number
  // A features-table cell at the class's current level. A "—" cell, or a
  // class the character lacks, is absent.
  classColumn: (classId: string, column: string) => number | string | undefined
}

// floor((score − 10) / 2): the SRD's Ability Modifiers table, rounded down
// (p.5). derivations.json's ability-modifier records it and a test checks it
// against every row of core.json's table.
export const modifier = (score: number) => Math.floor((score - 10) / 2)

export function evaluate(expr: Expression, ctx: ExprContext): number | string {
  const self = (c: string) => (c === 'self' ? (ctx.self ?? '') : c)
  const num = (e: Expression) => toNumber(evaluate(e, ctx))
  switch (expr.type) {
    case 'constant':
      return expr.value
    case 'abilityScore':
      return ctx.score(expr.ability)
    case 'abilityMod': {
      const ability = expr.ability === 'spellcasting' ? ctx.spellcasting : expr.ability
      return ability ? modifier(ctx.score(ability)) : 0
    }
    case 'proficiencyBonus':
      return ctx.proficiencyBonus
    case 'level':
      return ctx.level
    case 'classLevel':
      return ctx.classLevel(self(expr.class))
    case 'classColumn':
      return ctx.classColumn(self(expr.class), expr.column) ?? 0
    case 'byLevel': {
      const level = expr.of === 'character' ? ctx.level : ctx.classLevel(ctx.self ?? '')
      let value: number | string = 0
      for (const step of expr.steps) if (step.level <= level) value = step.value
      return value
    }
    case 'sum':
      return expr.terms.reduce((total, t) => total + num(t), 0)
    case 'product':
      return expr.terms.reduce((total, t) => total * num(t), 1)
    case 'max':
      return Math.max(...expr.terms.map(num))
    case 'min':
      return Math.min(...expr.terms.map(num))
    case 'floorDiv':
      return Math.floor(num(expr.of) / expr.by)
  }
}

// A table cell or a step can be text ("—", "1d6", "+2"). As a number, "+2"
// is 2 and anything else that isn't one is 0.
export function toNumber(value: number | string | undefined): number {
  if (typeof value === 'number') return value
  if (value === undefined) return 0
  const n = Number(value.replace(/^\+/, ''))
  return Number.isFinite(n) ? n : 0
}

export const evaluateNumber = (expr: number | Expression, ctx: ExprContext) => (typeof expr === 'number' ? expr : toNumber(evaluate(expr, ctx)))
