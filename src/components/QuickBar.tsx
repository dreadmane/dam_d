import { useState } from 'react'
import { deviceStore, useDeviceStore } from './device-store.ts'
import { BAR_GROUPS, barCandidates, barSlots, setBarSlot, switchToggle, toggleChoices, type BarEntry, type BarSlot } from '../play/kit.ts'
import { spendResource } from '../play/play.ts'
import { paragraphs } from '../play/rule-text.ts'
import type { SpellRow } from '../play/spells.ts'
import { signed } from '../play/vitals.ts'
import type { Attack, Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { DamageWindow } from './Attacks.tsx'
import { damageFormula } from './cards.ts'
import { useHudDialog } from './dialog.ts'
import { QuickRoll } from './QuickRoll.tsx'
import { SheetSection } from './SheetSection.tsx'
import { SpellWindow } from './Spells.tsx'
import { Window, WindowHeader } from './Window.tsx'

// The quick bar (the spec §3.3 and C4): Crawler Interface's Hotlist, kept as
// a bar of ten slots, first on the sheet and pinnable like a menu. A slot
// holds a toggle, an attack, a spell, a class resource or an item; tapping
// it opens its window, which does what the slot is for (switch Rage on, cast
// Bless or switch on its effects alone, roll the attack, open the spell,
// spend a use) and offers Change and Remove. An
// empty slot opens the picker. Until the player changes a slot, the bar is
// suggested from the sheet (play/kit.ts), and says so.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

export function QuickBarSection({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const { slots } = barSlots(rules, entity, sheet)
  return (
    <SheetSection id="quick-bar" className="hotlist" count={`${slots.filter(Boolean).length} of ${slots.length}`}>
      <QuickBarSlots rules={rules} entity={entity} sheet={sheet} update={update} />
    </SheetSection>
  )
}

// The Journal's quick bar (user, 2026-10-20): at the foot of the screen in
// place of the Reactions band, where the thumb is, shrunk to one row that
// scrolls sideways on a phone, and not pinnable. Its heading folds it to
// one line, and the fold is kept on the device. The character's reactions
// are the turn's Reaction group (Turn.tsx).
const dockFolded = deviceStore('d-amp-d:quick-dock-folded', (raw) => raw === 'true')

export function QuickDock({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const folded = useDeviceStore(dockFolded)
  const { slots } = barSlots(rules, entity, sheet)
  return (
    <aside className="interrupts quick-dock hud-frame" aria-labelledby="quick-dock-heading">
      <div className="hud-inner">
        <div className="interrupts-head">
          <h2 id="quick-dock-heading">
            <button type="button" className="interrupts-toggle" aria-expanded={!folded} aria-controls="quick-dock-slots" onClick={() => dockFolded.set(!folded)}>
              Quick bar
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path fill="currentColor" d={folded ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
              </svg>
            </button>
          </h2>
          <p className="interrupts-note">
            {slots.filter(Boolean).length} of {slots.length}
          </p>
        </div>
        <div id="quick-dock-slots" hidden={folded}>
          <QuickBarSlots rules={rules} entity={entity} sheet={sheet} update={update} dock />
        </div>
      </div>
    </aside>
  )
}

// The slots and the windows they open, on the sheet or in the dock.
function QuickBarSlots({ rules, entity, sheet, update, dock = false }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update; dock?: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  const [hit, setHit] = useState<Attack | null>(null)
  const [damage, setDamage] = useState<Attack | null>(null)
  const [spell, setSpell] = useState<SpellRow | null>(null)
  const { slots, suggested } = barSlots(rules, entity, sheet)
  const filled = slots.filter(Boolean).length
  return (
    <>
      {suggested && filled > 0 && !dock && <p className="meta">Suggested from the sheet until you change a slot.</p>}
      {filled === 0 && <p className="empty-state">Nothing on the quick bar. Tap a slot to add to it.</p>}
      <ol className="hotlist-slots">
        {slots.map((slot, i) => (
          <li key={i}>
            <button type="button" className="hotlist-slot" data-kind={slot?.kind ?? 'empty'} data-on={(slot?.kind === 'toggle' && slot.toggle.on) || undefined} aria-haspopup="dialog" aria-label={slotLabel(slot, i)} onClick={() => setOpen(i)}>
              <span className="slot-number">{i + 1}</span>
              {slot && <span className="slot-name">{slot.kind === 'missing' ? 'Gone' : slot.name}</span>}
              {slot && <span className="slot-detail">{slotDetail(slot)}</span>}
            </button>
          </li>
        ))}
      </ol>
      {open !== null && (
        <SlotWindow
          rules={rules}
          entity={entity}
          sheet={sheet}
          slots={slots}
          index={open}
          update={update}
          onHit={setHit}
          onDamage={setDamage}
          onSpell={setSpell}
          onClose={() => setOpen(null)}
        />
      )}
      {hit && <QuickRoll rules={rules} entity={entity} name={`${hit.name}, to hit`} total={hit.toHit} attack onClose={() => setHit(null)} />}
      {damage && <DamageWindow entity={entity} attack={damage} onClose={() => setDamage(null)} />}
      {spell && <SpellWindow rules={rules} entity={entity} sheet={sheet} row={spell} update={update} onClose={() => setSpell(null)} />}
    </>
  )
}

// The tile's line under the name: a toggle on or off, an attack's to-hit, a
// spell's level, a resource's uses left, an item's count.
function slotDetail(slot: NonNullable<BarSlot>): string {
  switch (slot.kind) {
    case 'toggle':
      return slot.toggle.on ? 'On' : slot.toggle.cost ? `Off · ${slot.toggle.cost.left} left` : 'Off'
    case 'attack':
      return `Hit ${signed(slot.attack.toHit.total)}`
    case 'spell':
      return slot.row.spell.level ? `Level ${slot.row.spell.level}` : 'Cantrip'
    case 'resource':
      return `${slot.resource.max - slot.resource.used} of ${slot.resource.max}`
    case 'item':
      return slot.item.quantity !== 1 ? `× ${slot.item.quantity}` : ''
    case 'missing':
      return 'Not on the sheet'
  }
}

function slotLabel(slot: BarSlot, i: number): string {
  const n = `Slot ${i + 1}`
  if (!slot) return `${n}: empty`
  if (slot.kind === 'missing') return `${n}: something no longer on the sheet`
  const detail = slotDetail(slot)
  return `${n}: ${slot.name}, ${KIND_WORD[slot.kind]}${detail ? `, ${detail}` : ''}`
}

const KIND_WORD: Record<BarEntry['kind'], string> = { toggle: 'a toggle', attack: 'an attack', spell: 'a spell', resource: 'a class resource', item: 'an item' }

// How many picker rows to draw before asking for a narrower find, so the
// window opens at once.
const PICKER_LIMIT = 40

function SlotWindow({
  rules,
  entity,
  sheet,
  slots,
  index,
  update,
  onHit,
  onDamage,
  onSpell,
  onClose,
}: {
  rules: Rules
  entity: CharacterEntity
  sheet: Sheet
  slots: BarSlot[]
  index: number
  update: Update
  onHit: (a: Attack) => void
  onDamage: (a: Attack) => void
  onSpell: (r: SpellRow) => void
  onClose: () => void
}) {
  const slot = slots[index]
  const [picking, setPicking] = useState(slot === null)
  const [find, setFind] = useState('')
  const [error, setError] = useState('')
  // What the slot holds closes on a tap outside; the picker keeps its Cancel.
  const dialog = useHudDialog({ onClose, dismissOnOutside: !picking })
  const title = picking ? `Slot ${index + 1}: ${slot ? 'change' : 'add'}` : `Slot ${index + 1}: ${slot && slot.kind !== 'missing' ? slot.name : 'gone'}`

  return (
    <Window dialog={dialog} className="slot-dialog" labelledBy="slot-heading">
      <WindowHeader id="slot-heading" title={title} />
      {picking ? (
        <Picker
          candidates={barCandidates(rules, entity, sheet)}
          find={find}
          setFind={setFind}
          onPick={(c) => {
            update((e) => setBarSlot(e, slots, index, { kind: c.kind, ref: c.ref }))
            dialog.close()
          }}
        />
      ) : (
        slot && (
          <SlotBody
            slot={slot}
            error={error}
            onToggle={(on) => {
              if (slot.kind !== 'toggle') return
              const r = switchToggle(entity, slot.toggle, on)
              if (!r.ok) return setError(r.error)
              update(() => r.entity)
              dialog.close()
            }}
            onSpend={(by) => slot.kind === 'resource' && update((e) => spendResource(e, slot.resource.key, slot.resource.max, by))}
            onHit={(a) => dialog.closeThen(() => onHit(a))}
            onDamage={(a) => dialog.closeThen(() => onDamage(a))}
            onSpell={(r) => dialog.closeThen(() => onSpell(r))}
          />
        )
      )}
      <div className="dialog-actions">
        {!picking && slot && (
          <div className="dialog-aside">
            <button type="button" className="secondary" onClick={() => setPicking(true)}>
              Change
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                update((e) => setBarSlot(e, slots, index, null))
                dialog.close()
              }}
            >
              Remove from quick bar
            </button>
          </div>
        )}
        <button type="button" className="secondary" onClick={dialog.close}>
          {picking ? 'Cancel' : 'Done'}
        </button>
      </div>
    </Window>
  )
}

function SlotBody({
  slot,
  error,
  onToggle,
  onSpend,
  onHit,
  onDamage,
  onSpell,
}: {
  slot: NonNullable<BarSlot>
  error: string
  onToggle: (on: boolean) => void
  onSpend: (by: 1 | -1) => void
  onHit: (a: Attack) => void
  onDamage: (a: Attack) => void
  onSpell: (r: SpellRow) => void
}) {
  switch (slot.kind) {
    case 'toggle': {
      const { on, cost, spell } = slot.toggle
      const choices = toggleChoices(slot.toggle)
      return (
        <>
          <p className="readout-line">{on ? 'On: its effects are on the sheet.' : 'Off.'}</p>
          {cost && !on && (
            <p className="meta">
              Switching it on spends {cost.amount === 1 ? 'one' : cost.amount} {cost.name}: {cost.left} left.
            </p>
          )}
          {error && (
            <p className="owed" role="alert">
              {error}
            </p>
          )}
          {spell && !on && <p className="meta">Casting it spends its slot{spell.spell.duration.concentration ? ' and takes your Concentration' : ''}. Its effects alone spend nothing.</p>}
          <div className={choices.length > 1 ? 'actions' : 'quick-choices'}>
            {choices.map((c, i) =>
              c.action === 'cast' ? (
                <button key={c.action} type="button" className="primary" aria-haspopup="dialog" onClick={() => onSpell(spell!)}>
                  {c.label}
                </button>
              ) : (
                <button key={c.action} type="button" className={i === 0 ? 'primary' : 'secondary'} aria-pressed={on} onClick={() => onToggle(c.action !== 'switch-off')}>
                  {c.label}
                </button>
              ),
            )}
          </div>
        </>
      )
    }
    case 'attack': {
      const a = slot.attack
      return (
        <>
          <p className="readout-line">
            To hit {signed(a.toHit.total)} · {damageFormula(a)} {a.damage.type}
          </p>
          <div className="quick-choices">
            <button type="button" className="primary" aria-haspopup="dialog" onClick={() => onHit(a)}>
              Roll to hit
            </button>
            <button type="button" className="secondary" aria-haspopup="dialog" onClick={() => onDamage(a)}>
              Roll damage
            </button>
          </div>
        </>
      )
    }
    case 'spell': {
      const s = slot.row.spell
      return (
        <>
          <p className="readout-line">
            {s.level ? `Level ${s.level}` : 'Cantrip'} · {slot.row.from}
          </p>
          <div className="quick-choices">
            <button type="button" className="primary" aria-haspopup="dialog" onClick={() => onSpell(slot.row)}>
              Open the spell
            </button>
          </div>
        </>
      )
    }
    case 'resource': {
      const r = slot.resource
      const left = r.max - r.used
      return (
        <>
          <p className="readout-line" role="status">
            {left} of {r.max} left · {r.from}
          </p>
          <div className="quick-choices">
            <button type="button" className="primary" disabled={left === 0} onClick={() => onSpend(1)}>
              Use one
            </button>
            <button type="button" className="secondary" disabled={r.used === 0} onClick={() => onSpend(-1)}>
              Get one back
            </button>
          </div>
        </>
      )
    }
    case 'item':
      return (
        <>
          <p className="readout-line">
            × {slot.item.quantity}
            {slot.item.worn ? ' · worn' : ''}
            {slot.item.attuned ? ' · attuned' : ''}
          </p>
          {slot.item.description ? (
            paragraphs(slot.item.description).map((p, i) => (
              <p key={i} className="item-description">
                {p}
              </p>
            ))
          ) : (
            <p className="meta">No description.</p>
          )}
        </>
      )
    case 'missing':
      return <p className="meta">What this slot held is no longer on the sheet. Change it, or remove it from the quick bar.</p>
  }
}

function Picker({ candidates, find, setFind, onPick }: { candidates: BarEntry[]; find: string; setFind: (s: string) => void; onPick: (c: BarEntry) => void }) {
  const q = find.trim().toLocaleLowerCase()
  const matched = candidates.filter((c) => !q || c.name.toLocaleLowerCase().includes(q))
  const shown = matched.slice(0, PICKER_LIMIT)
  return (
    <>
      <label className="inventory-find">
        <span>Find</span>
        <input type="search" value={find} onChange={(e) => setFind(e.target.value)} />
      </label>
      {matched.length === 0 && <p className="empty">Nothing matches.</p>}
      {BAR_GROUPS.map((g) => {
        const rows = shown.filter((c) => c.kind === g.kind)
        if (!rows.length) return null
        return (
          <div key={g.kind}>
            <h3>{g.name}</h3>
            <ul className="stat-list">
              {rows.map((c) => (
                <li key={`${c.kind}:${c.ref}`}>
                  <button type="button" className="stat-row" onClick={() => onPick(c)}>
                    <span className="stat-name">{c.name}</span>
                    <span className="stat-detail">{slotDetail(c)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {matched.length > shown.length && <p className="meta">{matched.length - shown.length} more: narrow the find to see them.</p>}
    </>
  )
}
