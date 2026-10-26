import { Fragment, useState, type ReactNode } from 'react'
import { activeToggles, switchToggle, toggleChoices } from '../play/kit.ts'
import { spendResource } from '../play/play.ts'
import { paragraphs } from '../play/rule-text.ts'
import { casterFor, pactSlots, scaledDice, slotLevels, type CastWith, type SpellRow } from '../play/spells.ts'
import { feetLeft, movementSteps, newTurn, setMode, spendPip, tapStep, togglePip, type Pip, type TurnState } from '../play/tracker.ts'
import { exploring, groupNames, outOfSlots, rowGroup, turnRows, TURN_GROUPS, type TurnGroup, type TurnRow } from '../play/turn.ts'
import { signed } from '../play/vitals.ts'
import type { Attack, Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { DamageWindow } from './Attacks.tsx'
import { damageFormula, featureDc } from './cards.ts'
import { useHudDialog } from './dialog.ts'
import { ProficiencyMark } from './ProficiencyMark.tsx'
import { QuickRoll } from './QuickRoll.tsx'
import { OpportunityWindow } from './Reactions.tsx'
import { goToSection } from './sections-nav.ts'
import { SheetSection } from './SheetSection.tsx'
import { SpellWindow } from './Spells.tsx'
import { useTurn } from './turn-store.ts'
import { Window, WindowHeader } from './Window.tsx'

// On your turn (the spec §3.3; the Adventurer's Journal's layout B, user
// 2026-10-20): first on the Journal's sheet. In combat, the tracker (the
// Action, Bonus Action and Reaction pips, movement in 5-foot steps, New
// turn), then what the character can do, grouped by the action it takes
// (play/turn.ts). Exploring, the checks the table asks for, the rituals
// and the utility spells. Every row opens the window its own section opens
// (the quick roll, the damage, the spell, the feature's rule), and a roll,
// a cast or a use from a row spends its group's pip. The tracker is app
// state on this device (components/turn-store.ts): it enforces nothing.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

const PIP_OF: Record<Exclude<TurnGroup, 'also'>, Pip> = { action: 'action', bonus: 'bonus', reaction: 'reaction' }

// The pip's short word on the tracker.
const PIP_WORD: Record<Pip, string> = { action: 'Action', bonus: 'Bonus', reaction: 'Reaction' }

// What the Action heading says of attacks: Extra Attack's count and a crit
// range below 20, which the Journal shows only here (its Attacks card is a
// menu).
const actionNote = (sheet: Sheet) => [sheet.attackCount > 1 && `The Attack action makes ${sheet.attackCount} attacks`, sheet.critMin < 20 && `Critical Hit on ${sheet.critMin}–20`].filter(Boolean).join(' · ')

type Open =
  | { kind: 'hit'; attack: Attack; group: Pip | null; reaction?: boolean }
  | { kind: 'damage'; attack: Attack }
  | { kind: 'spell'; row: SpellRow; group: Pip | null }
  | { kind: 'use'; row: Extract<TurnRow, { kind: 'feature' | 'resource' }>; group: Pip | null }
  | { kind: 'opportunity'; row: Extract<TurnRow, { kind: 'opportunity' }> }
  | { kind: 'actions'; row: Extract<TurnRow, { kind: 'actions' }> }
  | { kind: 'check'; skill: Sheet['skills'][number] }

export function TurnSection({ rosterId, rules, entity, sheet, update }: { rosterId: string; rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const [turn, change] = useTurn(rosterId)
  const [open, setOpen] = useState<Open | null>(null)
  const spend = (pip: Pip | null) => () => {
    if (pip) change((t) => spendPip(t, pip))
  }
  const close = () => setOpen(null)
  const combat = turn.mode === 'combat'
  return (
    <SheetSection id="turn" title={combat ? undefined : 'Exploring'} className="turn">
      <Tucked rules={rules} entity={entity} sheet={sheet} />
      <div className="turn-mode" role="group" aria-label="The sheet shows">
        <button type="button" aria-pressed={combat} onClick={() => change((t) => setMode(t, 'combat'))}>
          In combat
        </button>
        <button type="button" aria-pressed={!combat} onClick={() => change((t) => setMode(t, 'explore'))}>
          Exploring
        </button>
      </div>
      {combat ? <Combat rules={rules} entity={entity} sheet={sheet} turn={turn} change={change} onOpen={setOpen} /> : <Explore rules={rules} entity={entity} sheet={sheet} onOpen={setOpen} />}

      {open?.kind === 'hit' && <QuickRoll rules={rules} entity={entity} name={`${open.attack.name}, ${open.reaction ? 'Opportunity Attack' : 'to hit'}`} total={open.attack.toHit} attack critMin={sheet.critMin} onClose={close} onRolled={spend(open.group)} />}
      {open?.kind === 'damage' && <DamageWindow entity={entity} attack={open.attack} onClose={close} />}
      {open?.kind === 'spell' && (
        <SpellWindow rules={rules} entity={entity} sheet={sheet} row={open.row} update={update} onClose={close} onCast={(how: CastWith) => how.kind !== 'ritual' && spend(open.group)()} />
      )}
      {open?.kind === 'use' && <UseWindow sheet={sheet} entity={entity} row={open.row} update={update} onUsed={spend(open.group)} onClose={close} />}
      {open?.kind === 'opportunity' && <OpportunityWindow reaction={open.row.reaction} onHit={(a) => setOpen({ kind: 'hit', attack: a, group: 'reaction', reaction: true })} onDamage={(a) => setOpen({ kind: 'damage', attack: a })} onClose={close} />}
      {open?.kind === 'actions' && <ActionsWindow row={open.row} onClose={close} />}
      {open?.kind === 'check' && <QuickRoll rules={rules} entity={entity} name={`${open.skill.name} check`} total={open.skill} onClose={close} />}
    </SheetSection>
  )
}

// ---------------------------------------------------------------- tucked in

// The note tucked into the page: the conditions on the character, its
// Concentration and its Exhaustion, or that there are none. It goes to
// Conditions and effects, where they are changed.
//
// Each condition on the character is rubber-stamped on the note (the sheet
// concept's borrowing from direction C, user 2026-10-23): its name a stamp
// of its own (index.css draws it), the commas and the full stop between
// them kept for a screen reader but not drawn, so the note still reads
// "Poisoned, Prone." The rest of the note stays in the hand.
export function Tucked({ rules, entity, sheet }: { rules: Rules; entity: CharacterEntity; sheet: Sheet }) {
  const conditions = entity.conditions.map((c) => (c.conditionId ? (rules.conditions.get(c.conditionId)?.name ?? c.conditionId) : (c.custom?.name ?? 'Effect')))
  const effects = activeToggles(rules, entity, sheet).map((t) => t.name)
  const concentrating = entity.concentration ? (rules.spells.get(entity.concentration.spellId)?.name ?? entity.concentration.spellId) : null
  const rest = [
    concentrating ? `Concentrating on ${concentrating}.` : 'Not concentrating.',
    effects.filter((e) => e !== concentrating).length ? `On: ${effects.filter((e) => e !== concentrating).join(', ')}.` : '',
  ].filter(Boolean)
  // The words are handwritten; Exhaustion's level is a number, so it keeps
  // the body face (the hand token never sets a figure).
  return (
    <button type="button" className="turn-tucked" onClick={() => goToSection('conditions')}>
      <span className="turn-tucked-head">Tucked in</span>
      <span className="turn-tucked-text">
        {conditions.length
          ? conditions.map((name, i) => (
              <Fragment key={i}>
                <span className="condition-stamp">{name}</span>
                <span className="visually-hidden">{i < conditions.length - 1 ? ', ' : '.'}</span>
              </Fragment>
            ))
          : 'No conditions.'}
        {` ${rest.join(' ')}`}
      </span>
      {entity.exhaustion > 0 && <span className="turn-tucked-figure">Exhaustion {entity.exhaustion}</span>}
    </button>
  )
}

// ---------------------------------------------------------------- combat

function Combat({ rules, entity, sheet, turn, change, onOpen }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; turn: TurnState; change: (f: (t: TurnState) => TurnState) => void; onOpen: (o: Open) => void }) {
  const groups = turnRows(rules, entity, sheet)
  const names = groupNames(rules)
  const speed = sheet.speed.walk.total
  const steps = movementSteps(speed)
  return (
    <>
      <div className="turn-tracker">
        <div className="turn-tracker-head">
          <h3>This turn</h3>
          <button type="button" className="secondary turn-new" onClick={() => change(newTurn)}>
            New turn
          </button>
        </div>
        <div className="turn-pips">
          {(['action', 'bonus', 'reaction'] as const).map((pip) => (
            <button key={pip} type="button" className="turn-pip" data-used={turn[pip] || undefined} aria-pressed={turn[pip]} aria-label={`${names[pip]}: ${turn[pip] ? 'used' : 'not used'}`} onClick={() => change((t) => togglePip(t, pip))}>
              <span className="turn-diamond" aria-hidden="true" />
              {PIP_WORD[pip]}
            </button>
          ))}
        </div>
        {steps > 0 && (
          <>
            <p className="turn-move-line">
              <span>Movement</span>
              <span role="status">
                {feetLeft(turn, speed)} of {speed} ft left
              </span>
            </p>
            <div className="turn-steps" role="group" aria-label="Movement, 5 feet a step">
              {Array.from({ length: steps }, (_, i) => {
                const spent = turn.moved >= (i + 1) * 5
                return <button key={i} type="button" className="turn-step" data-used={spent || undefined} aria-pressed={spent} aria-label={`${(i + 1) * 5} feet moved`} onClick={() => change((t) => tapStep(t, i))} />
              })}
            </div>
          </>
        )}
      </div>
      <Casting sheet={sheet} entity={entity} />
      {TURN_GROUPS.map((g) => {
        const rows = groups[g]
        if (!rows.length) return null
        const used = g !== 'also' && turn[PIP_OF[g]]
        const note = g === 'also' ? 'Uses and switches with no action of their own' : used ? (g === 'reaction' ? 'Used until your next turn' : 'Used this turn') : g === 'reaction' ? 'One until your next turn' : g === 'action' ? actionNote(sheet) : ''
        return (
          <div key={g} className="turn-group" data-group={g} data-used={used || undefined}>
            <h3 className="turn-group-name">
              <span className="turn-diamond" aria-hidden="true" />
              {names[g]}
              {note && <span className="turn-group-note">{note}</span>}
            </h3>
            <RowList rules={rules} entity={entity} sheet={sheet} rows={rows} onOpen={onOpen} />
          </div>
        )
      })}
    </>
  )
}

// The slots left and the caster's numbers, which every spell row leans on.
function Casting({ sheet, entity }: { sheet: Sheet; entity: CharacterEntity }) {
  const slots = slotLevels(sheet, entity)
  const pact = pactSlots(sheet, entity)
  const caster = sheet.spellcasting[0]
  if (!caster && !slots.length && !pact) return null
  const all = [...slots.map((s) => ({ ...s, name: `Level ${s.level}`, short: String(s.level) })), ...(pact ? [{ ...pact, name: `Pact level ${pact.level}`, short: `P${pact.level}` }] : [])]
  return (
    <p className="turn-casting">
      {all.length > 0 && <span className="visually-hidden">Slots left: {all.map((s) => `${s.name}, ${s.left} of ${s.max}`).join('; ')}.</span>}
      {all.map((s) => (
        <span key={s.name} className="turn-slot-level" aria-hidden="true">
          <span className="turn-slot-name">{s.short}</span>
          {Array.from({ length: s.max }, (_, i) => (
            <span key={i} className="turn-slot" data-spent={i >= s.left || undefined} />
          ))}
        </span>
      ))}
      {caster && (
        <span className="turn-caster">
          DC {caster.saveDc.total} · {signed(caster.attack.total)}
        </span>
      )}
    </p>
  )
}

// How many spells a group shows before folding the rest: enough for a
// turn's usual choice, so the Bonus Action and the Reaction stay near.
const SPELLS_SHOWN = 5

function RowList({ rules, entity, sheet, rows, onOpen }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; rows: TurnRow[]; onOpen: (o: Open) => void }) {
  const spells = rows.filter((r) => r.kind === 'spell')
  const folded = new Set(spells.length > SPELLS_SHOWN + 1 ? spells.slice(SPELLS_SHOWN).map((r) => r.key) : [])
  const draw = (r: TurnRow) => <TurnRowView key={r.key} rules={rules} entity={entity} sheet={sheet} row={r} onOpen={onOpen} />
  const shown = rows.filter((r) => !folded.has(r.key))
  // The fold sits where the hidden spells would be, before the features.
  const at = shown.findIndex((r) => r.kind !== 'attack' && r.kind !== 'spell')
  const fold = folded.size > 0 && (
    <li key="fold">
      <details className="turn-fold">
        <summary>{folded.size} more spells</summary>
        <ul className="turn-rows">{rows.filter((r) => folded.has(r.key)).map(draw)}</ul>
      </details>
    </li>
  )
  return (
    <ul className="turn-rows">
      {at < 0 ? [...shown.map(draw), fold] : [...shown.slice(0, at).map(draw), fold, ...shown.slice(at).map(draw)]}
    </ul>
  )
}

const LEVEL = (n: number) => (n === 0 ? 'Cantrip' : `Level ${n}`)

function TurnRowView({ rules, entity, sheet, row, onOpen }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; row: TurnRow; onOpen: (o: Open) => void }) {
  const pip = rowGroup(row)
  switch (row.kind) {
    case 'attack': {
      const a = row.attack
      return (
        <li className="turn-row turn-row-split">
          <button type="button" className="turn-row-main" aria-haspopup="dialog" aria-label={`Roll ${a.name} to hit, ${signed(a.toHit.total)}`} onClick={() => onOpen({ kind: 'hit', attack: a, group: pip })}>
            <RowText name={a.name} detail={[a.range, a.mastery && `Mastery: ${a.mastery[0].toUpperCase()}${a.mastery.slice(1)}`, !a.proficient && 'not proficient'].filter(Boolean).join(' · ')} />
            <span className="turn-chip" data-strong="">
              {signed(a.toHit.total)}
            </span>
          </button>
          <button type="button" className="turn-damage" aria-haspopup="dialog" aria-label={`Roll ${a.name} damage, ${damageFormula(a)}`} onClick={() => onOpen({ kind: 'damage', attack: a })}>
            {damageFormula(a)} {a.damage.type}
          </button>
        </li>
      )
    }
    case 'spell': {
      const s = row.row.spell
      const caster = casterFor(sheet, row.row)
      const save = s.save && caster?.saveDc ? `${s.save.toUpperCase()} ${caster.saveDc.total}` : null
      const hit = s.attack && caster?.attack ? signed(caster.attack.total) : null
      const dmg = (s.damage as { dice: string; type?: string }[] | undefined)?.[0]
      const dice = dmg ? `${scaledDice(s, dmg.dice.replace(/\+.*$/, ''), s.level, sheet.level)}${dmg.dice.includes('+') ? dmg.dice.slice(dmg.dice.indexOf('+')) : ''}${dmg.type ? ` ${dmg.type}` : ''}` : null
      const empty = outOfSlots(rules, sheet, entity, row.row)
      const detail = [LEVEL(s.level), s.castingTime.unit === 'reaction' ? s.castingTime.reactionTrigger : s.range.text, s.duration.concentration && 'Concentration', empty && 'no slot left'].filter(Boolean).join(' · ')
      return (
        <li className="turn-row" data-spent={empty || undefined}>
          <button type="button" className="turn-row-main" aria-haspopup="dialog" onClick={() => onOpen({ kind: 'spell', row: row.row, group: pip })}>
            <RowText name={s.name} detail={detail} />
            <span className="turn-chip" data-strong={hit ? '' : undefined}>
              {hit ?? save ?? 'Cast'}
            </span>
            {dice && <span className="turn-dice">{dice}</span>}
          </button>
        </li>
      )
    }
    case 'feature':
    case 'resource': {
      const name = row.kind === 'feature' ? row.feature.name : row.resource.name
      const res = row.kind === 'resource' ? row.resource : row.cost ? sheet.resources.find((r) => r.key === row.cost!.key) : undefined
      const left = res ? res.max - res.used : null
      const toggle = row.kind === 'feature' ? row.toggle : undefined
      const chip = toggle ? (toggle.on ? 'On' : 'Off') : res ? `${left} of ${res.max}` : 'Use'
      const from = row.kind === 'feature' ? row.from : row.resource.from
      const dc = row.kind === 'feature' ? featureDc(sheet, row.feature.id) : undefined
      return (
        <li className="turn-row" data-spent={(left === 0 && !toggle?.on) || undefined}>
          <button type="button" className="turn-row-main" aria-haspopup="dialog" onClick={() => onOpen({ kind: 'use', row, group: pip })}>
            <RowText name={name} detail={dc ? `${from} · DC ${dc.total}` : from} />
            <span className="turn-chip">{chip}</span>
          </button>
        </li>
      )
    }
    case 'opportunity':
      return (
        <li className="turn-row">
          <button type="button" className="turn-row-main" aria-haspopup="dialog" onClick={() => onOpen({ kind: 'opportunity', row })}>
            <RowText name={row.reaction.name} detail={row.reaction.attacks.map((a) => a.name).join(', ') || row.reaction.detail} />
            {row.reaction.attacks[0] && (
              <span className="turn-chip" data-strong="">
                {signed(row.reaction.attacks[0].toHit.total)}
              </span>
            )}
          </button>
        </li>
      )
    case 'actions':
      return (
        <li className="turn-row">
          <button type="button" className="turn-row-main" aria-haspopup="dialog" onClick={() => onOpen({ kind: 'actions', row })}>
            <RowText name={row.actions.slice(0, 3).map((a) => a.name).join(' · ')} detail={`and the ${row.actions.length - 3} other actions anyone can take`} />
          </button>
        </li>
      )
  }
}

function RowText({ name, detail }: { name: ReactNode; detail?: ReactNode }) {
  return (
    <span className="turn-row-text">
      <span className="turn-row-name">{name}</span>
      {detail && <span className="turn-row-detail">{detail}</span>}
    </span>
  )
}

// A feature's or a resource's window: its rule, then what it does here:
// a switch (Rage), a use spent or given back, or, for a feature with no
// uses, Use it, which only spends the pip.
export function UseWindow({ sheet, entity, row, update, onUsed, onClose }: { sheet: Sheet; entity: CharacterEntity; row: Extract<TurnRow, { kind: 'feature' | 'resource' }>; update: Update; onUsed: () => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const [error, setError] = useState('')
  const name = row.kind === 'feature' ? row.feature.name : row.resource.name
  const res = row.kind === 'resource' ? row.resource : row.cost ? sheet.resources.find((r) => r.key === row.cost!.key) : undefined
  const toggle = row.kind === 'feature' ? row.toggle : undefined
  const feature = row.kind === 'feature' ? row.feature : null
  const dc = feature ? featureDc(sheet, feature.id) : undefined
  const left = res ? res.max - res.used : 0
  return (
    <Window dialog={dialog} className="slot-dialog" labelledBy="use-heading">
      <WindowHeader id="use-heading" title={name} />
      {res && (
        <p className="readout-line" role="status">
          {left} of {res.max} left · {res.from}
        </p>
      )}
      {error && (
        <p className="owed" role="alert">
          {error}
        </p>
      )}
      <div className="quick-choices">
        {toggle ? (
          toggleChoices(toggle).map((c) => (
            <button
              key={c.action}
              type="button"
              className="primary"
              aria-pressed={toggle.on}
              onClick={() => {
                const r = switchToggle(entity, toggle, c.action !== 'switch-off')
                if (!r.ok) return setError(r.error)
                update(() => r.entity)
                if (c.action !== 'switch-off') onUsed()
                dialog.close()
              }}
            >
              {c.label}
            </button>
          ))
        ) : res ? (
          <>
            <button
              type="button"
              className="primary"
              disabled={left === 0}
              onClick={() => {
                update((e) => spendResource(e, res.key, res.max, 1))
                onUsed()
              }}
            >
              Use one
            </button>
            <button type="button" className="secondary" disabled={res.used === 0} onClick={() => update((e) => spendResource(e, res.key, res.max, -1))}>
              Get one back
            </button>
          </>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={() => {
              onUsed()
              dialog.close()
            }}
          >
            Use it
          </button>
        )}
      </div>
      {feature && (
        <>
          {paragraphs(feature.text).map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          {dc && <p>{dc.line}</p>}
          {dc?.ruled && <p className="meta">{dc.ruled}</p>}
          <p className="meta">
            {feature.source.ref === 'srd-5.2.1' ? 'From the SRD 5.2.1, under CC-BY-4.0. ' : ''}p.{feature.source.page}
          </p>
          {feature.confidence !== 'printed' && feature.note && <p className="meta">{feature.note}</p>}
        </>
      )}
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}

// The actions anyone can take, each with the glossary's words, folded.
function ActionsWindow({ row, onClose }: { row: Extract<TurnRow, { kind: 'actions' }>; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  return (
    <Window dialog={dialog} className="slot-dialog" labelledBy="actions-heading">
      <WindowHeader id="actions-heading" title="Other actions" />
      {row.actions.map((a) => (
        <details key={a.id} className="spell-fold">
          <summary>{a.name}</summary>
          {paragraphs(a.text).map((p, i) => (
            <p key={i} className="meta">
              {p}
            </p>
          ))}
        </details>
      ))}
      <p className="meta">From the SRD 5.2.1's Rules Glossary, under CC-BY-4.0.</p>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}

// ---------------------------------------------------------------- exploring

function Explore({ rules, entity, sheet, onOpen }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; onOpen: (o: Open) => void }) {
  const e = exploring(rules, entity, sheet)
  const abilityName = (id: string) => rules.data.core.abilities.find((a) => a.id === id)?.name ?? id
  const spellRows = (rows: SpellRow[]) => (
    <ul className="turn-rows">
      {rows.map((r) => (
        <li key={r.spell.id} className="turn-row">
          <button type="button" className="turn-row-main" aria-haspopup="dialog" onClick={() => onOpen({ kind: 'spell', row: r, group: null })}>
            <RowText name={r.spell.name} detail={[LEVEL(r.spell.level), r.spell.castingTime.text.split(',')[0], r.spell.duration.text].join(' · ')} />
            <span className="turn-chip">Cast</span>
          </button>
        </li>
      ))}
    </ul>
  )
  return (
    <>
      <div className="turn-figures">
        <p className="turn-figure">
          <span className="turn-figure-label">Passive Perception</span>
          <span className="turn-figure-value">{sheet.passivePerception.total}</span>
        </p>
        <p className="turn-figure">
          <span className="turn-figure-label">Speed</span>
          <span className="turn-figure-value">{sheet.speed.walk.total} ft</span>
        </p>
      </div>
      {e.checks.length > 0 && (
        <div className="turn-group">
          <h3 className="turn-group-name">Checks you’ll be asked for</h3>
          <ul className="turn-rows">
            {e.checks.map((s) => (
              <li key={s.id} className="turn-row">
                <button type="button" className="turn-row-main" aria-haspopup="dialog" aria-label={`Roll ${s.name}, ${signed(s.total)}`} onClick={() => onOpen({ kind: 'check', skill: s })}>
                  <ProficiencyMark level={s.proficiency} />
                  <RowText name={s.name} detail={`${abilityName(s.ability)}${s.proficiency === 2 ? ' · Expertise' : ''}`} />
                  <span className="turn-chip" data-strong="">
                    {signed(s.total)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="meta">Every skill is under Skills.</p>
        </div>
      )}
      {e.rituals.length > 0 && (
        <div className="turn-group">
          <h3 className="turn-group-name">Rituals, no slot spent</h3>
          {spellRows(e.rituals)}
        </div>
      )}
      {e.utility.length > 0 && (
        <div className="turn-group">
          <h3 className="turn-group-name">Utility</h3>
          {spellRows(e.utility)}
        </div>
      )}
    </>
  )
}
