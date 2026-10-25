// The section in view (section-in-view.ts), which the Journal's thumb index
// marks and the folded band's running head names: direction B's rule from
// the sheet concept (user, 2026-10-23).

import { describe, expect, it } from 'vitest'
import { scrollToShow, sectionInView, type SectionBox } from './section-in-view.ts'

// Ilsabet Vane on a 390 × 844 phone, scrolled: the band folded to its
// 53 px line and the quick bar's 168 px at the foot, so the open page is
// 623 px and its line a third of the way down is at 53 + 623 / 3 ≈ 260.7.
const phone = { band: 53, dock: 168, height: 844, atEnd: false }
const column = (tops: Record<string, number>): SectionBox[] => Object.entries(tops).map(([id, top]) => ({ id, top, left: 16 }))

describe('the section in view', () => {
  it('is the one whose top is nearest above the line a third of the way down the open page', () => {
    expect(sectionInView(column({ turn: -900, abilities: 100, skills: 250, spells: 400 }), phone)).toBe('skills')
  })

  it('stays the one before until the next one’s top reaches the line', () => {
    expect(sectionInView(column({ turn: -900, abilities: 100, skills: 262, spells: 700 }), phone)).toBe('abilities')
  })

  it('measures the line on the open page, so the open band moves it down', () => {
    // At the top, the band open at 255 px: the line is at 255 + 421 / 3 ≈ 395.
    const open = { ...phone, band: 255 }
    expect(sectionInView(column({ turn: 271, abilities: 380 }), open)).toBe('abilities')
    expect(sectionInView(column({ turn: 271, abilities: 400 }), open)).toBe('turn')
  })

  it('at the page’s end is the last one showing, though its top never reaches the line', () => {
    const end = { ...phone, atEnd: true }
    expect(sectionInView(column({ resources: -300, rest: 120, inventory: 500 }), end)).toBe('inventory')
  })

  it('at the page’s end never counts a section hidden under the foot', () => {
    const end = { ...phone, atEnd: true }
    // The foot starts at 844 − 168 = 676.
    expect(sectionInView(column({ rest: 120, inventory: 680 }), end)).toBe('rest')
  })

  it('on the open book, where two pages start level, is the left-hand one', () => {
    // 1280 × 900, the band open: the turn heads the right-hand page and
    // Abilities the left, level. The sheet's order lists the turn first.
    const book = { band: 255, dock: 120, height: 900, atEnd: false }
    const level: SectionBox[] = [
      { id: 'turn', top: 303, left: 676 },
      { id: 'abilities', top: 303, left: 48 },
      { id: 'skills', top: 1100, left: 48 },
    ]
    expect(sectionInView(level, book)).toBe('abilities')
    // Half a pixel apart is still level.
    expect(sectionInView([{ ...level[0], top: 303.5 }, level[1]], book)).toBe('abilities')
  })

  it('on the open book otherwise takes the nearest top above the line on either page', () => {
    const book = { band: 53, dock: 120, height: 900, atEnd: false }
    const pages: SectionBox[] = [
      { id: 'turn', top: -1200, left: 676 },
      { id: 'abilities', top: -900, left: 48 },
      { id: 'skills', top: 60, left: 48 },
      { id: 'spells', top: 200, left: 676 },
    ]
    expect(sectionInView(pages, book)).toBe('spells')
  })

  it('is the first on the page when none has reached the line, the left-hand one where two start level', () => {
    expect(sectionInView(column({ turn: 600, abilities: 900 }), phone)).toBe('turn')
    expect(
      sectionInView(
        [
          { id: 'turn', top: 600, left: 676 },
          { id: 'abilities', top: 600, left: 48 },
        ],
        phone,
      ),
    ).toBe('abilities')
  })

  it('is none on a page with no sections', () => {
    expect(sectionInView([], phone)).toBeNull()
  })
})

describe('the thumb index scrolled to show its marked tab', () => {
  // An index 300 px tall, scrolled 100 px down its tabs.
  const list = { scrollTop: 100, height: 300 }

  it('stays where it is when the tab is in view', () => {
    expect(scrollToShow({ top: 150, height: 60 }, list)).toBeNull()
  })

  it('scrolls up to a tab above, with room over it, never past the top', () => {
    expect(scrollToShow({ top: 40, height: 60 }, list)).toBe(36)
    expect(scrollToShow({ top: 2, height: 60 }, list)).toBe(0)
  })

  it('scrolls down to a tab below, with room under it', () => {
    expect(scrollToShow({ top: 380, height: 60 }, list)).toBe(380 + 60 + 4 - 300)
  })
})
