import type { ReactNode } from 'react'
import { APP_NAME } from '../app-name.ts'
import { Link } from './Link.tsx'
import { Mark } from './Mark.tsx'

// The row above every screen's heading: the screen's own way back on the
// left, Settings on the right, in the same place everywhere (spec §3.3,
// Settings). `end` sits just before Settings, for a screen's own status. On a
// character's screens, `characterId` opens Settings with that character's
// section.
//
// `brand` puts the mark and the product's name on the left (A4), after the
// folder: on the list's row, the one screen with no character to anchor it,
// and on a character's band (user, 2026-10-23), so the sheet says whose app
// it is too. The open band shows it; the folded line keeps its room for the
// name and the running head. On a character's band the brand is also the
// way to the list (`brandToList`, user 2026-10-23), as a site's mark is;
// Menu keeps All characters too. The band says its
// controls as words in the display face (design review, 2026-10-12):
// Settings is a word there and on the list (`chrome="words"`), and on the
// sheet it leaves the row for the menu (`chrome="none"`). Screens outside the
// band keep the gear. The children come first, so the notification folder
// sits top left on every band (A1).
export function TopBar({
  children,
  end,
  characterId,
  brand = false,
  brandToList = false,
  chrome = brand ? 'words' : 'icons',
}: {
  children?: ReactNode
  end?: ReactNode
  characterId?: string
  brand?: boolean
  brandToList?: boolean
  chrome?: 'icons' | 'words' | 'none'
}) {
  const settings = characterId ? ({ screen: 'settings', id: characterId } as const) : ({ screen: 'settings' } as const)
  return (
    <div className="top-bar">
      <div>
        {children}
        {brand &&
          (brandToList ? (
            // Named outright: the brand's parts are flex items, whose words
            // a browser joins with a space ("dam’d , all characters"). The
            // name starts with the visible words (WCAG 2.5.3).
            <Link to={{ screen: 'roster' }} className="brand" aria-label={`${APP_NAME}, all characters`}>
              <Mark />
              <span>{APP_NAME}</span>
            </Link>
          ) : (
            <span className="brand">
              <Mark />
              <span>{APP_NAME}</span>
            </span>
          ))}
      </div>
      {end}
      {chrome === 'words' && (
        <Link to={settings} className="chrome-word">
          Settings
        </Link>
      )}
      {chrome === 'icons' && (
        <Link to={settings} className="icon-link" aria-label="Settings">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L14.9 3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13ZM12.9 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
            />
          </svg>
        </Link>
      )}
    </div>
  )
}
