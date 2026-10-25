import type { ReactNode } from 'react'

// A play-view section's heading, with the count that helps find it (A16:
// "Inventory 3", "Rolls 2 today", from sectionCounts), the section's ⓘ after
// the count, and at its end a control of the heading's own (a pinned menu's
// PINNED). Focusable from script only, so the menu can move focus to
// the section it went to.
export function SectionHeading({ id, count, info, after, children }: { id: string; count?: string; info?: ReactNode; after?: ReactNode; children: ReactNode }) {
  const words = (
    <>
      {children}
      {count !== undefined && <span className="heading-count">{count}</span>}
      {info && <> {info}</>}
    </>
  )
  // With a control, a long heading's words wrap beside it, and the control
  // stays at the right, as PIN does in a menu's window.
  return (
    <h2 id={id} tabIndex={-1} className={after ? 'heading-with-control' : undefined}>
      {after ? <span className="heading-words">{words}</span> : words}
      {after}
    </h2>
  )
}
