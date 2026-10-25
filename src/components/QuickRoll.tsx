import { showDice } from '../dice/app-tray.ts'
import { describeCheck, formatEvaluated, type Mode } from '../dice/describe.ts'
import { rollD20, rollMode } from '../play/play.ts'
import { signed } from '../play/vitals.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import type { Total } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// The quick roll (Crawler Interface's, user 2026-10-14; the spec §3.2): a
// row's total opens a small window with Roll, Advantage and Disadvantage.
// The rules' own Advantage and Disadvantage on the roll (a condition, a
// trait) are listed and counted with the choice: any of each is one, and
// both cancel (SRD p.7). The dice show under the band and the roll goes in
// the Rolls log. A condition the app can't decide (Dwarven Resilience's
// "against poison") is listed for the table, never counted.

const CHOICES: { name: string; mode: Mode }[] = [
  { name: 'Roll', mode: 'normal' },
  { name: 'Advantage', mode: 'advantage' },
  { name: 'Disadvantage', mode: 'disadvantage' },
]

// onRolled is told once the roll is made (the Journal's turn spends its pip).
// attack: the roll is an attack roll, so a natural 20 or 1 on it says the
// rules' result (describe.ts, naturalWords).
export function QuickRoll({
  rules,
  entity,
  name,
  total,
  attack = false,
  onClose,
  onRolled,
}: {
  rules: Rules
  entity: CharacterEntity
  name: string
  total: Total
  attack?: boolean
  onClose: () => void
  onRolled?: () => void
}) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const record = useRecordRoll()
  const check = { flat: total.total, dice: ['d20'] }
  const roll = (table: Mode) => {
    const mode = rollMode(total.advantage.length, total.disadvantage.length, table)
    const r = rollD20(rules, total.total, mode)
    const described = describeCheck(name, check, mode, r, attack ? 'attack' : 'other')
    dialog.close()
    showDice(described, { say: true, alone: true })
    record(entity, described)
    onRolled?.()
  }
  return (
    <Window dialog={dialog} className="quick-roll" labelledBy="quick-roll-heading">
      <WindowHeader id="quick-roll-heading" title={`${name} ${signed(total.total)}`} />
      <p className="meta">{formatEvaluated(check)}</p>
      {total.advantage.map((n) => (
        <p key={`a${n.from}${n.text}`} className="meta">
          Advantage: {n.from}
          {n.text && ` (${n.text})`}.
        </p>
      ))}
      {total.disadvantage.map((n) => (
        <p key={`d${n.from}${n.text}`} className="meta">
          Disadvantage: {n.from}
          {n.text && ` (${n.text})`}.
        </p>
      ))}
      {total.notes.map((n) => (
        <p key={`n${n.from}${n.text}`} className="meta">
          For the table: {n.text} ({n.from}).
        </p>
      ))}
      <div className="quick-choices">
        {CHOICES.map((c) => (
          <button key={c.name} type="button" className={c.mode === 'normal' ? 'primary' : 'secondary'} onClick={() => roll(c.mode)}>
            {c.name}
          </button>
        ))}
      </div>
    </Window>
  )
}
