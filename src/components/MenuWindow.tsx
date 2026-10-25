import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SectionId } from '../play/sheet-layout.ts'
import { useHudDialog } from './dialog.ts'
import { SectionPlace } from './section-place.ts'
import { goToSection, MENU_STATE, menuIn } from './sections-nav.ts'
import { Window } from './Window.tsx'

// A menu's window (Crawler Interface's, user 2026-10-13): a section the
// player reads rather than rolls, opened from the menu over the page. It
// fills the height under the band, left in view, and the sheet under it is
// hidden while it is open. The phone's Back closes it: opening it adds a
// history entry, and closing it any other way takes that entry back. PIN pins
// it (onPin), closes it, and goes to the section, now on the sheet. The
// Reactions band at the foot bounds it from below, as Crawler Interface's
// Interrupts zone did.

// Between the band's lower edge and the Reactions band's upper one (or the
// screen's foot), as they stand when the window opens, a small gap from each.
function frame(): { top: number; bottom: number } {
  const gap = 8
  const band = document.querySelector('.hud')?.getBoundingClientRect().bottom ?? 0
  const zone = document.querySelector('.reactions')?.getBoundingClientRect().top
  return { top: Math.round(band) + gap, bottom: Math.round(zone === undefined ? 0 : window.innerHeight - zone) + gap }
}

export function MenuWindow({ id, onPin, onClose, children }: { id: SectionId; onPin: () => void; onClose: () => void; children: ReactNode }) {
  // Whether Back closed it, when its entry is already gone; and whether PIN
  // did, when the page goes on to the section.
  const byBack = useRef(false)
  const toSection = useRef(false)
  const dialog = useHudDialog({
    onClose: () => {
      if (!byBack.current && menuIn(history.state) === id) {
        // Going back restores the page's scroll, so the page goes to the
        // section only once the entry is gone.
        if (toSection.current) {
          const go = () => {
            window.removeEventListener('popstate', go)
            goToSection(id)
          }
          window.addEventListener('popstate', go)
        }
        history.back()
      } else if (toSection.current) goToSection(id)
      onClose()
    },
    dismissOnOutside: true,
  })
  const { close } = dialog
  const [box] = useState(frame)

  useEffect(() => {
    // Once, though StrictMode mounts it twice in development.
    if (menuIn(history.state) !== id) history.pushState({ ...((history.state as object | null) ?? {}), [MENU_STATE]: id }, '')
    const back = () => {
      if (menuIn(history.state) === id) return
      byBack.current = true
      close()
    }
    window.addEventListener('popstate', back)
    return () => window.removeEventListener('popstate', back)
  }, [id, close])

  // The sheet under the window is hidden while it is open (index.css), so
  // only the band shows around it.
  useEffect(() => {
    document.body.setAttribute('data-menu-open', '')
    return () => document.body.removeAttribute('data-menu-open')
  }, [])

  const headingId = `${id}-window-heading`
  return (
    <Window
      dialog={dialog}
      className="menu-window"
      labelledBy={headingId}
      style={{ margin: `${box.top}px auto ${box.bottom}px`, height: `${window.innerHeight - box.top - box.bottom}px`, maxHeight: 'none' }}
    >
      <SectionPlace.Provider
        value={{
          at: 'window',
          headingId,
          pin: () => {
            onPin()
            toSection.current = true
            close()
          },
        }}
      >
        {children}
      </SectionPlace.Provider>
    </Window>
  )
}
