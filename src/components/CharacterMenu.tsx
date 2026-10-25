import { useEffect, useRef, useState } from 'react'
import { sectionCounts } from '../play/sections.ts'
import { arrangeable, isOwnOrder, moveSection, SECTION_NAME, sheetLayout, type SectionId } from '../play/sheet-layout.ts'
import { canPopOutHere, popOut } from '../popout.ts'
import { loadSettings } from '../settings.ts'
import { useRolls } from '../rolls/app-rolls.ts'
import type { CharacterEntity } from '../save/record.ts'
import { useHudDialog } from './dialog.ts'
import { Glyph } from './Glyph.tsx'
import { Link } from './Link.tsx'
import { usePins } from './pins.ts'
import { goToSection, openMenu, pageSections } from './sections-nav.ts'
import { resetOrder, setOrder, useOrder } from './sheet-order.ts'
import { Window, WindowHeader } from './Window.tsx'

// The menu (A16; Crawler Interface's, user 2026-10-13, carried as-is by the
// spec §3.3), in two groups. On your sheet: the sheet's sections by their own
// names, in the page's order, with a count where it helps; a tap closes the
// menu and goes to the section. ARRANGE beside its heading turns its rows
// into up and down arrows that move each section on the sheet, which follows
// each tap, the rest of the menu stepping aside until DONE. Menus: what is
// only read, each opening as a window of its own over the sheet, unless the
// player pinned it to the sheet, when it is in the first group. Then Settings
// and All characters apart at the foot (user, 2026-10-15), after Pop out on a
// desktop (popout.ts, user 2026-10-21). Nothing in it is
// unsaved, so a tap outside closes it.
export function CharacterMenu({ entity, rosterId, onClose }: { entity: CharacterEntity; rosterId: string; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  // What the sheet draws as the menu opens, by id. Arranging moves these, and
  // adds or takes away none.
  const [drawn] = useState(() => new Map(pageSections().map((s) => [s.id, s])))
  const pins = usePins()
  const order = useOrder()
  const [look] = useState(() => loadSettings().look)
  const layout = sheetLayout(pins, order, look)
  const onSheet = layout.sheet.filter((id) => drawn.has(id))
  // The Journal's turn stays first: it is listed, never moved.
  const movable = onSheet.filter(arrangeable)
  // Rolls counts today's, as its heading does (the dice roll's log).
  const rolls = useRolls(rosterId)
  const counts: Partial<Record<string, string>> = { ...sectionCounts(entity), rolls: `${rolls.today.length.toLocaleString()} today` }
  const nameOf = (id: SectionId) => drawn.get(id)?.name ?? SECTION_NAME[id]
  const countOf = (id: SectionId) => counts[id] ?? drawn.get(id)?.count

  const [arranging, setArranging] = useState(false)
  // The section last moved, and which way: its arrow keeps focus, so tapping
  // again moves it on, and a screen reader hears where it landed.
  const [moved, setMoved] = useState<{ id: SectionId; by: -1 | 1 } | null>(null)
  const arrows = useRef(new Map<string, HTMLButtonElement>())
  const arrange = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!moved) return
    const on = arrows.current.get(`${moved.id} ${moved.by}`)
    // At an end its arrow that way is off, so focus takes the other.
    const back = arrows.current.get(`${moved.id} ${-moved.by}`)
    ;(on && !on.disabled ? on : back)?.focus()
  }, [moved, order])

  function move(id: SectionId, by: -1 | 1) {
    setOrder(moveSection(order, movable, id, by))
    setMoved({ id, by })
  }

  return (
    <Window dialog={dialog} className="character-menu" labelledBy="menu-heading">
      <WindowHeader id="menu-heading" title="Menu" />
      {onSheet.length > 0 && (
        <div className="menu-group-head">
          <h3 id="menu-on-sheet" className="menu-group">
            On your sheet
          </h3>
          {movable.length > 1 && (
            <button
              ref={arrange}
              type="button"
              className="pin-button arrange-button"
              data-arranging={arranging || undefined}
              onClick={() => {
                setArranging(!arranging)
                setMoved(null)
              }}
            >
              <Glyph name={arranging ? 'done' : 'arrange'} size={16} />
              {arranging ? 'Done' : 'Arrange'}
            </button>
          )}
        </div>
      )}
      {arranging ? (
        <>
          <p className="menu-hint">Move a section up or down. The band stays where it is.</p>
          <ul className="menu-list arrange-list" aria-labelledby="menu-on-sheet">
            {movable.map((id, i) => {
              const name = nameOf(id)
              const count = countOf(id)
              return (
                <li key={id} className="arrange-row" data-moved={moved?.id === id || undefined}>
                  <span className="arrange-name">
                    <span>{name}</span>
                    {count !== undefined && <span className="menu-count">{count}</span>}
                  </span>
                  {([-1, 1] as const).map((by) => (
                    <button
                      key={by}
                      ref={(el) => {
                        if (el) arrows.current.set(`${id} ${by}`, el)
                        else arrows.current.delete(`${id} ${by}`)
                      }}
                      type="button"
                      className="arrange-move"
                      aria-label={`Move ${name} ${by < 0 ? 'up' : 'down'}`}
                      disabled={by < 0 ? i === 0 : i === movable.length - 1}
                      onClick={() => move(id, by)}
                    >
                      <Glyph name={by < 0 ? 'up' : 'down'} size={18} />
                    </button>
                  ))}
                </li>
              )
            })}
          </ul>
          <p className="visually-hidden" role="status">
            {moved ? `${nameOf(moved.id)}, ${movable.indexOf(moved.id) + 1} of ${movable.length}.` : ''}
          </p>
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={isOwnOrder(order)}
              onClick={() => {
                resetOrder()
                setMoved(null)
                arrange.current?.focus()
              }}
            >
              Put back the original order
            </button>
          </div>
        </>
      ) : (
        onSheet.length > 0 && (
          <ul className="menu-list" aria-labelledby="menu-on-sheet">
            {onSheet.map((id) => {
              const count = countOf(id)
              return (
                <li key={id}>
                  <button type="button" onClick={() => dialog.closeThen(() => goToSection(id))}>
                    <span>{nameOf(id)}</span>
                    {count !== undefined && <span className="menu-count">{count}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )
      )}
      {!arranging && layout.menus.length > 0 && (
        <>
          <h3 id="menu-menus" className="menu-group">
            Menus
          </h3>
          <p className="menu-hint">Each opens over the sheet. Pin one to keep it on the sheet.</p>
          <ul className="menu-list" aria-labelledby="menu-menus">
            {layout.menus.map((id) => (
              <li key={id}>
                <button type="button" aria-haspopup="dialog" onClick={() => dialog.closeThen(() => openMenu(id))}>
                  <span>{SECTION_NAME[id]}</span>
                  {counts[id] !== undefined && <span className="menu-count">{counts[id]}</span>}
                  <Glyph name="window" size={16} className="menu-opens" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!arranging && (
        <ul className="menu-list menu-apart">
          {canPopOutHere() && (
            <li>
              {/* Opened in the tap itself, which a browser requires of a pop-up. */}
              <button
                type="button"
                onClick={() => {
                  popOut(window.location.href)
                  dialog.close()
                }}
              >
                <span>Pop out</span>
                <Glyph name="window" size={16} className="menu-opens" />
              </button>
            </li>
          )}
          <li>
            <Link to={{ screen: 'settings', id: rosterId }}>Settings</Link>
          </li>
          <li>
            <Link to={{ screen: 'roster' }}>All characters</Link>
          </li>
        </ul>
      )}
    </Window>
  )
}
