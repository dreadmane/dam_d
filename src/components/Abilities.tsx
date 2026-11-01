import { useState } from 'react'
import type { Ability } from '../rules/expr.ts'
import type { Sheet, Total } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import { signed } from '../play/vitals.ts'
import type { CharacterEntity } from '../save/types.ts'
import { abilityWorking } from './cards.ts'
import { ProficiencyMark } from './ProficiencyMark.tsx'
import { QuickRoll } from './QuickRoll.tsx'
import { RuleCard } from './RuleCard.tsx'
import { SheetSection } from './SheetSection.tsx'

// Abilities and saves (the spec §3.3, on the sheet): each ability's score
// and modifier, then two rolls, its check and its saving throw with the
// proficiency mark. The name opens the working (what makes the score and
// the save, §5.2); each roll's total opens the quick roll. The scores are
// set by the build or the ladder, never typed here.
export function AbilitiesSection({ sheet, rules, entity }: { sheet: Sheet; rules: Rules; entity: CharacterEntity }) {
  const [open, setOpen] = useState<Ability | null>(null)
  const [roll, setRoll] = useState<{ name: string; total: Total } | null>(null)
  return (
    <SheetSection id="abilities">
      <ul className="stat-list abilities-list">
        {rules.data.core.abilities.map((a) => {
          const id = a.id as Ability
          const ability = sheet.abilities[id]
          const save = sheet.saves[id]
          const check = sheet.checks[id]
          return (
            <li key={id} className="ability-row">
              <button type="button" className="ability-open" aria-haspopup="dialog" onClick={() => setOpen(id)}>
                <span className="stat-name">{a.name}</span>
                <span className="stat-score">
                  {ability.score} <span className="stat-mod">({signed(ability.modifier)})</span>
                </span>
              </button>
              <span className="ability-rolls">
                <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll a ${a.name} check, ${signed(check.total)}`} onClick={() => setRoll({ name: `${a.name} check`, total: check })}>
                  <span className="roll-label">Check</span> {signed(check.total)}
                </button>
                <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll a ${a.name} save, ${signed(save.total)}`} onClick={() => setRoll({ name: `${a.name} save`, total: save })}>
                  <ProficiencyMark level={save.proficient ? 1 : 0} />
                  <span className="roll-label">Save</span> {signed(save.total)}
                </button>
              </span>
            </li>
          )
        })}
      </ul>
      {open && <RuleCard rule={abilityWorking(sheet, rules, open)} onClose={() => setOpen(null)} />}
      {roll && <QuickRoll rules={rules} entity={entity} name={roll.name} total={roll.total} onClose={() => setRoll(null)} />}
    </SheetSection>
  )
}
