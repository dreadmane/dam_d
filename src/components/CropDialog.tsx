import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { clampCrop, imageStyle, MAX_ZOOM, MIN_ZOOM, panBy, zoomTo, type Crop } from '../portrait/crop.ts'
import type { PreparedPhoto } from '../portrait/prepare.ts'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// Choosing which square of a photo shows (spec §3.3). Hand-rolled (user,
// 2026-09-27, over a cropping library): drag the photo, or use the arrow
// keys, and zoom with a two-finger pinch, the slider, or + and −. A native modal dialog, so focus is trapped and
// Escape cancels (useHudDialog, so only this window); it opens on the frame,
// so the keys work at once.

const KEY_STEP = 0.05 // of the frame's width, per arrow press
const ZOOM_STEP = 0.1

export function CropDialog({
  photo,
  initial,
  onDone,
  onClose,
}: {
  photo: PreparedPhoto
  initial: Crop
  onDone: (crop: Crop) => void
  // Called however the dialog closes: Done, Cancel, or Escape.
  onClose: () => void
}) {
  const { width, height } = photo
  // Framing in progress is unsaved: Cancel only, never a tap outside.
  const dialog = useHudDialog({ onClose })
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  // Every finger down, for a pinch: two of them zoom by how far apart they are.
  const fingers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ gap: number; zoom: number } | null>(null)
  const [crop, setCrop] = useState(() => clampCrop(width, height, initial))

  const frameWidth = () => frame.current?.clientWidth || 1
  const pan = (dx: number, dy: number) => setCrop((c) => panBy(width, height, c, dx, dy, frameWidth()))
  const zoom = (z: number) => setCrop((c) => zoomTo(width, height, c, z))

  const gapOf = () => {
    const [a, b] = [...fingers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y) || 1
  }
  function pointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (fingers.current.size === 2) {
      drag.current = null
      pinch.current = { gap: gapOf(), zoom: crop.zoom }
    } else drag.current = { x: e.clientX, y: e.clientY }
  }
  function pointerMove(e: PointerEvent<HTMLDivElement>) {
    if (fingers.current.has(e.pointerId)) fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current && fingers.current.size === 2) {
      zoom(pinch.current.zoom * (gapOf() / pinch.current.gap))
      return
    }
    if (!drag.current) return
    pan(e.clientX - drag.current.x, e.clientY - drag.current.y)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  function pointerEnd(e: PointerEvent<HTMLDivElement>) {
    fingers.current.delete(e.pointerId)
    pinch.current = null
    // The finger left behind carries on as a drag from where it is.
    const [rest] = [...fingers.current.values()]
    drag.current = rest ?? null
  }

  // The keys move the photo the way a drag does.
  function key(e: KeyboardEvent<HTMLDivElement>) {
    const step = frameWidth() * KEY_STEP
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) pan(...moves[e.key])
    else if (e.key === '+' || e.key === '=') zoom(crop.zoom + ZOOM_STEP)
    else if (e.key === '-' || e.key === '_') zoom(crop.zoom - ZOOM_STEP)
    else return
    e.preventDefault()
  }

  return (
    <Window dialog={dialog} className="crop-dialog" labelledBy="crop-heading">
      <WindowHeader id="crop-heading" title="Frame the photo" />
      <p className="meta" id="crop-hint">
        Drag the photo, or use the arrow keys, to choose what shows in the square. Zoom with a pinch, the slider, or + and −.
      </p>
      <div
        ref={frame}
        className="cropper"
        tabIndex={0}
        role="group"
        aria-label="Photo framing"
        aria-describedby="crop-hint"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onKeyDown={key}
      >
        <img src={photo.image} alt="" style={imageStyle(width, height, crop)} draggable={false} />
      </div>
      <label className="zoom">
        <span>Zoom</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          aria-valuetext={`${Math.round(crop.zoom * 100)}%`}
          onChange={(e) => zoom(Number(e.target.value))}
        />
      </label>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Cancel
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            onDone(crop)
            dialog.close()
          }}
        >
          Done
        </button>
      </div>
    </Window>
  )
}
