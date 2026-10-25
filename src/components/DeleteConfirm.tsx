import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// The confirmation as a window of its own, for Settings' character section. A
// choice to make, so it never closes on a tap outside: Keep or the ✕ does.
export function DeleteConfirmWindow({ name, onDelete, onClose }: { name: string; onDelete: () => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  return (
    <Window dialog={dialog} labelledBy="confirm-heading">
      <DeleteConfirm name={name} headingId="confirm-heading" onKeep={dialog.close} onDelete={onDelete} />
    </Window>
  )
}

// The inside of the window that confirms deleting a character (spec §3.2, Q13),
// the same wherever Delete is offered: Settings' character section and the ⋯
// menu on the list. Keep comes first and takes focus, so Enter or a stray tap
// on the first control does no harm.
export function DeleteConfirm({
  name,
  headingId,
  onKeep,
  onDelete,
}: {
  name: string
  headingId: string
  onKeep: () => void
  onDelete: () => void
}) {
  return (
    <>
      <WindowHeader id={headingId} title={`Delete ${name}?`} />
      <p>It is removed from this browser. The list will offer Undo until you do something else.</p>
      <div className="dialog-actions">
        {/* autoFocus as well as first: in the list's menu this step replaces
            the actions in an open window, which does not refocus by itself. */}
        <button type="button" className="secondary" autoFocus onClick={onKeep}>
          Keep
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </>
  )
}
