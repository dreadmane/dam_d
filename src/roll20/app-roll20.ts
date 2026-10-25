import { useSyncExternalStore } from 'react'
import type { RollInput } from '../rolls/rolls.ts'
import { loadSettings } from '../settings.ts'
import { beyond20Message, roll20Card } from './roll20.ts'

// The app's side of rolls into Roll20 (roll20.ts says why and how). Two
// things are kept here, on this page only: whether Beyond20 has loaded into
// it, and what happened to the latest roll, which the dice tray says in a
// line of its own.

// Beyond20 announces itself on a page it loads into with a Loaded event, and
// a NewSettings event after (its docs/api.md). Either means it is here; it
// cannot be unloaded without reloading the page.
let found = false
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

if (typeof document !== 'undefined') {
  const seen = () => {
    if (found) return
    found = true
    changed()
  }
  document.addEventListener('Beyond20_Loaded', seen)
  document.addEventListener('Beyond20_NewSettings', seen)
}

export const useBeyond20 = () => useSyncExternalStore(subscribe, () => found)

// What happened to the latest roll: sent through Beyond20, copied, both, or
// the browser refused the copy. `at` is the store's clock, as the tray's.
export interface Sent {
  at: number
  beyond20: boolean
  copy: 'copied' | 'refused' | null
}

let latest: Sent | null = null
const setLatest = (next: Sent) => {
  latest = next
  changed()
}

export const useSent = () => useSyncExternalStore(subscribe, () => latest)

// Where a roll went, in the dice tray's words: the latest roll sent on, if it
// is the tray's, made in the same tap. The copy settles a moment after the
// tap, so the line can arrive after the dice.
const SAME_TAP_MS = 1500

export function sentWords(sent: Sent | null, at: number): string | null {
  if (!sent || Math.abs(sent.at - at) > SAME_TAP_MS) return null
  const copied = sent.copy === 'copied' ? 'Copied for Roll20: paste it in its chat.' : sent.copy === 'refused' ? 'The browser would not copy it.' : ''
  return [sent.beyond20 ? 'Sent to Roll20.' : '', copied].filter(Boolean).join(' ') || null
}

// Sends a roll made in play on its way, in the click's own handler: a
// browser lets a page write the clipboard only during the tap or click that
// asked, on a phone as on a desktop. Nothing happens when neither way is on.
export function forwardRoll(character: string, roll: RollInput, now = performance.now()) {
  const copy = loadSettings().roll20.copy
  if (!found && !copy) return
  if (found) {
    document.dispatchEvent(new CustomEvent('Beyond20_SendMessage', { detail: [beyond20Message(character, roll)] }))
  }
  const sent: Sent = { at: now, beyond20: found, copy: null }
  if (!copy) return setLatest(sent)
  copyCard(roll20Card(character, roll), (ok) => setLatest({ ...sent, copy: ok ? 'copied' : 'refused' }))
}

// The card on the clipboard; done says whether the browser allowed it.
export function copyCard(card: string, done: (ok: boolean) => void) {
  if (!navigator.clipboard) return done(false)
  navigator.clipboard.writeText(card).then(
    () => done(true),
    () => done(false),
  )
}
