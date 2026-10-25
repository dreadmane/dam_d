import { useMemo, useState } from 'react'
import { useHudDialog } from '../components/dialog.ts'
import { Window, WindowHeader } from '../components/Window.tsx'
import { classSummary, deriveSheet } from '../rules/derive.ts'
import type { Ability } from '../rules/expr.ts'
import type { CharacterEntity } from '../save/types.ts'
import type { SheetRead } from './sheet-import.ts'
import { checkRows, placeIncreases, type Placed, type Placement } from './to-character.ts'

// The report card for a D&D Beyond sheet (spec §7.2; the import concept's
// review B, user 2026-10-24): what came in, what needs the player, what was
// kept by name, and dam’d's figures beside the sheet's. Nothing is saved
// until Continue, which opens the Levels page with what is still owed
// marked there. The increases the sheet doesn't place are placed here,
// because the base scores are worked back from the sheet's totals with
// them (to-character.ts).

const ABILITY_NAMES: Record<Ability, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

// How many of a list to name before "and N more".
const NAMED = 3

const listed = (names: string[]) => (names.length > NAMED ? `${names.slice(0, NAMED).join(', ')} and ${names.length - NAMED} more` : names.join(', '))

export function SheetReview({ read, onContinue, onClose }: { read: Extract<SheetRead, { ok: true }>; onContinue: (entity: CharacterEntity) => void; onClose: () => void }) {
  // A choice before anything is saved: it doesn't close on a tap outside.
  const dialog = useHudDialog({ onClose })
  const { rules, ddb, imported, fileName } = read
  const { report } = imported
  const [placed, setPlaced] = useState<Placed>({})

  const entity = useMemo(() => placeIncreases(rules, imported, ddb, placed), [rules, imported, ddb, placed])
  const sheet = useMemo(() => deriveSheet(rules, entity), [rules, entity])
  const rows = useMemo(() => checkRows(rules, entity, ddb), [rules, entity, ddb])
  // What the Levels page will still ask, the placements here aside. A
  // subclass owed is its class entry's, not a choice.
  const later = sheet.unmade.filter((o) => !o.increase).length
  const same = rows.filter((r) => r.same).length

  const pick = (p: Placement, i: number, a: Ability | '') =>
    setPlaced((prev) => {
      const next = [...(prev[p.key] ?? p.amounts.map(() => ''))] as (Ability | '')[]
      next[i] = a
      return { ...prev, [p.key]: next as Ability[] }
    })

  return (
    <Window dialog={dialog} className="sheet-review" labelledBy="sheet-review-heading">
      <WindowHeader id="sheet-review-heading" title={`${ddb.name || 'This character'}, from D&D Beyond`} />
      <p className="meta">
        Level {sheet.level} · {classSummary(sheet) || 'no class'} · read from {fileName}. Nothing is saved until you continue.
      </p>

      <section aria-labelledby="sheet-came-in">
        <h3 id="sheet-came-in">
          <span aria-hidden="true">✓ </span>Came in
        </h3>
        <ul className="details">
          {report.cameIn.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {(report.placements.length > 0 || later > 0 || report.preparedUnknown.length > 0) && (
        <section className="sheet-needs" aria-labelledby="sheet-needs">
          <h3 id="sheet-needs">
            <span aria-hidden="true">! </span>Needs you
          </h3>
          {report.placements.length > 0 && (
            <>
              <p className="meta">The sheet doesn’t say where these went. Place them now and your scores stay as D&D Beyond’s; left for later, the Levels page adds them on top.</p>
              {report.placements.map((p) => (
                <fieldset key={p.key} className="sheet-placement">
                  <legend>{p.label}</legend>
                  {p.amounts.map((amount, i) => {
                    const mine = placed[p.key] ?? []
                    // A background's increases go on different abilities.
                    const taken = p.key === 'background' ? mine.filter((a, j) => a && j !== i) : []
                    return (
                      <label key={i} className="field">
                        <span>+{amount} to</span>
                        <select value={mine[i] ?? ''} onChange={(e) => pick(p, i, e.target.value as Ability | '')}>
                          <option value="">Choose…</option>
                          {p.abilities
                            .filter((a) => !taken.includes(a))
                            .map((a) => (
                              <option key={a} value={a}>
                                {ABILITY_NAMES[a]}
                              </option>
                            ))}
                        </select>
                      </label>
                    )
                  })}
                </fieldset>
              ))}
            </>
          )}
          <ul className="details">
            {later > 0 && (
              <li>
                {later} more {later === 1 ? 'choice' : 'choices'} to make on the Levels page, where the sheet allows more than one reading
              </li>
            )}
            {report.preparedUnknown.map((c) => (
              <li key={c}>Today’s prepared {c} spells: the sheet marks none. Choose them on the sheet.</li>
            ))}
          </ul>
        </section>
      )}

      {report.keptByName.length > 0 && (
        <section aria-labelledby="sheet-kept">
          <h3 id="sheet-kept">
            <span aria-hidden="true">○ </span>Kept by name: {report.keptByName.length}
          </h3>
          <p className="meta">Not in your rules yet. Each is kept and marked unresolved, and counts once its record is added.</p>
          <ul className="details">
            {report.keptByName.map((k) => (
              <li key={`${k.what}:${k.name}`}>
                {k.name}, {k.what}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.customItems.length > 0 && (
        <section aria-labelledby="sheet-custom">
          <h3 id="sheet-custom">
            <span aria-hidden="true">○ </span>Custom items: {report.customItems.length}
          </h3>
          <p>{listed(report.customItems)}. dam’d doesn’t guess what they do.</p>
        </section>
      )}

      {rows.length > 0 && (
        <section aria-labelledby="sheet-check">
          <h3 id="sheet-check">
            Against D&D Beyond: {same} of {rows.length}
          </h3>
          <table className="sheet-check">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Figure</span>
                </th>
                <th scope="col">D&D Beyond</th>
                <th scope="col">dam’d</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.theirs}</td>
                  <td>
                    <span className={r.same ? 'sheet-same' : 'sheet-differs'}>{r.same ? '✓' : '≠'}</span> {r.ours}
                    <span className="visually-hidden">{r.same ? ', the same' : ', differs'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {report.leftOut.length > 0 && (
        <section aria-labelledby="sheet-left-out">
          <h3 id="sheet-left-out">Left out</h3>
          <ul className="details meta">
            {report.leftOut.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>The sheet’s descriptions: dam’d shows its own.</li>
          </ul>
        </section>
      )}

      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={() => dialog.closeThen(() => onContinue(entity))}>
          Continue in Levels
        </button>
      </div>
    </Window>
  )
}

export default SheetReview
