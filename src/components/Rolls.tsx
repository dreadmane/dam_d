import { useState } from 'react'
import { stamp } from '../notify/stamp.ts'
import { copyCard } from '../roll20/app-roll20.ts'
import { roll20Card } from '../roll20/roll20.ts'
import { useRolls } from '../rolls/app-rolls.ts'
import { isTyped, KEEP_ROLLS, type Roll } from '../rolls/rolls.ts'
import { SheetSection } from './SheetSection.tsx'

// Rolls (the dice roll's log, approved by the user 2026-10-14): every roll
// made in play and what it was for, newest first, so a result can be checked
// if it ever comes into question. A menu, since it is read rather than rolled
// from: MENU, Rolls, from anywhere on the character's screens. Each entry is
// in the readout format: its name, TYPED after a result typed from the table,
// the time at its right, then the formula and the window's own words. Kept on
// this device, the last hundred for this character, never in its file, with
// no Clear: the cap is the eraser. Copy today's rolls puts today's on the
// clipboard as plain text, to settle a question at a remote table. Copy for
// Roll20 on an entry puts that one roll on the clipboard as a Roll20 chat
// card (rolls into Roll20, 2026-10-18), for a roll that did not reach the
// game as it was made.

const nameOf = (r: Roll) => `${r.name}${isTyped(r) ? ' · TYPED' : ''}`

export function RollsSection({ rosterId, character }: { rosterId: string; character: string }) {
  const { list, today } = useRolls(rosterId)
  const [copied, setCopied] = useState('')

  function copyOne(r: Roll) {
    copyCard(roll20Card(character, { ...r, name: nameOf(r) }), (ok) => setCopied(ok ? `Copied ${r.name} for Roll20: paste it in its chat.` : 'The browser would not copy it.'))
  }
  const now = new Date()
  const count = `${today.length.toLocaleString()} today`

  function copy() {
    const text = today.map((r) => [nameOf(r), stamp(new Date(r.at), now), r.formula, ...r.lines].join(' · ')).join('\n')
    const done = () => setCopied(`Copied ${today.length.toLocaleString()} roll${today.length === 1 ? '' : 's'}.`)
    const refused = () => setCopied('The browser would not copy them.')
    if (!navigator.clipboard) return refused()
    navigator.clipboard.writeText(text).then(done, refused)
  }

  return (
    <SheetSection id="rolls" count={count}>
      <p className="meta">Newest first · {count}</p>
      {list.length === 0 ? (
        <p className="empty">No rolls yet.</p>
      ) : (
        <ul className="rolls-list">
          {list.map((r) => (
            <li key={r.id} className="roll-entry">
              <p className="roll-entry-name">
                <span className="roll-entry-title">{nameOf(r)}</span>
                <span className="roll-entry-stamp">{stamp(new Date(r.at), now)}</span>
              </p>
              {r.lines.map((line, i) => (
                <p key={i}>{i === 0 ? `${r.formula} · ${line}` : line}</p>
              ))}
              <button type="button" className="secondary roll20-copy" aria-label={`Copy for Roll20: ${nameOf(r)}`} onClick={() => copyOne(r)}>
                Copy for Roll20
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="meta">
        Kept on this device: the last {KEEP_ROLLS} for this character, never in its file. A result typed from the table says TYPED.
      </p>
      <div className="actions">
        <button type="button" className="secondary" disabled={today.length === 0} onClick={copy}>
          Copy today’s rolls
        </button>
      </div>
      <p className="health-done" role="status">
        {copied}
      </p>
    </SheetSection>
  )
}
