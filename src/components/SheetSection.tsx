import { useContext, type ReactNode, type Ref } from 'react'
import { SECTION_NAME, type SectionId } from '../play/sheet-layout.ts'
import { Glyph } from './Glyph.tsx'
import { SectionHeading } from './SectionHeading.tsx'
import { SectionPlace } from './section-place.ts'

// The frame of a play-view section. On the sheet it is a section with its
// heading, carrying its id, name and count for the menu (A16); a
// pinned one's heading ends in PINNED, which a tap takes back to the menu. In
// its menu's window, the window's heading names it and ends in PIN.
export function SheetSection({
  id,
  title,
  count,
  info,
  className,
  frameRef,
  children,
}: {
  id: SectionId
  // The heading's words where they differ from the section's name, which
  // the menu keeps (the Journal's turn reads Exploring while exploring).
  title?: string
  count?: string
  info?: ReactNode
  className?: string
  frameRef?: Ref<HTMLElement>
  children: ReactNode
}) {
  const place = useContext(SectionPlace)
  const name = SECTION_NAME[id]
  if (place.at === 'window') {
    return (
      <section className={['menu-body', className].filter(Boolean).join(' ')} aria-labelledby={place.headingId} ref={frameRef}>
        <div className="window-header menu-head">
          <h2 id={place.headingId}>
            {name}
            {count !== undefined && <span className="heading-count">{count}</span>}
            {info && <> {info}</>}
          </h2>
          <PinButton id={id} pinned={false} onClick={place.pin} />
        </div>
        {children}
      </section>
    )
  }
  return (
    <section id={id} data-menu={name} data-menu-count={count} className={className} aria-labelledby={`${id}-heading`} ref={frameRef}>
      <SectionHeading id={`${id}-heading`} count={count} info={info} after={place.at === 'pinned' ? <PinButton id={id} pinned onClick={place.unpin} /> : undefined}>
        {title ?? name}
      </SectionHeading>
      {children}
    </section>
  )
}

// PIN in a menu's window, PINNED on the sheet: the words the band's own
// controls use, in the display face.
function PinButton({ id, pinned, onClick }: { id: SectionId; pinned: boolean; onClick: () => void }) {
  const name = SECTION_NAME[id]
  return (
    <button
      type="button"
      className="pin-button"
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${name}: it goes back to the menu` : `Pin ${name} to the sheet`}
      onClick={onClick}
    >
      <Glyph name={pinned ? 'pinned' : 'pin'} size={16} />
      {pinned ? 'Pinned' : 'Pin'}
    </button>
  )
}
