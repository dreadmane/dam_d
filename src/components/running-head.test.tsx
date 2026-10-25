// The Journal's running head (Hud.tsx RunningHead; the sheet concept's
// borrowing from direction B, user 2026-10-23): once the band folds to its
// line, the name is followed by the short name of the section in view, as a
// printed page's head names its chapter. Classic's line keeps the name
// alone: PlayView gives the band a running head only from the Journal's
// index, which Classic does not have.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { indexSections, SECTION_SHORT, sheetLayout } from '../play/sheet-layout.ts'
import { RunningHead } from './Hud.tsx'
import { sectionInView } from './section-in-view.ts'

// Ilsabet scrolled to Skills on a phone: the band folded.
const page = { band: 53, dock: 168, height: 844, atEnd: false }
const tops = { turn: -1400, abilities: -300, skills: 120, spells: 900, conditions: 2000, resources: 2400, rest: 2700 } as Record<string, number>
const inView = (look: 'journal' | 'classic') => sectionInView(indexSections(sheetLayout({}, [], look).sheet, look, false).map((id) => ({ id, top: tops[id], left: 16 })), page)
const head = (current: ReturnType<typeof inView>, folded = true) => renderToStaticMarkup(<RunningHead folded={folded} words={current ? SECTION_SHORT[current] : undefined} />)

describe('the running head', () => {
  it('names the section in view by its short name on the Journal’s folded line, hidden from a screen reader', () => {
    expect(inView('journal')).toBe('skills')
    expect(head(inView('journal'))).toBe('<span class="hud-running-head" aria-hidden="true">Skills</span>')
  })

  it('is not on the band while it is open', () => {
    expect(head(inView('journal'), false)).toBe('')
  })

  it('is not drawn in Classic', () => {
    expect(inView('classic')).toBeNull()
    expect(head(inView('classic'))).toBe('')
  })
})
