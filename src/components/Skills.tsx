import { useState } from 'react'
import type { Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import { rollNotes, signed, working } from '../play/vitals.ts'
import type { CharacterEntity } from '../save/types.ts'
import { ProficiencyMark } from './ProficiencyMark.tsx'
import { QuickRoll } from './QuickRoll.tsx'
import { RuleCard, type Rule } from './RuleCard.tsx'
import { SheetSection } from './SheetSection.tsx'

// Skills (the spec §3.3, on the sheet): D&D's 18 skills grouped by ability,
// each with its proficiency mark and total, then Passive Perception, a figure
// never rolled. A skill's name opens its working (§5.2) and its total the
// quick roll. No advancement marks (the inventory §2).
export function SkillsSection({ sheet, rules, entity }: { sheet: Sheet; rules: Rules; entity: CharacterEntity }) {
  const [open, setOpen] = useState<string | null>(null)
  const [roll, setRoll] = useState<string | null>(null)
  const rolling = roll ? sheet.skills.find((s) => s.id === roll) : undefined
  const groups = rules.data.core.abilities
    .map((a) => ({ ability: a, skills: sheet.skills.filter((s) => s.ability === a.id) }))
    .filter((g) => g.skills.length > 0)
  const skill = open && open !== 'passive' ? sheet.skills.find((s) => s.id === open) : undefined
  return (
    <SheetSection id="skills">
      {groups.map(({ ability, skills }) => (
        <div key={ability.id} className="skill-group">
          <h3 className="skill-group-name">{ability.name}</h3>
          <ul className="stat-list">
            {skills.map((s) => (
              <li key={s.id} className="skill-roll-row">
                <button type="button" className="stat-row skill-row" aria-haspopup="dialog" onClick={() => setOpen(s.id)}>
                  <ProficiencyMark level={s.proficiency} />
                  <span className="stat-name">{s.name}</span>
                </button>
                <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll ${s.name}, ${signed(s.total)}`} onClick={() => setRoll(s.id)}>
                  {signed(s.total)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ul className="stat-list passive-list">
        <li>
          <button type="button" className="stat-row skill-row" aria-haspopup="dialog" onClick={() => setOpen('passive')}>
            <span aria-hidden="true" />
            <span className="stat-name">Passive Perception</span>
            <span className="stat-value">{sheet.passivePerception.total}</span>
          </button>
        </li>
      </ul>
      {skill && <RuleCard rule={skillWorking(skill)} onClose={() => setOpen(null)} />}
      {rolling && <QuickRoll rules={rules} entity={entity} name={`${rolling.name} check`} total={rolling} onClose={() => setRoll(null)} />}
      {open === 'passive' && (
        <RuleCard
          rule={{ title: `Passive Perception ${sheet.passivePerception.total}`, text: working(sheet.passivePerception.parts).join(', '), notes: rollNotes(sheet.passivePerception), page: rules.data.derivations.derivations.find((d) => d.id === 'passive-perception')?.source.page }}
          onClose={() => setOpen(null)}
        />
      )}
    </SheetSection>
  )
}

function skillWorking(s: Sheet['skills'][number]): Rule {
  return {
    title: `${s.name} ${signed(s.total)}`,
    text: `${working(s.parts).join(', ')}.${s.proficiency ? '' : ' Not proficient.'}`,
    notes: rollNotes(s),
  }
}
