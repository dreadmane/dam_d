import type { OwedChoice } from '../rules/level.ts'
import { isMade } from '../rules/level.ts'
import type { Ability } from '../rules/expr.ts'
import type { Rules } from '../rules/load.ts'
import { unresolved } from '../rules/unresolved.ts'

// A rung's choices as chips, shared by the ladder and the build's Level 1
// step. A pick the rules make has no chip.

const ABILITY_NAMES: Record<Ability, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }
const ABILITY_SHORT: Record<Ability, string> = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' }

// A rung's choices as chips: made ones say what was picked, the rest say
// what is owed, in the accent and in words.
export function Choices({ list, onOpen, rules }: { list: OwedChoice[]; onOpen: (o: OwedChoice) => void; rules: Rules }) {
  return (
    <>
      {/* A pick the rules make (a background's feat naming its spell list)
          is the rules', not the player's, so it has no chip. */}
      {list.filter((o) => !o.fixed).map((o) => {
        const made = isMade(o)
        return (
          <button key={`${o.source}/${o.choice}`} type="button" className={`chip${made ? '' : ' chip-todo'}`} aria-haspopup="dialog" onClick={() => onOpen(o)}>
            {chipLabel(o)} · {made ? pickedLabel(rules, o) : o.count > 1 ? `${o.made?.values.length ?? 0} of ${o.count}` : 'choose'}
          </button>
        )
      })}
    </>
  )
}

// A chip's name: the feature or trait that asks, except where one trait asks
// twice (Elven Lineage: the lineage, then its spellcasting ability).
const chipLabel = (o: OwedChoice) => {
  if (o.choice === 'class-skills') return 'Skills'
  if (o.increase) return 'Ability increase'
  if (o.grants === 'spellbook') return 'Spellbook'
  // A choice named after its feature or trait, past the feature's own id,
  // says which part of it this is (Magic Initiate's cantrips, its level 1
  // spell, its ability).
  if (o.choice.startsWith(`${o.origin.id}-`)) return `${o.origin.name} ${o.choice.slice(o.origin.id.length + 1).replace(/-/g, ' ')}`
  return o.kind === 'ability' && o.grants !== 'lineage' ? `${o.origin.name} ability` : o.origin.name
}

function pickedLabel(rules: Rules, o: OwedChoice): string {
  if (o.increase) {
    return Object.entries(o.made?.increases ?? {})
      .filter(([, n]) => n)
      .map(([a, n]) => `+${n} ${ABILITY_SHORT[a as Ability]}`)
      .join(', ')
  }
  return (o.made?.values ?? [])
    .map((v) => {
      const id = v.replace(/^classes:/, '')
      // A feat the rules lack, kept by an import, by name and marked.
      return ABILITY_NAMES[id as Ability] ?? rules.feats.get(id)?.name ?? rules.skills.get(id)?.name ?? rules.weapons.get(id)?.name ?? rules.spells.get(id)?.name ?? rules.classes.get(id)?.name ?? lineageName(rules, id) ?? optionName(rules, o, id) ?? (o.grants === 'feat' ? unresolved(id) : id)
    })
    .join(', ')
}

const lineageName = (rules: Rules, id: string) => rules.data.species.species.flatMap((s) => s.lineages?.options ?? []).find((l) => l.id === id)?.name
const optionName = (rules: Rules, o: OwedChoice, id: string) => (o.classId ? rules.classes.get(o.classId)?.optionLists?.flatMap((l) => l.options).find((x) => x.id === id)?.name : undefined)

