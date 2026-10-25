// The Journal's hand-inked edge (JournalDefs.tsx) lives at the app's root
// (the shelf, user 2026-10-23): every screen in the Journal inks a frame
// with it, not only the sheet, so it is drawn once in main.tsx while the
// Journal look is on, and no screen draws a second copy (two filters with
// one id would leave which one applies to chance).

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { JournalDefs, JournalRoot } from './JournalDefs.tsx'
import { journalOn } from './journal-look.ts'

const sources = import.meta.glob(['../*.tsx', '../components/*.tsx', '../screens/*.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('the Journal’s definitions', () => {
  it('define the rough edge index.css inks frames with', () => {
    expect(renderToStaticMarkup(<JournalDefs />)).toContain('<filter id="journal-rough"')
  })

  it('follow the look the page is drawn in', () => {
    const root = (look: string | null) => ({ getAttribute: (name: string) => (name === 'data-look' ? look : null) })
    expect(journalOn(root('journal'))).toBe(true)
    expect(journalOn(root('classic'))).toBe(false)
    expect(journalOn(root(null))).toBe(false)
  })

  it('draw nothing where there is no page to read the look from', () => {
    expect(renderToStaticMarkup(<JournalRoot />)).toBe('')
  })

  it('are drawn at the app’s root, and by no screen', () => {
    expect(sources['../main.tsx']).toMatch(/<JournalRoot \/>/)
    const drawing = Object.entries(sources)
      .filter(([, text]) => /<JournalDefs\b/.test(text))
      .map(([file]) => file)
    expect(drawing).toEqual(['./JournalDefs.tsx'])
  })
})
