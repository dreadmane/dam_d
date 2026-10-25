import { createContext } from 'react'

// Where a section of the play view is drawn (user, 2026-10-13): on the sheet;
// on the sheet because it is pinned there, with what its PINNED does; or in
// its menu's window over the page, with what its PIN does, which closes the
// window too. SheetSection.tsx reads it to frame the section to suit.
export type Place = { at: 'sheet' } | { at: 'pinned'; unpin: () => void } | { at: 'window'; headingId: string; pin: () => void }

export const SHEET: Place = { at: 'sheet' }
export const SectionPlace = createContext<Place>(SHEET)
