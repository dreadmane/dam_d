import { useState } from 'react'
import { rulesVersion } from '../rules/data.ts'
import type { ImportOutcome } from '../save/import.ts'
import type { RosterSummary } from '../save/store.ts'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// Shows what reading a file found before anything is saved (spec §4.2): the
// player sees the report, then chooses. Plain language throughout; copy that
// reports state is straight (spec §6.1).

// as-is when nothing with the same id is saved; otherwise the player's choice.
export type ImportChoice = 'as-is' | 'copy' | 'replace'

const savedAt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function ImportReview({
  outcome,
  existing,
  onImport,
  onClose,
}: {
  outcome: ImportOutcome
  // The saved character with the same id, if there is one.
  existing: RosterSummary | null
  onImport: (choice: ImportChoice) => void
  onClose: () => void
}) {
  // A choice before anything is saved, and a failure the player should read:
  // neither closes on a tap outside.
  //
  // The window focuses its first control as it opens, so the order of
  // controls is the focus rule: the choice when there is a conflict, else
  // Cancel, and Close on a failure. All safe.
  const dialog = useHudDialog({ onClose })
  // Keeping both is the default: it cannot lose anything.
  const [choice, setChoice] = useState<'copy' | 'replace'>('copy')

  if (!outcome.ok) {
    return (
      <Window dialog={dialog} labelledBy="import-heading">
        <WindowHeader id="import-heading" title="Not imported" />
        <p>{outcome.message}</p>
        {outcome.details.length > 0 && (
          <ul className="details">
            {outcome.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={dialog.close}>
            Close
          </button>
        </div>
      </Window>
    )
  }

  const { record, report } = outcome
  const name = record.name || 'Unnamed character'

  return (
    <Window dialog={dialog} labelledBy="import-heading">
      <WindowHeader id="import-heading" title={`Import ${name}?`} />
      <ul className="details">
        {report.migrations.length > 0 ? (
          <li>
            Saved in an older format ({report.fromVersion}); updated on import: {report.migrations.join('; ')}.
          </li>
        ) : (
          <li>Saved in the current format.</li>
        )}
        {report.savedAgainst === null ? (
          <li>Made with the same rules data as this app.</li>
        ) : report.unresolved.length === 0 ? (
          <li>
            Made with different rules data ({report.savedAgainst}; this app has {rulesVersion}). Everything it
            refers to still matches.
          </li>
        ) : (
          <li>
            Made with different rules data ({report.savedAgainst}; this app has {rulesVersion}).{' '}
            {report.unresolved.length} {report.unresolved.length === 1 ? 'entry no longer matches' : 'entries no longer match'}{' '}
            the rules. {report.unresolved.length === 1 ? 'It is' : 'They are'} kept and shown as unresolved:
            <ul>
              {report.unresolved.map((u) => (
                <li key={`${u.kind}:${u.id}:${u.where}`}>
                  {u.kind} <code>{u.id}</code> in {u.where}
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>

      {existing && (
        <fieldset className="choice">
          <legend>
            {existing.name || 'Unnamed character'} is already saved here (saved {savedAt.format(new Date(existing.updatedAt))}).
          </legend>
          <label>
            <input type="radio" name="import-choice" checked={choice === 'copy'} onChange={() => setChoice('copy')} />
            Keep both: import as a copy
          </label>
          <label>
            <input type="radio" name="import-choice" checked={choice === 'replace'} onChange={() => setChoice('replace')} />
            Replace the saved one with this file
          </label>
        </fieldset>
      )}

      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={() => onImport(existing ? choice : 'as-is')}>
          Import
        </button>
      </div>
    </Window>
  )
}
