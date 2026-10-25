import { useState, type ReactNode } from 'react'
import { rollFaces } from '../dice/roll.ts'
import { showDice } from '../dice/app-tray.ts'
import { describeRoll } from '../dice/describe.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import type { CharacterEntity } from '../save/record.ts'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// The sheet features the character, not the rules (design ruling, user
// 2026-10-11). A rule shows on the sheet as its name; tapping the name opens
// a rule card from the bottom of the screen with the rule restated, its page,
// and any open reading or house ruling. Nothing on a card changes the
// character. A section's how-it-works paragraph opens the same card from an ⓘ
// on its heading. A rule that has the player roll a die (Intervene's 1d6)
// carries it, and its card rolls it.

export interface Rule {
  title: string
  // The rule restated, one paragraph per entry. Never the book's prose.
  text: ReactNode | ReactNode[]
  page?: number
  // Open readings, house rulings, anything the player should know about how
  // the app reads it.
  notes?: string[]
  // The die the rule has the player roll: "1d6".
  roll?: string
}

// Read-only, so a tap outside closes it too. The character it is opened for,
// where there is one, is the one a roll on it is logged for.
export function RuleCard({ rule, entity, onClose }: { rule: Rule; entity?: CharacterEntity; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const paragraphs = Array.isArray(rule.text) ? rule.text : [rule.text]
  return (
    <Window dialog={dialog} className="rule-card" labelledBy="rule-card-heading">
      <WindowHeader
        id="rule-card-heading"
        title={
          <>
            {rule.title}
            {rule.page !== undefined && <span className="meta"> p.{rule.page}</span>}
          </>
        }
      />
      {paragraphs.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      {rule.notes?.map((n) => (
        <p key={n} className="meta">
          {n}
        </p>
      ))}
      {rule.roll && <RuleRoll name={rule.title} notation={rule.roll} entity={entity} />}
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Close
        </button>
      </div>
    </Window>
  )
}

// The rule's die, rolled: the card says the roll, the dice tray shows it and
// the Rolls log keeps it. What the roll is added to is the table's, so
// nothing else changes.
function RuleRoll({ name, notation, entity }: { name: string; notation: string; entity?: CharacterEntity }) {
  const [said, setSaid] = useState('')
  const record = useRecordRoll()
  return (
    <>
      <div className="actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            const described = describeRoll(name, notation, rollFaces(notation))
            setSaid(described.line)
            showDice(described)
            if (entity) record(entity, described)
          }}
        >
          Roll {notation}
        </button>
      </div>
      <p className="health-done" role="status">
        {said}
      </p>
    </>
  )
}

// A rule's name on the sheet. With children, they are the visible label (a
// one-line summary of a rule that has no printed name); otherwise the title.
export function RuleName({ rule, children }: { rule: Rule; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="rule-name" onClick={() => setOpen(true)}>
        <span className="rule-name-label">{children ?? rule.title}</span>
        <span aria-hidden="true" className="rule-name-mark">
          ⓘ
        </span>
        <span className="visually-hidden">: read the rule</span>
      </button>
      {open && <RuleCard rule={rule} onClose={() => setOpen(false)} />}
    </>
  )
}

// The ⓘ on a section heading, for the section's how-it-works paragraph. Its
// name is "How Rest works" unless the title wants other words ("How Stat
// Checks work").
export function SectionInfo({ rule, label = `How ${rule.title} works` }: { rule: Rule; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="section-info" aria-label={label} onClick={() => setOpen(true)}>
        ⓘ
      </button>
      {open && <RuleCard rule={rule} onClose={() => setOpen(false)} />}
    </>
  )
}
