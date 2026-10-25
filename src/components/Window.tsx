import { useContext, useEffect, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { trayStore } from '../dice/app-tray.ts'
import { NoticeOwner } from '../notify/owner.ts'
import { useTopWindow, type HudDialog } from './dialog.ts'
import { DiceTray } from './DiceTray.tsx'
import { FlashStack } from './Flash.tsx'
import type { Readout } from './readout.ts'
import { ReadoutLines } from './ReadoutLines.tsx'

// A HUD window (A2): the native dialog useHudDialog drives, framed as the
// HUD's panel (index.css), with a close ✕ drawn at its top right. The ✕ comes
// last inside the window, so opening still focuses the window's first
// control, as it did before there was a ✕. A window placed by measure (a
// menu's, under the band) passes its box as style.
// The window on top shows the flashes it would hide (2026-10-13), after what
// it holds for the same reason, and the dice of a roll made in it (the dice
// roll, 2026-10-14). Which window is on top is looked up once here, for
// both.
export function Window({ dialog, className, labelledBy, style, children }: { dialog: HudDialog; className?: string; labelledBy: string; style?: CSSProperties; children: ReactNode }) {
  const top = useTopWindow(dialog.props.ref)
  return (
    <dialog {...dialog.props} className={className} aria-labelledby={labelledBy} style={style}>
      {children}
      <WindowFlashes top={top} />
      <WindowDice dialog={dialog.props.ref} top={top} />
      <button type="button" className="window-close" aria-label="Close" onClick={dialog.close}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  )
}

// A modal window covers the band, and the flashes hanging from it with it:
// the window on top shows them too, at its foot, for the character the band's
// do. Behind it, the band's copy is inert and waits, as before.
function WindowFlashes({ top }: { top: boolean }) {
  const owner = useContext(NoticeOwner)
  return top ? <FlashStack owner={owner} place="window" /> : null
}

// A roll made in a window shows its dice in that window, at the top of the
// screen (index.css), and goes when the window closes.
function WindowDice({ dialog, top }: { dialog: RefObject<HTMLDialogElement | null>; top: boolean }) {
  useEffect(() => {
    const el = dialog.current
    return () => {
      if (el) trayStore.dropHost(el)
    }
  }, [dialog])
  // The dialog element, read once the window is open and useTopWindow has
  // looked: the tray shows only for rolls made after that.
  return top ? <DiceTray place="window" host={dialog.current} /> : null
}

// A window's title. A window that shows one thing (an item, a Spell, a Skill,
// the character) opens with the System's readout instead (A15): its name line
// in the System's green, then short `Label: value.` lines, then what it
// holds. A character's name line is a sentence and keeps its case (sentence). A
// check symbol before the title takes its colour from kind (law 16).
export function WindowHeader({
  id,
  title,
  readout,
  sentence = false,
  symbol,
  kind,
}: {
  id: string
  title?: ReactNode
  readout?: Readout
  sentence?: boolean
  symbol?: ReactNode
  kind?: string
}) {
  const classes = [readout && 'readout-name', sentence && 'readout-sentence'].filter(Boolean).join(' ')
  return (
    <div className="window-header">
      <h2 id={id} className={classes || undefined} data-kind={kind}>
        {symbol}
        {readout ? readout.name : title}
      </h2>
      {readout && readout.lines.length > 0 && <ReadoutLines lines={readout.lines} />}
    </div>
  )
}
