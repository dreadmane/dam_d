import { useEffect, useRef, useState } from 'react'

// The character's name, edited in place (user, 2026-09-27): the name with Edit
// name beside it, which opens a small form; Save or Enter keeps the change,
// Cancel or Escape leaves it. It lives in the identity panel with the photo
// (user, 2026-09-27), so the HUD's band carries the name without a button.

export function NameEditor({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  // Focus goes back to Edit name when the form closes, since the control
  // that had it (Save, Cancel, or the field) is gone.
  const [closedAt, setClosedAt] = useState(0)
  useEffect(() => {
    if (closedAt) editButton.current?.focus()
  }, [closedAt])
  const close = () => {
    setDraft(null)
    setClosedAt((n) => n + 1)
  }

  if (draft === null) {
    return (
      <div className="title-row">
        <p className="name-current">{name.trim() || <span className="meta">No name yet</span>}</p>
        <button ref={editButton} type="button" className="secondary" onClick={() => setDraft(name)}>
          Edit name
        </button>
      </div>
    )
  }
  return (
    <form
      className="name-edit"
      onSubmit={(e) => {
        e.preventDefault()
        onRename(draft.trim())
        close()
      }}
    >
      <label>
        <span className="visually-hidden">Name</span>
        <input
          value={draft}
          placeholder="Unnamed character"
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Escape closes the form, not the panel around it.
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              close()
            }
          }}
        />
      </label>
      <button type="submit" className="primary">
        Save
      </button>
      <button type="button" className="secondary" onClick={close}>
        Cancel
      </button>
    </form>
  )
}
