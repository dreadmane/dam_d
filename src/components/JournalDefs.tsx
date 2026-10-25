import { useSyncExternalStore } from 'react'
import { journalOn, watchLook } from './journal-look.ts'

// The Adventurer's Journal's hand-inked edge (the journal concept, user
// 2026-10-20): a filter that roughens a box's ruled frame as if drawn with
// a pen. The browser draws the noise; there is no image and no library.
// index.css applies it to the frames (the sheet's boxes and the turn's, the
// shelf's edges, Level up's new rung) by its id.
export function JournalDefs() {
  return (
    <svg className="journal-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="journal-rough" x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={3.2} />
        </filter>
      </defs>
    </svg>
  )
}

// At the app's root (main.tsx), beside the dice's definitions: in the
// Journal every screen inks a frame (the shelf, user 2026-10-23), not only
// the sheet. In the page only while the Journal is on, added or removed as
// Look is switched (journal-look.ts). A render with no page (a test) has no
// look, so it draws nothing.
export function JournalRoot() {
  const on = useSyncExternalStore(watchLook, () => journalOn(), () => false)
  return on ? <JournalDefs /> : null
}
