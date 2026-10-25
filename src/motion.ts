// Whether the app may animate (spec §6.3: motion is optional). The device's
// reduce-motion setting decides, unless Settings pins it: data-motion on
// <html> is 'reduce' to stop all motion, or 'full' to allow it whatever the
// device says (settings.ts sets it). index.css reads the same two things to
// remove every animation and transition; this is for code that waits for an
// animation to end, which must not wait for one that will never run.

// The parts of the page this reads, so tests can pass stand-ins.
type Root = Pick<HTMLElement, 'getAttribute'>
type Media = (query: string) => boolean

const deviceReduces: Media = (query) => window.matchMedia(query).matches

export function motionAllowed(root: Root = document.documentElement, matches: Media = deviceReduces): boolean {
  const pinned = root.getAttribute('data-motion')
  if (pinned === 'reduce') return false
  if (pinned === 'full') return true
  return !matches('(prefers-reduced-motion: reduce)')
}

// Whether motion is off because the device asks for it, Settings leaving
// it to the device (System). The dice tray says so the first time a roll
// skips its tumble for that reason (user, 2026-10-20: a Windows laptop with
// its animation effects off showed no tumble and no reason).
export function deviceStopsMotion(root: Root = document.documentElement, matches: Media = deviceReduces): boolean {
  return root.getAttribute('data-motion') === null && matches('(prefers-reduced-motion: reduce)')
}

// The device's own record that the line was shown (beside the settings,
// never in a character's file). Storage that refuses shows it once a visit.
type Store = Pick<Storage, 'getItem' | 'setItem'>
const HINT_KEY = 'd-amp-d:motion-hint'
let hintFor: number | null = null
let shownThisVisit = false

function hintStore(): Store | null {
  try {
    return localStorage
  } catch {
    return null
  }
}

// Whether the roll with this id carries the line: the first roll on this
// device whose tumble the device's setting skips, and that roll each time it
// is asked again (a redraw).
export function takeMotionHint(rollId: number, stops: boolean = deviceStopsMotion(), store: Store | null = hintStore()): boolean {
  if (hintFor === rollId) return true
  if (!stops || shownThisVisit) return false
  try {
    if (store?.getItem(HINT_KEY)) return false
    store?.setItem(HINT_KEY, 'shown')
  } catch {
    // Unrecorded: shown once this visit.
  }
  shownThisVisit = true
  hintFor = rollId
  return true
}

// For tests: forget this visit's line.
export function resetMotionHint() {
  hintFor = null
  shownThisVisit = false
}
