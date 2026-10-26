import { useState } from 'react'
import { showDice } from '../dice/app-tray.ts'
import { describePool } from '../dice/describe.ts'
import { rollFaces } from '../dice/roll.ts'
import { signed, working } from '../play/vitals.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import type { Attack, Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'
import { damageFormula } from './cards.ts'
import { useHudDialog } from './dialog.ts'
import { QuickRoll } from './QuickRoll.tsx'
import { RuleCard } from './RuleCard.tsx'
import { SheetSection } from './SheetSection.tsx'
import { Window, WindowHeader } from './Window.tsx'

// Attacks (the spec §3.2 and §3.3, on the sheet): every weapon carried and
// the Unarmed Strike, each with its to-hit and its damage. The name opens
// the working; the to-hit opens the quick roll; the damage rolls the
// weapon's dice plus the modifier, or, for a Critical Hit, the dice twice
// and the modifier once (SRD p.16, Critical Hits). The table resolves the
// hit; nothing is applied to anyone.

export function AttacksSection({ sheet, rules, entity }: { sheet: Sheet; rules: Rules; entity: CharacterEntity }) {
  const [open, setOpen] = useState<Attack | null>(null)
  const [hit, setHit] = useState<Attack | null>(null)
  const [damage, setDamage] = useState<Attack | null>(null)
  const notes = [sheet.attackCount > 1 && `The Attack action makes ${sheet.attackCount} attacks.`, sheet.critMin < 20 && `A Critical Hit on ${sheet.critMin}–20.`].filter(Boolean)
  return (
    <SheetSection id="attacks" count={String(sheet.attacks.length)}>
      {notes.length > 0 && <p className="meta">{notes.join(' ')}</p>}
      <ul className="stat-list">
        {sheet.attacks.map((a) => (
          <li key={a.id} className="attack-row">
            <button type="button" className="attack-open" aria-haspopup="dialog" onClick={() => setOpen(a)}>
              <span className="stat-name">{a.name}</span>
              <span className="stat-detail">{[a.range, a.mastery && `Mastery: ${a.mastery[0].toUpperCase()}${a.mastery.slice(1)}`, !a.proficient && 'not proficient'].filter(Boolean).join(' · ')}</span>
            </button>
            <span className="ability-rolls">
              <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll ${a.name} to hit, ${signed(a.toHit.total)}`} onClick={() => setHit(a)}>
                <span className="roll-label">Hit</span> {signed(a.toHit.total)}
              </button>
              <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll ${a.name} damage, ${damageFormula(a)}`} onClick={() => setDamage(a)}>
                {damageFormula(a)}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {open && (
        <RuleCard
          rule={{
            title: open.name,
            text: [
              `To hit ${signed(open.toHit.total)}: ${working(open.toHit.parts).join(', ')}.`,
              `Damage ${damageFormula(open)} ${open.damage.type}${open.properties.length ? `. Properties: ${open.properties.join(', ')}` : ''}.`,
              ...open.options.map((o) => `${o.text} (${o.from}).`),
              ...(open.bonusAction ? [`Also as a Bonus Action (${open.bonusAction}).`] : []),
              ...(open.grappleDc ? [`Grapple or Shove: save DC ${open.grappleDc.total}: ${working(open.grappleDc.parts).join(', ')}.`] : []),
            ],
            notes: [...open.toHit.notes, ...open.damage.notes].map((n) => `${n.text} (${n.from})`),
          }}
          onClose={() => setOpen(null)}
        />
      )}
      {hit && <QuickRoll rules={rules} entity={entity} name={`${hit.name}, to hit`} total={hit.toHit} attack critMin={sheet.critMin} onClose={() => setHit(null)} />}
      {damage && <DamageWindow entity={entity} attack={damage} onClose={() => setDamage(null)} />}
    </SheetSection>
  )
}

// "2d6" twice is "4d6": a Critical Hit's dice.
const doubled = (dice: string) => dice.replace(/^(\d*)d(\d+)$/, (_, n: string, s: string) => `${(Number(n) || 1) * 2}d${s}`)

export function DamageWindow({ entity, attack, onClose }: { entity: CharacterEntity; attack: Attack; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const record = useRecordRoll()
  const roll = (critical: boolean) => {
    const dice = attack.damage.dice ? (critical ? doubled(attack.damage.dice) : attack.damage.dice) : ''
    const r = dice ? rollFaces(dice) : { faces: [], total: 0 }
    const total = Math.max(0, r.total + attack.damage.modifier)
    const formula = damageFormula(attack, { named: true, dice })
    const described = describePool(`${attack.name}, ${critical ? 'Critical Hit damage' : 'damage'}`, formula, dice ? [dice] : [], { faces: r.faces, total }, `${total} ${attack.damage.type}`)
    dialog.close()
    showDice(described, { say: true, alone: true })
    record(entity, described)
  }
  return (
    <Window dialog={dialog} className="quick-roll" labelledBy="damage-heading">
      <WindowHeader id="damage-heading" title={`${attack.name} damage`} />
      <p className="meta">
        {damageFormula(attack)} {attack.damage.type}
      </p>
      {attack.damage.notes.map((n) => (
        <p key={n.from + n.text} className="meta">
          For the table: {n.text} ({n.from}).
        </p>
      ))}
      <div className="quick-choices">
        <button type="button" className="primary" onClick={() => roll(false)}>
          Roll damage
        </button>
        {attack.damage.dice && (
          <button type="button" className="secondary" onClick={() => roll(true)}>
            Critical Hit
          </button>
        )}
      </div>
    </Window>
  )
}
