import { useEffect, useRef } from 'react'
import { SECTION_NAME, SECTION_SHORT, type SectionId } from '../play/sheet-layout.ts'
import { goToSection } from './sections-nav.ts'
import { scrollToShow } from './section-in-view.ts'

// The Journal's thumb index (the sheet concept's borrowing from direction B,
// user 2026-10-23): a paper tab for each section the sheet shows, cut into
// the page's fore-edge down its right-hand side, between the band and the
// quick bar (index.css, the thumb index). Each tab is lettered with the
// section's short name and named for a screen reader by its full one; the
// tab of the section in view (section-in-view.ts) is marked as where the
// reader is. A tab goes to its section as the menu does (goToSection): it
// lands clear of the band and moves focus to the section's heading.
//
// Where the fore-edge is too short for every tab, the index scrolls inside
// it, and the marked tab is brought into the index's own view: when the
// section in view changes, or the index's height does (the band opening),
// never while a thumb scrolls the index, and never by scrolling the page.

// The room left round the marked tab when the index scrolls to it: a third
// of a tab, so the next tab shows at the edge, cut off, saying there are more.
const ROOM = 16

export function ThumbIndex({ sections, current }: { sections: readonly SectionId[]; current: string | null }) {
  const list = useRef<HTMLOListElement>(null)
  const key = sections.join(' ')

  useEffect(() => {
    const ol = list.current
    if (!ol) return
    const show = () => {
      const tab = ol.querySelector<HTMLElement>('[aria-current]')
      if (!tab) return
      const top = tab.getBoundingClientRect().top - ol.getBoundingClientRect().top + ol.scrollTop
      const to = scrollToShow({ top, height: tab.offsetHeight }, { scrollTop: ol.scrollTop, height: ol.clientHeight }, ROOM)
      if (to !== null) ol.scrollTop = to
    }
    show()
    const sizes = new ResizeObserver(show)
    sizes.observe(ol)
    return () => sizes.disconnect()
  }, [current, key])

  if (!sections.length) return null
  return (
    <nav className="thumb-index" aria-label="Sections">
      <ol ref={list}>
        {sections.map((id) => (
          <li key={id}>
            <a
              className="thumb-tab"
              href={`#${id}`}
              aria-label={SECTION_NAME[id]}
              aria-current={id === current ? 'location' : undefined}
              onClick={(e) => {
                // A new tab or window opens the sheet at the section, as the
                // link says; a plain click goes there in place.
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                goToSection(id)
              }}
            >
              <span className="thumb-tab-word">{SECTION_SHORT[id]}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
