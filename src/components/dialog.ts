import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject, type SyntheticEvent } from 'react'
import { motionAllowed } from '../motion.ts'

// Every window the app opens is a native <dialog>, shown with showModal() when
// it mounts and ended by its owner unmounting it. useHudDialog does that once
// for all of them, as the HUD's windows behave (A2):
//
// - It grows from the control that opened it, about 150 ms, and shrinks back
//   into it on close; the owner unmounts it when the shrink ends. Under
//   reduced motion it is simply there, and simply gone.
// - Escape closes it. The browser's cancel is taken (preventDefault), so the
//   request stops at the topmost window and nothing waits on a close event
//   that may not come.
// - A window that holds nothing unsaved (dismissOnOutside) also closes on a
//   tap outside it, a click-away. A form never does: a stray tap
//   must not throw away typing. Once anything is typed into one of its fields,
//   a read-only window stops closing on a tap outside as well.
// - Closing hands focus back to the control that opened it (the browser does
//   that when the dialog closes, which is just before it is unmounted).
//
// React delivers a dialog's cancel, close and click events to every dialog
// around it in the component tree, which the browser never does: the cropper
// opened from the identity panel would close the panel too. So each handler
// takes only its own dialog's events.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// The control the player last pressed, and when. A window grows from it
// unless its owner names another, so no opener has to pass anything along.
// Recorded by trackOpeners(), installed once in main.tsx.
let lastPressed: { rect: Rect; at: number } | null = null

export function notePressed(rect: Rect, at: number) {
  lastPressed = { rect, at }
}

// Only a press in the last moment counts: a window opened later than that
// (after a file was read, say) grows from the middle of the screen.
export function recentOpener(now: number): Rect | null {
  return lastPressed && now - lastPressed.at < 1000 ? lastPressed.rect : null
}

export function trackOpeners(doc: Document = document) {
  // Capturing, so the press is noted before any handler opens a window. A key
  // press on a button is a click too.
  doc.addEventListener(
    'click',
    (e) => {
      const control = e.target instanceof Element ? e.target.closest('button, a, summary, label, [role="button"]') : null
      if (control) notePressed(control.getBoundingClientRect(), performance.now())
    },
    { capture: true },
  )
}

// The transform origin that makes a window grow out of a control: the
// control's centre, measured from the window's own top left.
export function originFrom(control: Rect, box: Rect): string {
  const x = control.x + control.width / 2 - box.x
  const y = control.y + control.height / 2 - box.y
  return `${Math.round(x)}px ${Math.round(y)}px`
}

// Whether a point lies outside a box: a tap on the backdrop. A tap on the
// window's own padding hits the dialog element too, so the target alone
// cannot tell them apart.
export function outside(box: Rect, x: number, y: number): boolean {
  return x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height
}

// The longest a closing window waits for its shrink before going anyway.
const SHRINK_FALLBACK_MS = 200

const TYPED = new Set(['text', 'search', 'number', 'email', 'url', 'tel', 'password'])
const isTyping = (t: EventTarget) => t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && TYPED.has(t.type))

export function useHudDialog({ onClose, dismissOnOutside = false, from }: { onClose: () => void; dismissOnOutside?: boolean; from?: Rect }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closing = useRef(false)
  const typed = useRef(false)
  const pressedOutside = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const owner = useRef(onClose)
  useEffect(() => {
    owner.current = onClose
  })

  // No close() on cleanup: StrictMode runs this twice, and a close in between
  // would end the window as it opened.
  useEffect(() => {
    const d = ref.current
    if (!d || d.open) return
    const opener = from ?? recentOpener(performance.now())
    d.showModal()
    if (opener) d.style.transformOrigin = originFrom(opener, d.getBoundingClientRect())
    if (!motionAllowed()) return
    d.setAttribute('data-opening', '')
    const grown = (e: AnimationEvent) => {
      if (e.target !== d || e.pseudoElement) return
      d.removeAttribute('data-opening')
      d.removeEventListener('animationend', grown)
    }
    d.addEventListener('animationend', grown)
  }, [from])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Closes the window, then runs after: for an action that moves focus
  // somewhere new, which must come after the window hands it back.
  const closeThen = useCallback((after?: () => void) => {
    const d = ref.current
    if (closing.current) return
    closing.current = true
    const done = () => {
      window.clearTimeout(timer.current)
      d?.removeEventListener('animationend', shrunk)
      // Closed before it is unmounted, so focus goes back to the opener.
      if (d?.open) d.close()
      owner.current()
      after?.()
    }
    const shrunk = (e: AnimationEvent) => {
      if (e.target === d && !e.pseudoElement) done()
    }
    if (!d?.open || !motionAllowed()) return done()
    d.removeAttribute('data-opening')
    d.setAttribute('data-closing', '')
    d.addEventListener('animationend', shrunk)
    timer.current = window.setTimeout(done, SHRINK_FALLBACK_MS)
  }, [])

  // Takes no arguments, so it can be a button's onClick as it stands.
  const close = useCallback(() => closeThen(), [closeThen])

  const props = {
    ref,
    onCancel: (e: SyntheticEvent<HTMLDialogElement>) => {
      if (e.target !== e.currentTarget) return
      e.preventDefault()
      close()
    },
    // The browser closed it without us (a form with method="dialog", or a
    // second Escape it would not let be refused): the owner unmounts it.
    onClose: (e: SyntheticEvent<HTMLDialogElement>) => {
      if (e.target !== e.currentTarget || closing.current) return
      closing.current = true
      owner.current()
    },
    onInput: (e: SyntheticEvent<HTMLDialogElement>) => {
      if (isTyping(e.target)) typed.current = true
    },
    // Both halves of the tap must land outside, so a drag that starts in a
    // field and ends on the backdrop does not close the window.
    onPointerDown: (e: PointerEvent<HTMLDialogElement>) => {
      pressedOutside.current = e.target === e.currentTarget && outside(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY)
    },
    onClick: (e: MouseEvent<HTMLDialogElement>) => {
      const pressed = pressedOutside.current
      pressedOutside.current = false
      if (!dismissOnOutside || typed.current || !pressed || e.target !== e.currentTarget) return
      if (outside(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY)) close()
    },
  }

  return { close, closeThen, props }
}

export type HudDialog = ReturnType<typeof useHudDialog>

// Whether this window is the one on top: the last open in the page, as a
// window opened from another is drawn inside its opener. Looked at again
// whenever a window opens, closes or goes.
export function useTopWindow(ref: RefObject<HTMLDialogElement | null>): boolean {
  const [top, setTop] = useState(false)
  useEffect(() => {
    const look = () => setTop([...document.querySelectorAll('dialog[open]')].at(-1) === ref.current)
    look()
    const watch = new MutationObserver(look)
    watch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] })
    return () => watch.disconnect()
  }, [ref])
  return top
}
