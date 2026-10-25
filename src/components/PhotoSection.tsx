import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CENTRED, type Crop } from '../portrait/crop.ts'
import { preparePhoto, renderThumbnail, type PreparedPhoto } from '../portrait/prepare.ts'
import type { CharacterEntity } from '../save/record.ts'
import { CropDialog } from './CropDialog.tsx'
import { PhotoFrame } from './Portrait.tsx'

// An optional photo (spec §3.3), the character's or a pet's or mount's
// (2026-10-13): add one, adjust its framing, replace it, or remove it.
// Removing or replacing is destructive, so it offers Undo until the next
// photo action (Q13); the window lives in memory and closes on leaving the
// page.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => unknown
type Photo = NonNullable<CharacterEntity['portrait']>

// `heading` fits the section into its place: one part of the Finish step's
// review, of the identity panel the HUD's photo opens, or of a pet's or
// mount's window. `size` 'full' is the identity panel's larger view, with the
// actions stacked under the photo. `name` is who it shows, for its alt text;
// `fallback` what the frame shows without one.
export function PhotoEditor({
  photo,
  name,
  fallback,
  onChange,
  heading = 'h2',
  headingId = 'photo-heading',
  size = 'lg',
}: {
  photo: Photo | undefined
  name: string
  fallback: ReactNode
  onChange: (photo: Photo | undefined) => void
  heading?: 'h2' | 'h3'
  headingId?: string
  size?: 'lg' | 'full'
}) {
  const Heading = heading
  const input = useRef<HTMLInputElement>(null)
  // The photo being framed: a new one, or the saved one being adjusted.
  const [framing, setFraming] = useState<{ photo: PreparedPhoto; crop: Crop } | null>(null)
  const [undo, setUndo] = useState<{ message: string; previous: Photo } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // The section's first button, and a counter bumped to move focus there
  // after any photo action: the button that started it may be gone (Add a
  // photo becomes Adjust framing), and focus must not fall to the page.
  const firstAction = useRef<HTMLButtonElement>(null)
  const [refocus, setRefocus] = useState(0)
  useEffect(() => {
    if (refocus) firstAction.current?.focus()
  }, [refocus])
  const done = () => setRefocus((n) => n + 1)
  const saving = useRef(false)
  const current = photo

  function save(next: Photo | undefined, undoMessage: string | null) {
    setUndo(undoMessage && current ? { message: undoMessage, previous: current } : null)
    onChange(next)
  }

  async function picked(file: File) {
    setError(null)
    setUndo(null)
    setBusy(true)
    const result = await preparePhoto(file)
    setBusy(false)
    if (!result.ok) return setError(result.message)
    setFraming({ photo: { image: result.image, width: result.width, height: result.height }, crop: CENTRED })
  }

  return (
    <section className="photo" aria-labelledby={headingId}>
      <Heading id={headingId}>Photo</Heading>
      <div className="photo-row" data-stacked={size === 'full' || undefined}>
        <PhotoFrame photo={current} size={size} alt={current ? `Photo of ${name}` : ''} fallback={fallback} />
        <div className="photo-actions">
          {current ? (
            <>
              <button
                ref={firstAction}
                type="button"
                className="secondary"
                onClick={() => {
                  setUndo(null)
                  setFraming({ photo: { image: current.image, width: current.width, height: current.height }, crop: current.crop })
                }}
              >
                Adjust framing
              </button>
              <button type="button" className="secondary" disabled={busy} aria-busy={busy} onClick={() => input.current?.click()}>
                Replace
              </button>
              <button
                type="button"
                className="quiet"
                onClick={() => {
                  save(undefined, 'Photo removed.')
                  done()
                }}
              >
                Remove
              </button>
            </>
          ) : (
            <button ref={firstAction} type="button" className="secondary" disabled={busy} aria-busy={busy} onClick={() => input.current?.click()}>
              Add a photo
            </button>
          )}
          <p className="meta">Optional. Any image and any shape: it is shrunk on this device and kept in this character's saves and exports.</p>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      {undo && (
        <div className="undo-bar" role="status">
          <span>{undo.message}</span>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              const previous = undo.previous
              setUndo(null)
              onChange(previous)
              done()
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Hidden, as on the character list: a file input cannot be styled. */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void picked(file)
        }}
      />

      {framing && (
        <CropDialog
          photo={framing.photo}
          initial={framing.crop}
          onClose={() => {
            setFraming(null)
            // After Done, focus waits for the save below, which may swap the
            // first button (Add a photo becomes Adjust framing).
            if (!saving.current) done()
          }}
          onDone={async (crop) => {
            saving.current = true
            const { image, width, height } = framing.photo
            const replacing = current && image !== current.image
            // Rendered for the character list; without one the list shows the
            // name's initial, so a failure here never loses the photo.
            const thumbnail = await renderThumbnail(framing.photo, crop)
            save({ image, width, height, crop, ...(thumbnail ? { thumbnail } : {}) }, replacing ? 'Photo replaced.' : null)
            saving.current = false
            done()
          }}
        />
      )}
    </section>
  )
}

// The character's own photo, kept in its record.
export function PhotoSection({ entity, update, heading, size }: { entity: CharacterEntity; update: Update; heading?: 'h2' | 'h3'; size?: 'lg' | 'full' }) {
  return (
    <PhotoEditor
      photo={entity.portrait}
      name={entity.name || 'this character'}
      fallback={(entity.name.trim()[0] ?? '?').toUpperCase()}
      onChange={(portrait) =>
        update((e) => {
          const { portrait: _dropped, ...rest } = e
          return portrait ? { ...rest, portrait } : rest
        })
      }
      heading={heading}
      size={size}
    />
  )
}
