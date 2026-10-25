import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { NoticeOwner } from '../notify/owner.ts'
import { hasNavigatedInApp } from '../routes.ts'
import type { CharacterEntity, RosterRecord } from '../save/record.ts'
import { holdsBandOpen } from './band-focus.ts'
import { characterName } from './character-name.ts'
import { CharacterMenu } from './CharacterMenu.tsx'
import { FlashStack } from './Flash.tsx'
import { FolderButton } from './Folder.tsx'
import { IdentityDialog } from './IdentityDialog.tsx'
import { Portrait } from './Portrait.tsx'
import { ScreenHeading } from './ScreenHeading.tsx'
import { TopBar } from './TopBar.tsx'

// The band (the spec §3.3, M0's form): the frame around a character's
// sheet, in Crawler Interface's classic look. Its top row holds the
// notification folder on the left and MENU on the right, which opens the
// menu: the sheet's sections, the menus, Settings and All characters. Under
// it, the photo and the name. The photo opens the identity panel: the photo
// large, its framing, and the name to edit. Under the name, the vitals the
// sheet derives (play/vitals.ts): the class line, then HP, AC, Initiative
// and Speed, which the collapsed line leaves out. At the foot of the page,
// the Reactions band (components/Reactions.tsx), sticky where the thumb is.
//
// Once the page scrolls past the band, it collapses to one line, the name and
// MENU; tapping the rest of that line opens it again in place (never
// navigates, law 2), and the next scroll closes it.
//
// The band is fixed over a spacer of its full height rather than sticky:
// resizing a sticky band while scrolled moves the page under the reader on
// browsers without scroll anchoring (Safari), and a fixed one moves nothing.
//
// The notifications come through the band (A1): the folder at its top left,
// and the flashes sliding in under it. A character's screens file their
// notifications into its folder (NoticeOwner). On a cold load the band draws
// in, into its place (A13).

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

// rosterId is the saved character's, for the folder, the rolls and Settings.
// runningHead is the Journal's (PlayView.tsx): the short name of the section
// in view, which the collapsed line shows after the name, as a printed
// page's running head does. Classic passes none.
export function Hud({
  rosterId,
  entity,
  update,
  vitals,
  reactions,
  runningHead,
  children,
}: {
  rosterId: string
  entity: CharacterEntity
  update: Update
  vitals?: ReactNode
  reactions?: ReactNode
  runningHead?: string
  children: ReactNode
}) {
  // A cold load (no step inside the app yet) draws the band in, once, as it
  // mounts. Nothing waits for it: the data is already here.
  const [drawIn] = useState(() => !hasNavigatedInApp())
  const band = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const lineMenu = useRef<HTMLButtonElement>(null)
  const { spacer, past } = useScrolledPast(band)
  useScrollPadding(band, spacer)
  useChromeHeights(band)
  // Where the page was when the reader opened the collapsed band, or null.
  const [openedAt, setOpenedAt] = useState<number | null>(null)
  // Focus on a control inside the band keeps it open, so a form or button
  // never vanishes from under the keyboard (band-focus.ts). The heading,
  // focused after a navigation for a screen reader, does not count; nor the
  // toggle itself, nor the collapsed line's MENU, which opening the band
  // would take away; nor a control the collapsed line shows (data-line: the
  // Journal's HP), whose tap would otherwise open the band under the finger
  // and lose the tap.
  const [focusInside, setFocusInside] = useState(false)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (openedAt === null) return
    const close = () => {
      if (Math.abs(window.scrollY - openedAt) > 32) setOpenedAt(null)
    }
    window.addEventListener('scroll', close, { passive: true })
    return () => window.removeEventListener('scroll', close)
  }, [openedAt])

  const collapsed = past && openedAt === null && !focusInside
  const name = characterName(entity.name)

  return (
    <NoticeOwner.Provider value={rosterId}>
      <header
        ref={band}
        className="hud hud-frame"
        data-collapsed={collapsed || undefined}
        data-arriving={drawIn || undefined}
        onFocus={(e) => setFocusInside(holdsBandOpen(e.target, [toggle.current, lineMenu.current]) && !(collapsed && e.target.closest('[data-line]')))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocusInside(false)
        }}
      >
        <div className="hud-inner">
          {/* The band's row (A7, A16): the folder on the left, then the
              mark and the product's name, as on the list (user,
              2026-10-23); MENU on the right, which holds Settings and All
              characters (user, 2026-10-15). */}
          <div className="hud-full">
            <TopBar
              characterId={rosterId}
              chrome="none"
              brand
              brandToList
              end={
                <button type="button" className="chrome-word" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
                  Menu
                </button>
              }
            >
              <FolderButton owner={rosterId} ownerName={name} />
            </TopBar>
          </div>
          <div className="hud-identity">
            <div className="hud-full">
              <button
                type="button"
                className="portrait-button"
                aria-haspopup="dialog"
                aria-label={entity.portrait ? 'Photo and name' : 'Add a photo, or edit the name'}
                onClick={() => setIdentityOpen(true)}
              >
                <Portrait entity={entity} size="sm" alt="" />
                {/* Says the square does something, which a letter alone does not. */}
                <span className="portrait-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" focusable="false">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zm17.7-10.2a1 1 0 0 0 0-1.42l-2.33-2.33a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </span>
              </button>
            </div>
            <div>
              <ScreenHeading>{name}</ScreenHeading>
              <RunningHead folded={collapsed} words={runningHead} />
              {vitals}
            </div>
          </div>
          {/* The collapsed line's MENU, at the right, where the band's own
              stands, over the toggle that takes the rest of the line. */}
          {collapsed && (
            <button ref={lineMenu} type="button" className="chrome-word hud-line-menu" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
              Menu
            </button>
          )}
          {past && (
            <button
              ref={toggle}
              type="button"
              className="hud-toggle"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Show the band' : 'Hide the band'}
              onClick={() => setOpenedAt(collapsed ? window.scrollY : null)}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d={collapsed ? 'M7 10l5 5 5-5z' : 'M7 14l5-5 5 5z'} />
              </svg>
            </button>
          )}
          {/* Under the band, open or collapsed: it hangs from the band's edge. */}
          <FlashStack owner={rosterId} />
        </div>
      </header>
      <div className="hud-spacer" style={{ height: spacer }} />
      <main className="play">{children}</main>
      {reactions}
      {menuOpen && <CharacterMenu entity={entity} rosterId={rosterId} onClose={() => setMenuOpen(false)} />}
      {identityOpen && <IdentityDialog entity={entity} update={update} onClose={() => setIdentityOpen(false)} />}
    </NoticeOwner.Provider>
  )
}

// The Journal's running head (the sheet concept's borrowing from direction
// B, user 2026-10-23): collapsed, the line names the section in view after
// the name, by its short name, as a printed page's head names its chapter.
// Hidden from a screen reader, which has the thumb index's mark instead.
export function RunningHead({ folded, words }: { folded: boolean; words?: string }) {
  if (!folded || !words) return null
  return (
    <span className="hud-running-head" aria-hidden="true">
      {words}
    </span>
  )
}

// The band's and the foot's heights as they are now (the band open or
// collapsed, the quick bar open, folded or under a window), on the root as
// --hud-height and --dock-height, for what stands between them: the
// Journal's thumb index (index.css). The dock is the Journal's quick bar,
// which arrives after the band, with its chunk, beside the page; until then,
// and in Classic, the foot is 0.
function useChromeHeights(band: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = band.current
    const holder = el?.parentElement
    if (!el || !holder) return
    const root = document.documentElement.style
    let dock: HTMLElement | null = null
    const fit = () => {
      root.setProperty('--hud-height', `${el.offsetHeight}px`)
      root.setProperty('--dock-height', `${dock?.offsetHeight ?? 0}px`)
    }
    const sizes = new ResizeObserver(fit)
    sizes.observe(el)
    const findDock = () => {
      const now = holder.querySelector<HTMLElement>(':scope > .quick-dock')
      if (now !== dock) {
        if (dock) sizes.unobserve(dock)
        dock = now
        if (dock) sizes.observe(dock)
      }
      fit()
    }
    findDock()
    const arrivals = new MutationObserver(findDock)
    arrivals.observe(holder, { childList: true })
    return () => {
      sizes.disconnect()
      arrivals.disconnect()
      root.removeProperty('--hud-height')
      root.removeProperty('--dock-height')
    }
  }, [band])
}

// The band's full height, for the spacer that holds its place, and whether the
// page has scrolled past it. The spacer is measured only while the page is
// above that point: a spacer that grew or shrank while scrolled past would
// move the page, which is what the fixed band exists to avoid.
function useScrolledPast(band: RefObject<HTMLElement | null>) {
  const [spacer, setSpacer] = useState(0)
  const [past, setPast] = useState(false)
  const height = useRef(0)

  // Measured before paint, so the page never draws under an unmeasured band;
  // again whenever the band changes size (a wrapped name) and on every scroll
  // (a rotation while scrolled past is caught on return).
  useLayoutEffect(() => {
    const el = band.current
    if (!el) return
    const sync = () => {
      const y = window.scrollY
      if (!el.hasAttribute('data-collapsed') && (height.current === 0 || y < height.current)) {
        height.current = el.offsetHeight
        setSpacer(height.current)
      }
      setPast(height.current > 0 && y >= height.current)
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    window.addEventListener('scroll', sync, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', sync)
    }
  }, [band])

  return { spacer, past }
}

// Room at the screen's top for the fixed band, so whatever takes focus from
// the keyboard is scrolled clear of it, never left under it (WCAG 2.4.11).
// Measured, so the same in either look: the band as drawn, open or its one
// collapsed line. Within one open band's height of the fold (`open`, where
// the band collapses), the room stays the open band's: a focus that scrolls
// the page back up across the fold opens the band again, so what took focus
// has to land below the open band, as goToSection lands a section. The room
// takes a gap that clears the focus ring.
function useScrollPadding(band: RefObject<HTMLElement | null>, open: number) {
  useEffect(() => {
    const root = document.documentElement.style
    let written = ''
    const fit = () => {
      const line = band.current?.offsetHeight ?? 0
      const room = window.scrollY < open * 2 ? Math.max(line, open) : line
      const top = `calc(${room}px + var(--space-2))`
      // Only on a change: this runs on every scroll.
      if (top === written) return
      written = top
      root.setProperty('scroll-padding-top', top)
    }
    fit()
    const observer = new ResizeObserver(fit)
    if (band.current) observer.observe(band.current)
    window.addEventListener('scroll', fit, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', fit)
      root.removeProperty('scroll-padding-top')
    }
  }, [band, open])
}
