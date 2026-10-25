import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motionAllowed } from '../motion.ts'
import { noticeStore, useFlashes } from '../notify/app-notices.ts'
import type { Notice } from '../notify/notices.ts'
import type { Flash } from '../notify/store.ts'
import { DiceTray } from './DiceTray.tsx'

// The flashes (A1): each notification slides in under the band as it
// arrives, newest on top, with its dismiss. Never modal and never blocking:
// the page stays live under it. After a few seconds it files itself into the
// folder, so one missed is never lost; one carrying an action (Undo) stays
// until the action ends. Screen readers hear each through the polite status
// region. A level-up arrives in the gold tier's frame. While a window is open
// over the page, the window on top shows them at its foot (2026-10-13).

// How long a flash shows before filing itself.
const SHOWN_MS = 6000
// A window open over the page hides the band's flashes; one due to file looks
// this often for it to have closed.
const WAIT_MS = 500
// How new a flash must be to slide in: about the slide's own length.
const SLIDE_MS = 400

// Under the band, or at the foot of the window on top (Window.tsx), which
// would otherwise hide them. Under the band the dice of a roll made on the
// page come first (the dice roll, 2026-10-14); in creation, where nothing is
// notified, they are all the band shows. Levels hangs a character's flashes
// under its top row without the dice (dice false), which it has never shown.
export function FlashStack({ owner, place = 'band', notices = true, dice = true }: { owner: string | null; place?: 'band' | 'window'; notices?: boolean; dice?: boolean }) {
  const flashes = useFlashes(owner)
  return (
    <div className="flash-stack" data-place={place} role="status" aria-live="polite">
      {place === 'band' && dice && <DiceTray place="band" host="band" />}
      {notices &&
        flashes.map((f) => (
          <FlashCard key={f.id} flash={f} notice={f.notice} inWindow={place === 'window'} />
        ))}
    </div>
  )
}

function FlashCard({ flash, notice, inWindow }: { flash: Flash; notice: Notice; inWindow: boolean }) {
  const action = useRef<HTMLButtonElement>(null)
  // Read once as it arrives: the slide plays then, or not at all. A flash
  // shown again on coming back to the screen does not slide in twice.
  const [slides] = useState(() => motionAllowed() && Date.now() - Date.parse(notice.at) < SLIDE_MS)

  // Timed from its arrival, not from this screen's: a flash left behind on
  // another screen resumes its time, and one already due files before it is
  // drawn (a layout effect, so it never flickers). One due while a window
  // hides it waits for the window to close, then shows its full time; the
  // window's own copy is not hidden, so it keeps its time.
  useLayoutEffect(() => {
    if (flash.action) return
    let timer = 0
    const windowOpen = () => !inWindow && document.querySelector('dialog[open]') !== null
    const arm = (ms: number) => {
      timer = window.setTimeout(() => (windowOpen() ? wait() : noticeStore.file(flash.id)), ms)
    }
    const wait = () => {
      timer = window.setTimeout(() => (windowOpen() ? wait() : arm(SHOWN_MS)), WAIT_MS)
    }
    const left = Date.parse(notice.at) + SHOWN_MS - Date.now()
    if (left <= 0) noticeStore.file(flash.id)
    else arm(left)
    return () => window.clearTimeout(timer)
  }, [flash.id, flash.action, notice.at, inWindow])

  useEffect(() => {
    if (flash.focus) action.current?.focus()
  }, [flash.focus])

  return (
    <div className="flash hud-frame" data-tier={notice.tier} data-opening={slides || undefined}>
      <div className="flash-body">
        <p className="flash-kicker">{notice.kicker}</p>
        {notice.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {flash.action && (
          <button
            ref={action}
            type="button"
            className="secondary"
            onClick={() => {
              flash.action?.run()
              noticeStore.acted(flash.id)
            }}
          >
            {flash.action.label}
          </button>
        )}
      </div>
      <button type="button" className="flash-dismiss" aria-label="Dismiss" onClick={() => noticeStore.dismiss(flash.id)}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
