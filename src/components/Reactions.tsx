import { useState } from 'react'
import { canReact, reactions, type Reaction } from '../play/kit.ts'
import { paragraphs } from '../play/rule-text.ts'
import type { SpellRow } from '../play/spells.ts'
import { signed } from '../play/vitals.ts'
import type { Attack, Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { Feature } from '../rules/types.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { DamageWindow } from './Attacks.tsx'
import { damageFormula, featureRule } from './cards.ts'
import { useHudDialog } from './dialog.ts'
import { QuickRoll } from './QuickRoll.tsx'
import { RuleCard } from './RuleCard.tsx'
import { SpellWindow } from './Spells.tsx'
import { Window, WindowHeader } from './Window.tsx'

// The Reactions band (the spec §3.3): Crawler Interface's Interrupts zone
// at the foot of the screen, where the thumb is, as D&D's Reactions. An
// Opportunity Attack always; then the character's reaction spells (Shield,
// Counterspell) and features (Uncanny Dodge). Every one is a button: the
// Opportunity Attack opens the melee attacks to roll, a spell its window,
// a feature its rule. Its heading folds it to one line. The band hides
// while the character can't take a Reaction (play/kit.ts canReact).

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

export function ReactionsBand({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const [shown, setShown] = useState(true)
  const [open, setOpen] = useState<Reaction | null>(null)
  const [hit, setHit] = useState<Attack | null>(null)
  const [damage, setDamage] = useState<Attack | null>(null)
  if (!canReact(entity)) return null
  const list = reactions(rules, entity, sheet)
  return (
    <aside className="interrupts reactions hud-frame" aria-labelledby="reactions-heading">
      <div className="hud-inner">
        <div className="interrupts-head">
          <h2 id="reactions-heading">
            <button type="button" className="interrupts-toggle" aria-expanded={shown} aria-controls="reactions-list" onClick={() => setShown(!shown)}>
              Reactions
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path fill="currentColor" d={shown ? 'M7 10l5 5 5-5z' : 'M7 14l5-5 5 5z'} />
              </svg>
            </button>
          </h2>
          <p className="interrupts-note">One, then none until your next turn starts</p>
        </div>
        <ul id="reactions-list" hidden={!shown}>
          {list.map((r) => (
            <li key={`${r.kind}:${r.name}`}>
              <button type="button" className="interrupt-button" aria-haspopup="dialog" onClick={() => setOpen(r)}>
                <span className="interrupt-name">{r.name}</span>
                <span className="interrupt-detail">{r.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open?.kind === 'opportunity' && <OpportunityWindow reaction={open} onHit={setHit} onDamage={setDamage} onClose={() => setOpen(null)} />}
      {open?.kind === 'spell' && <ReactionSpell rules={rules} entity={entity} sheet={sheet} row={open.row} update={update} onClose={() => setOpen(null)} />}
      {open?.kind === 'feature' && <ReactionFeature feature={open.feature} entity={entity} onClose={() => setOpen(null)} />}
      {hit && <QuickRoll rules={rules} entity={entity} name={`${hit.name}, Opportunity Attack`} total={hit.toHit} attack critMin={sheet.critMin} onClose={() => setHit(null)} />}
      {damage && <DamageWindow entity={entity} attack={damage} onClose={() => setDamage(null)} />}
    </aside>
  )
}

const ReactionSpell = (p: { rules: Rules; entity: CharacterEntity; sheet: Sheet; row: SpellRow; update: Update; onClose: () => void }) => <SpellWindow {...p} />

const ReactionFeature = ({ feature, entity, onClose }: { feature: Feature; entity: CharacterEntity; onClose: () => void }) => <RuleCard rule={featureRule({ feature })} entity={entity} onClose={onClose} />

// The Opportunity Attack: its rule, then each melee attack with its rolls.
export function OpportunityWindow({ reaction, onHit, onDamage, onClose }: { reaction: Extract<Reaction, { kind: 'opportunity' }>; onHit: (a: Attack) => void; onDamage: (a: Attack) => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  return (
    <Window dialog={dialog} className="slot-dialog" labelledBy="opportunity-heading">
      <WindowHeader id="opportunity-heading" title={reaction.name} />
      {paragraphs(reaction.rule).map((p, i) => (
        <p key={i} className="meta">
          {p}
        </p>
      ))}
      <ul className="stat-list">
        {reaction.attacks.map((a) => (
          <li key={a.id} className="attack-row">
            <span className="stat-name">{a.name}</span>
            <span className="ability-rolls">
              <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll ${a.name} to hit, ${signed(a.toHit.total)}`} onClick={() => dialog.closeThen(() => onHit(a))}>
                <span className="roll-label">Hit</span> {signed(a.toHit.total)}
              </button>
              <button type="button" className="roll-button" aria-haspopup="dialog" aria-label={`Roll ${a.name} damage, ${damageFormula(a)}`} onClick={() => dialog.closeThen(() => onDamage(a))}>
                {damageFormula(a)}
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}
