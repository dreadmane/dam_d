import { useMemo, useState } from 'react'
import type { Sheet } from '../rules/derive.ts'
import type { Ability } from '../rules/expr.ts'
import type { OwedChoice } from '../rules/level.ts'
import type { Rules } from '../rules/load.ts'
import { optionsFor, type Option } from '../play/options.ts'
import { unresolved } from '../rules/unresolved.ts'
import type { CharacterEntity } from '../save/types.ts'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// A level's choice (the concept round's B3): a window from the foot of the
// screen listing what the choice can pick from, one at a time (radio) or
// several (ticks up to the count), with a search box when the list is long.
// A pick whose prerequisite is unmet is shown with the reason and can still
// be taken (§5.2: explains, never prevents). An ability increase places +2,
// or +1 and +1, on the abilities its rule allows.

const ABILITY_NAMES: Record<Ability, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }
const LONG = 12

export function ChoiceSheet({
  rules,
  entity,
  sheet,
  owed,
  onSave,
  onClose,
}: {
  rules: Rules
  entity: CharacterEntity
  sheet: Sheet
  owed: OwedChoice
  onSave: (values: string[], increases?: Partial<Record<Ability, number>>) => void
  onClose: () => void
}) {
  const dialog = useHudDialog({ onClose })
  const where = owed.classId ? `${rules.classes.get(owed.classId)?.name ?? owed.classId} ${owed.level}` : owed.origin.name
  return (
    <Window dialog={dialog} className="choice-sheet" labelledBy="choice-heading">
      <WindowHeader id="choice-heading" title={`${where} · ${owed.origin.name === owed.label ? owed.label : `${owed.origin.name}`}`} />
      <p className="meta">{owed.label}</p>
      {owed.increase ? (
        <IncreasePicker owed={owed} sheet={sheet} onSave={(inc) => (onSave([], inc), dialog.close())} />
      ) : (
        <ListPicker rules={rules} entity={entity} sheet={sheet} owed={owed} onSave={(values) => (onSave(values), dialog.close())} />
      )}
    </Window>
  )
}

function ListPicker({ rules, entity, sheet, owed, onSave }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; owed: OwedChoice; onSave: (values: string[]) => void }) {
  // A feat the rules lack, kept by an import (§4.2), is listed first, by
  // name and marked, so it stays picked until another is.
  const options = useMemo(() => {
    const list = optionsFor(rules, entity, sheet, owed)
    const kept = owed.grants === 'feat' ? (owed.made?.values ?? []).filter((v) => !rules.feats.has(v)).map((v): Option => ({ id: v, name: unresolved(v) })) : []
    return list && [...kept, ...list]
  }, [rules, entity, sheet, owed])
  const [picked, setPicked] = useState<string[]>(owed.made?.values ?? [])
  const [find, setFind] = useState('')
  if (!options) {
    return (
      <>
        <p>The rules data has no list for this choice yet. It stays on the ladder as one to make.</p>
        <div className="dialog-actions" />
      </>
    )
  }
  const one = owed.count === 1
  const q = find.trim().toLowerCase()
  const shown = q ? options.filter((o) => o.name.toLowerCase().includes(q) || picked.includes(o.id)) : options
  const toggle = (id: string) => setPicked((p) => (one ? [id] : p.includes(id) ? p.filter((x) => x !== id) : p.length < owed.count ? [...p, id] : p))
  return (
    <>
      <p className="choice-count" role="status">
        {one ? (picked.length ? 'Chosen' : 'Choose one') : `${picked.length} of ${owed.count}`}
      </p>
      {options.length > LONG && (
        <label className="choice-find">
          <span>Find</span>
          <input type="search" value={find} onChange={(e) => setFind(e.target.value)} />
        </label>
      )}
      <ul className="choice-list">
        {shown.map((o) => (
          <li key={o.id}>
            <label>
              <input
                type={one ? 'radio' : 'checkbox'}
                name="choice"
                checked={picked.includes(o.id)}
                disabled={!one && !picked.includes(o.id) && picked.length >= owed.count}
                onChange={() => toggle(o.id)}
              />
              <span className="choice-name">{o.name}</span>
              {o.detail && <span className="choice-detail">{o.detail}</span>}
              {o.unmet && <span className="choice-unmet">{o.unmet}</span>}
            </label>
          </li>
        ))}
      </ul>
      <div className="dialog-actions">
        {picked.length > 0 && (
          <button type="button" className="secondary" onClick={() => setPicked([])}>
            Clear
          </button>
        )}
        <button type="button" className="primary" onClick={() => onSave(picked)}>
          Done
        </button>
      </div>
    </>
  )
}

// +2 to one, or +1 to two (the Ability Score Improvement), or whatever the
// effect's patterns allow, never past its cap.
function IncreasePicker({ owed, sheet, onSave }: { owed: OwedChoice; sheet: Sheet; onSave: (inc: Partial<Record<Ability, number>>) => void }) {
  const e = owed.increase!
  const patterns = e.patterns ?? [Array.from({ length: e.choose ?? 1 }, () => e.amount)]
  const start = owed.made?.increases ?? {}
  const startPattern = Math.max(0, patterns.findIndex((p) => p.length === Object.values(start).filter((n) => n).length))
  const [pattern, setPattern] = useState(startPattern)
  // The abilities already placed, the larger increase first, as the pattern
  // lists its amounts.
  const [placed, setPlaced] = useState<Ability[]>(
    (Object.entries(start) as [Ability, number][])
      .filter(([, n]) => n)
      .sort((a, b) => b[1] - a[1])
      .map(([a]) => a),
  )
  const amounts = patterns[pattern]
  const toggle = (a: Ability) => setPlaced((p) => (p.includes(a) ? p.filter((x) => x !== a) : amounts.length === 1 ? [a] : p.length < amounts.length ? [...p, a] : p))
  const increases = Object.fromEntries(placed.map((a, i) => [a, amounts[i] ?? amounts[0]])) as Partial<Record<Ability, number>>
  const cap = e.max ?? 20
  return (
    <>
      {patterns.length > 1 && (
        <div className="seg" role="group" aria-label="How to place it">
          {patterns.map((p, i) => (
            <button key={p.join()} type="button" aria-pressed={i === pattern} onClick={() => (setPattern(i), setPlaced([]))}>
              {p.map((n) => `+${n}`).join(' and ')}
            </button>
          ))}
        </div>
      )}
      <ul className="choice-list">
        {e.abilities.map((a) => {
          const score = sheet.abilities[a].score - (owed.made?.increases?.[a] ?? 0)
          const full = score >= cap && !placed.includes(a)
          return (
            <li key={a}>
              <label>
                <input type={amounts.length === 1 ? 'radio' : 'checkbox'} name="increase" checked={placed.includes(a)} disabled={full} onChange={() => toggle(a)} />
                <span className="choice-name">{ABILITY_NAMES[a]}</span>
                <span className="choice-detail">
                  {score}
                  {placed.includes(a) && ` → ${Math.min(cap, score + (increases[a] ?? 0))}`}
                </span>
                {full && <span className="choice-unmet">At {cap}, the most this allows</span>}
              </label>
            </li>
          )
        })}
      </ul>
      <div className="dialog-actions">
        <button type="button" className="primary" disabled={placed.length !== amounts.length} onClick={() => onSave(increases)}>
          Done
        </button>
      </div>
    </>
  )
}
