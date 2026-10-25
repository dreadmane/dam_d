import type { ReactNode } from 'react'

// The app's small glyphs (C10, carried from Crawler Interface): hand-drawn at
// 18 px in 1.5 px lines, no icon library. Each is decorative beside words
// that say the same thing, so it is hidden from assistive technology. Only
// the ones the screens draw are kept; M1 adds its own as its rows need them.

export type GlyphName = 'folder' | 'pin' | 'pinned' | 'window' | 'arrange' | 'done' | 'up' | 'down'

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const SHAPES: Record<GlyphName, ReactNode> = {
  // The notification folder (A1), at the band's top left.
  folder: <path {...line} d="M2.25 4.75h4.5l1.5 2h7.5v8.5H2.25z" />,
  // Pinning a menu to the sheet; filled once it is pinned.
  pin: <path {...line} d="M6.5 2.5h5M7.5 2.5v4.2L5 9.5h8l-2.5-2.8V2.5M9 9.5v6" />,
  pinned: (
    <>
      <path d="M7.5 2.5v4.2L5 9.5h8l-2.5-2.8V2.5z" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path {...line} d="M6.5 2.5h5M9 9.5v6" />
    </>
  ),
  // A menu that opens as a window of its own.
  window: (
    <>
      <rect {...line} x="2.75" y="3.25" width="12.5" height="11.5" rx="1" />
      <path {...line} d="M2.75 6.75h12.5" />
    </>
  ),
  // Arranging the sheet (2026-10-13): ARRANGE, DONE, and a row's two moves.
  arrange: <path {...line} d="M6 15V3.5M3 6.5l3-3 3 3M12 3v11.5M9 11.5l3 3 3-3" />,
  done: <path {...line} d="M3.5 9.5l3.5 3.5 7.5-8" />,
  up: <path {...line} d="M9 14.5V3.5M4.5 8l4.5-4.5L13.5 8" />,
  down: <path {...line} d="M9 3.5v11M4.5 10l4.5 4.5 4.5-4.5" />,
}

export function Glyph({ name, size = 14, className }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg className={['glyph', `glyph-${name}`, className].filter(Boolean).join(' ')} viewBox="0 0 18 18" width={size} height={size} aria-hidden="true" focusable="false">
      {SHAPES[name]}
    </svg>
  )
}
