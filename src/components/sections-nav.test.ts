import { describe, expect, it } from 'vitest'
import { scrollTargetFor } from './sections-nav.ts'

// The band is 229 px open and 53 px collapsed, as Crawler Interface's
// example's was on a phone.
const band = { open: 229, collapsed: 53 }

describe('scrolling to a section', () => {
  it('sets a deep section just under the collapsed band', () => {
    expect(scrollTargetFor(2000, band, 12)).toBe(2000 - 53 - 12)
  })

  it('sets a section near the top under the open band, since the band is open there', () => {
    // The first section under the band.
    expect(scrollTargetFor(245, band, 12)).toBe(4)
    expect(scrollTargetFor(260, band, 12)).toBe(19)
  })

  it('never scrolls above the page', () => {
    expect(scrollTargetFor(100, band, 12)).toBe(0)
  })

  it('collapses the band only where the page has scrolled past it', () => {
    // 53 + 12 above a section at 294 is 229, exactly where the band collapses.
    expect(scrollTargetFor(294, band, 12)).toBe(229)
    expect(scrollTargetFor(293, band, 12)).toBe(52)
  })
})
