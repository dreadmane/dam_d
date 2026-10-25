import { useSyncExternalStore } from 'react'
import { recentOpener } from '../components/dialog.ts'
import { motionAllowed } from '../motion.ts'
import { loadSettings } from '../settings.ts'
import type { DescribedRoll } from './describe.ts'
import { rollFeedback } from './feedback.ts'
import { handedBack, trayHost } from './host.ts'
import { createTrayStore } from './store.ts'

// The app's one dice tray (the dice roll, approved by the user 2026-10-14).
// A roll site prints its result as it always has, then calls showDice with
// the roll described; the tray shows in the window on top, or under the band
// when no window is open, and never moves between them.
//
// It is a display, never a control: it takes no taps and no focus. One set of
// capturing listeners, installed once in main.tsx beside trackOpeners, does
// what a tap does to it: a tap during the tumble settles every die at once,
// and a tap after it ends the tray, either way doing its own job underneath.
// Any key press, and focus moving anywhere but the control that rolled, ends
// it too, so it never sits over focus (WCAG 2.2 SC 2.4.11). The focus a tap
// gives the control it lands on is the tap's, already settled or ended.

// The window on top, or the band.
export type Host = Element | 'band'

export const trayStore = createTrayStore<Host>({ now: () => performance.now() })

// The control last pressed, so focus staying on it does not end its roll,
// and the focus a tap gives it is not taken for a move.
let lastControl: Element | null = null
const tapped = (target: EventTarget | null) =>
  target instanceof Node && lastControl !== null && (lastControl.contains(target) || (lastControl instanceof HTMLLabelElement && lastControl.control === target))
let landing: number | undefined
// The one focus move a closing window makes, handing focus back, is taken.
let handed = false

// say: the roll's site prints no line of its own (it only fills a field), so
// the tray's host speaks the roll to a screen reader: true for the roll's
// line, or the words to speak when the tray has no line.
// alone: the tray is the only place the roll prints at all (a quick roll from
// a row), so with the dice off in Settings it still shows, as the roll's name
// and words without the dice. Every other roll then shows nothing more than
// its own line, and is still spoken where it would have been.
export function showDice(roll: DescribedRoll, { say = false, alone = false }: { say?: boolean | string; alone?: boolean } = {}) {
  // A roll with no die the tray can draw shows nothing.
  if (roll.dice.length === 0) return
  const dice = loadSettings().dice.show
  const now = performance.now()
  const host = trayHost([...document.querySelectorAll('dialog[open]')])
  const focused = document.activeElement
  const control = focused && focused !== document.body ? focused : lastControl
  handed = false
  const draw = dice ? 'dice' : alone ? 'line' : 'none'
  const shown = trayStore.show(roll, { host, origin: recentOpener(now), motion: motionAllowed(), control, say, draw })
  if (!dice) return
  rollFeedback.start(roll.dice.length)
  window.clearTimeout(landing)
  landing = window.setTimeout(() => rollFeedback.settle(), Math.max(0, shown.landsAt - now))
}

export function useTray() {
  return useSyncExternalStore(trayStore.subscribe, trayStore.current)
}

export function trackTray(doc: Document = document) {
  doc.addEventListener(
    'pointerdown',
    (e) => {
      lastControl = e.target instanceof Element ? e.target.closest('button, a, summary, label, input, select, textarea, [role="button"]') : null
      if (trayStore.tumbling()) trayStore.settle()
      else trayStore.end()
    },
    { capture: true },
  )
  doc.addEventListener('keydown', () => trayStore.end(), { capture: true })
  doc.addEventListener(
    'focusin',
    (e) => {
      const shown = trayStore.current()
      if (!shown || e.target === shown.control || tapped(e.target)) return
      if (!handed && handedBack(shown.control)) {
        handed = true
        return
      }
      trayStore.end()
    },
    { capture: true },
  )
}
