// A roster row's details (RosterList.tsx RosterMeta): the level line and the
// saved time as two spans, so the Journal can set the level line on the
// cover's label plate and the saved time under it (the shelf, user
// 2026-10-23). The words are the row's as before; the " · " that joined
// them is Classic's to draw (index.css .roster-saved), not the markup's.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RosterMeta } from './RosterList.tsx'

const AT = '2026-10-22T10:00:00.000Z'

describe('a roster row’s details', () => {
  it('hold the level line and the saved time as two spans', () => {
    const html = renderToStaticMarkup(<RosterMeta line="Level 5 · Barbarian 5 · Orc" updatedAt={AT} />)
    expect(html).toMatch(/^<span class="roster-meta"><span class="roster-level">Level 5 · Barbarian 5 · Orc<\/span> <span class="roster-saved">Saved [^<]+<\/span><\/span>$/)
  })

  it('leave the joining dot to the stylesheet', () => {
    const html = renderToStaticMarkup(<RosterMeta line="Level 1 · Fighter 1 · Human" updatedAt={AT} />)
    expect(html).not.toContain('· Saved')
  })

  it('say a character has no class yet', () => {
    const html = renderToStaticMarkup(<RosterMeta updatedAt={AT} />)
    expect(html).toContain('<span class="roster-level">No class yet</span>')
  })
})
