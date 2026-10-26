import { useState } from 'react'
import { showDice } from '../dice/app-tray.ts'
import { describeRoll } from '../dice/describe.ts'
import { rollFaces } from '../dice/roll.ts'
import { finishLongRest, finishShortRest, partialRecharges, spendHitDie, spendResource } from '../play/play.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import { groupNames, resourceRow, rowGroup } from '../play/turn.ts'
import type { Resource, Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { LONG_REST_NOTHING } from '../voice.ts'
import { useHudDialog } from './dialog.ts'
import { SheetSection } from './SheetSection.tsx'
import { UseWindow } from './Turn.tsx'
import { Window, WindowHeader } from './Window.tsx'

// Class resources and Rest (the spec §3.2): Crawler Interface's Abilities
// to track, with counts. A resource reads "2 of 2 left" beside a box per
// use; tapping an open box spends one and a spent box regains it. Rest
// opens a Short or a Long Rest's window: the Short Rest spends Hit Point
// Dice one at a time on the app's dice, then brings back what a Short Rest
// does; the Long Rest previews what it restores. Each offers Undo after
// (Crawler Interface's Rest).

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

const RECHARGE: Record<string, string> = { 'short-rest': 'Short or Long Rest', 'long-rest': 'Long Rest', dawn: 'dawn', turn: 'each turn', special: 'see the feature', never: 'not restored' }

// Each resource's name opens the turn's window for it (the play audit's
// recommendation 9): its feature's rule, its uses, Use one and Get one back.
// Spent from here it marks no pip: this list is not the turn. Its action
// type, where its feature has one, is in its detail.
export function ResourcesSection({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const [open, setOpen] = useState<Resource | null>(null)
  const names = groupNames(rules)
  return (
    <SheetSection id="resources" count={String(sheet.resources.length)}>
      {sheet.resources.length === 0 && <p className="meta">No limited uses yet.</p>}
      <ul className="stat-list">
        {sheet.resources.map((r) => {
          const left = r.max - r.used
          return (
            <li key={r.key} className="resource-row">
              <button type="button" className="rule-name stat-name" aria-haspopup="dialog" onClick={() => setOpen(r)}>
                <span className="rule-name-label">{r.name}</span>
                <span aria-hidden="true" className="rule-name-mark">
                  ⓘ
                </span>
              </button>
              <span className="resource-boxes" role="group" aria-label={`${r.name}: ${left} of ${r.max} left`}>
                {Array.from({ length: r.max }, (_, i) => {
                  const spent = i >= left
                  return (
                    <button
                      key={i}
                      type="button"
                      className="resource-box"
                      data-spent={spent || undefined}
                      aria-label={spent ? `Regain one ${r.name}` : `Spend one ${r.name}`}
                      onClick={() => update((e) => spendResource(e, r.key, r.max, spent ? -1 : 1))}
                    />
                  )
                })}
              </span>
              <span className="stat-detail">
                {[`${left} of ${r.max} left`, RECHARGE[r.recharge] ?? r.recharge, actionOf(r)].filter(Boolean).join(' · ')}
              </span>
            </li>
          )
        })}
      </ul>
      {open && <UseWindow sheet={sheet} entity={entity} row={resourceRow(rules, entity, sheet, open)} update={update} onUsed={() => {}} onClose={() => setOpen(null)} />}
    </SheetSection>
  )

  function actionOf(r: Resource): string | undefined {
    const group = rowGroup(resourceRow(rules, entity, sheet, r))
    return group ? names[group] : undefined
  }
}

export function RestSection({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const [open, setOpen] = useState<'short' | 'long' | null>(null)
  // The character before the last rest, for Undo, until the next one.
  const [before, setBefore] = useState<{ kind: string; entity: CharacterEntity } | null>(null)
  const down = entity.hp.current === 0
  return (
    <SheetSection id="rest">
      <p className="meta">
        Hit Point Dice: {sheet.hitDice.map((h) => `${h.count - h.spent} of ${h.count} d${h.die}`).join(', ') || 'none'}.
      </p>
      {down && <p className="meta">A rest needs at least 1 HP (SRD pp.185, 187).</p>}
      <div className="actions">
        <button type="button" className="secondary" aria-haspopup="dialog" disabled={down} onClick={() => (setBefore({ kind: 'Short Rest', entity }), setOpen('short'))}>
          Short Rest
        </button>
        <button type="button" className="secondary" aria-haspopup="dialog" disabled={down} onClick={() => setOpen('long')}>
          Long Rest
        </button>
        {before && (
          <button type="button" className="secondary" onClick={() => (update(() => before.entity), setBefore(null))}>
            Undo the {before.kind}
          </button>
        )}
      </div>
      {open === 'short' && (
        <ShortRestWindow rules={rules} entity={entity} sheet={sheet} update={update} onClose={() => setOpen(null)} />
      )}
      {open === 'long' && (
        <LongRestWindow
          rules={rules}
          entity={entity}
          sheet={sheet}
          onFinish={() => {
            setBefore({ kind: 'Long Rest', entity })
            update((e) => finishLongRest(rules, e, sheet))
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </SheetSection>
  )
}

function ShortRestWindow({ rules, entity, sheet, update, onClose }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  const record = useRecordRoll()
  const [said, setSaid] = useState<string[]>([])
  const spend = (die: number) => {
    const notation = `1d${die}`
    const r = rollFaces(notation)
    const described = describeRoll(`Hit Point Die, d${die}`, notation, r)
    showDice(described)
    record(entity, described)
    const out = spendHitDie(rules, entity, sheet, die, r.total)
    update(() => out.entity)
    setSaid((s) => [...s, `d${die}: rolled ${r.total}, ${out.healed} HP back.`])
  }
  const partial = partialRecharges(sheet)
  const comesBack = sheet.resources.filter((r) => r.recharge === 'short-rest' && r.used > 0)
  return (
    <Window dialog={dialog} labelledBy="short-heading">
      <WindowHeader id="short-heading" title="Short Rest" />
      <p>
        HP <b>{entity.hp.current} / {sheet.hp.max}</b>. Spend Hit Point Dice one at a time: each heals its roll plus your Constitution modifier.
      </p>
      <div className="actions">
        {sheet.hitDice.map((h) => (
          <button key={h.die} type="button" className="secondary" disabled={h.spent >= h.count || entity.hp.current >= sheet.hp.max} onClick={() => spend(h.die)}>
            Spend a d{h.die} ({h.count - h.spent} left)
          </button>
        ))}
      </div>
      {said.length > 0 && (
        <p className="meta rest-said" role="status">
          {said.join(' ')}
        </p>
      )}
      <p className="meta">
        Finishing brings back: {comesBack.map((r) => r.name).join(', ') || 'no resource of yours'}
        {partial.length > 0 && `. By hand, if the feature allows: ${partial.map((p) => `${p.name} (${p.text.toLowerCase()})`).join('; ')}`}.
      </p>
      <div className="dialog-actions">
        <button type="button" className="primary" onClick={() => (update((e) => finishShortRest(e, sheet)), dialog.close())}>
          Finish the Short Rest
        </button>
      </div>
    </Window>
  )
}

function LongRestWindow({ rules, entity, sheet, onFinish, onClose }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; onFinish: () => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const after = finishLongRest(rules, entity, sheet)
  const spentDice = Object.values(entity.hitDiceSpent).reduce((n, d) => n + d, 0)
  const lines = [
    entity.hp.current < sheet.hp.max && `HP ${entity.hp.current} → ${sheet.hp.max}`,
    entity.hp.temp > 0 && `Temp HP ${entity.hp.temp} → 0`,
    spentDice > 0 && `${spentDice} Hit Point ${spentDice === 1 ? 'Die' : 'Dice'} back`,
    entity.exhaustion > 0 && `Exhaustion ${entity.exhaustion} → ${after.exhaustion}`,
    Object.values(entity.slotsExpended).some((n) => n) && 'Every spell slot back',
    ...sheet.resources.filter((r) => r.used > 0 && r.recharge !== 'never' && r.recharge !== 'special').map((r) => `${r.name} ${r.max - r.used} → ${r.max}`),
  ].filter(Boolean) as string[]
  return (
    <Window dialog={dialog} labelledBy="long-heading">
      <WindowHeader id="long-heading" title="Long Rest" />
      {lines.length ? (
        <ul>
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : (
        <p>{LONG_REST_NOTHING}</p>
      )}
      <div className="dialog-actions">
        <button type="button" className="primary" onClick={() => (onFinish(), dialog.close())}>
          Finish the Long Rest
        </button>
      </div>
    </Window>
  )
}
