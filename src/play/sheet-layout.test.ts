import { describe, expect, it } from 'vitest'
import { arrangeable, fullOrder, isOwnOrder, isPinned, moveSection, pinnedByDefault, SECTION_NAME, SECTION_SHORT, sheetLayout, type SectionId } from './sheet-layout.ts'

// On the sheet from the start, in the spec §3.3's order: the quick bar, a
// menu pinned by default, then what is always there.
const ON_SHEET: SectionId[] = ['quick-bar', 'attacks', 'abilities', 'skills', 'spells', 'conditions', 'resources', 'rest']

// The sheet (the spec §3.3): what is rolled in play on it, the rest menus
// until the player pins them.
describe('the sheet and its menus', () => {
  it('start with what is rolled in play on the sheet, in the spec §3.3’s order, and every other section a menu, in the menu’s order', () => {
    expect(sheetLayout({})).toEqual({ sheet: ON_SHEET, menus: ['inventory', 'features', 'dice', 'rolls', 'scratch-pad'] })
    for (const id of ['inventory', 'features', 'dice', 'rolls', 'scratch-pad'] as const) expect(pinnedByDefault(id)).toBe(false)
    expect(pinnedByDefault('skills')).toBe(true)
    expect(pinnedByDefault('quick-bar')).toBe(true)
  })

  it('send the quick bar to the menu when unpinned, first in the menu', () => {
    const { sheet, menus } = sheetLayout({ 'quick-bar': false })
    expect(sheet).toEqual(ON_SHEET.slice(1))
    expect(menus[0]).toBe('quick-bar')
    expect(isPinned('quick-bar', {})).toBe(true)
  })

  it('move a pinned menu to the sheet, in the menu’s order whatever order it was pinned in', () => {
    const { sheet, menus } = sheetLayout({ 'scratch-pad': true, inventory: true })
    expect(sheet).toEqual([...ON_SHEET, 'inventory', 'scratch-pad'])
    expect(menus).toEqual(['features', 'dice', 'rolls'])
    expect(isPinned('inventory', { inventory: true })).toBe(true)
  })

  it('send a menu back when the player unpins it', () => {
    expect(sheetLayout({ dice: false }).menus).toContain('dice')
    expect(isPinned('dice', { dice: false })).toBe(false)
  })
})

// The Adventurer's Journal (user, 2026-10-20): On your turn first;
// Attacks a menu, since its rows are the turn's Action group; and the
// quick bar the dock at the foot of the screen, neither on the sheet nor
// a menu.
describe('the Journal’s sheet', () => {
  it('puts On your turn first, Attacks first in the menus, and the quick bar in neither', () => {
    const { sheet, menus } = sheetLayout({}, [], 'journal')
    expect(sheet).toEqual(['turn', ...ON_SHEET.filter((id) => id !== 'attacks' && id !== 'quick-bar')])
    expect(menus).toEqual(['attacks', 'inventory', 'features', 'dice', 'rolls', 'scratch-pad'])
    // A pin saved in Classic does not bring it back to the Journal's sheet.
    expect(sheetLayout({ 'quick-bar': true }, [], 'journal').sheet).not.toContain('quick-bar')
    expect(pinnedByDefault('attacks', 'journal')).toBe(false)
    expect(pinnedByDefault('attacks')).toBe(true)
  })

  it('pins Attacks back in its own place, and keeps the turn out of the arrangement', () => {
    expect(sheetLayout({ attacks: true }, [], 'journal').sheet).toEqual(['turn', ...ON_SHEET.filter((id) => id !== 'quick-bar')])
    expect(isPinned('attacks', { attacks: true }, 'journal')).toBe(true)
    // A Classic sheet ignores the Journal's pin: Attacks is always there.
    expect(sheetLayout({ attacks: false }).sheet).toEqual(ON_SHEET)
    expect(fullOrder([])).not.toContain('turn')
    expect(arrangeable('turn')).toBe(false)
    expect(arrangeable('skills')).toBe(true)
  })
})

describe('arranging the sheet', () => {
  const OWN: SectionId[] = [...ON_SHEET, 'inventory', 'features', 'dice', 'rolls', 'scratch-pad']
  const up = (stored: readonly string[], sheet: readonly SectionId[], id: SectionId) => moveSection(stored, sheet, id, -1)

  it('read nothing stored as the sheet’s own order', () => {
    expect(fullOrder([])).toEqual(OWN)
    expect(isOwnOrder([])).toBe(true)
  })

  it('make a stored order whole: unknown names dropped, each once, a missing section after the one before it', () => {
    // An order Crawler Interface stored on a device, with its own sections.
    expect(fullOrder(['hotlist', 'rolls', 'buffs', 'inventory', 'rolls'])).toEqual([...ON_SHEET, 'rolls', 'scratch-pad', 'inventory', 'features', 'dice'])
    expect(fullOrder(['scratch-pad', 'inventory'])).toEqual([...ON_SHEET, 'scratch-pad', 'inventory', 'features', 'dice', 'rolls'])
  })

  it('move Rolls up past Inventory on a sheet with both pinned', () => {
    const pins = { inventory: true, rolls: true }
    const moved = up([], sheetLayout(pins).sheet, 'rolls')
    expect(sheetLayout(pins, moved).sheet).toEqual([...ON_SHEET, 'rolls', 'inventory'])
    expect(isOwnOrder(moved)).toBe(false)
  })

  it('move a section past the one the sheet shows next to it, every section off the sheet keeping its place', () => {
    // Features and Dice are off the sheet, between Inventory and Rolls.
    const moved = up([], sheetLayout({ inventory: true, rolls: true }).sheet, 'rolls')
    expect(fullOrder(moved)).toEqual([...ON_SHEET, 'rolls', 'inventory', 'features', 'dice', 'scratch-pad'])
    expect(sheetLayout({ inventory: true, rolls: true, dice: true }, moved).sheet).toEqual([...ON_SHEET, 'rolls', 'inventory', 'dice'])
  })

  it('move nothing past an end', () => {
    const sheet = sheetLayout({ inventory: true, rolls: true }).sheet
    expect(up([], sheet, 'quick-bar')).toEqual(OWN)
    expect(moveSection([], sheet, 'rolls', 1)).toEqual(OWN)
  })

  it('keep an unpinned menu’s place for when it is pinned again', () => {
    const pins = { inventory: true, 'scratch-pad': true }
    const order = up([], sheetLayout(pins).sheet, 'scratch-pad')
    expect(sheetLayout(pins, order).sheet).toEqual([...ON_SHEET, 'scratch-pad', 'inventory'])
    expect(sheetLayout({ inventory: true }, order).sheet).toEqual([...ON_SHEET, 'inventory'])
    expect(sheetLayout(pins, order).sheet).toEqual([...ON_SHEET, 'scratch-pad', 'inventory'])
  })
})

// The short names (the Journal's thumb index and running head): each a word
// of the section's own name, so what a tab shows is in what a screen reader
// says for it (WCAG 2.5.3, label in name).
describe('a section’s short name', () => {
  it('is in its full name, for every section', () => {
    for (const id of Object.keys(SECTION_NAME) as SectionId[]) expect(SECTION_NAME[id].toLowerCase()).toContain(SECTION_SHORT[id].toLowerCase())
  })

  it('is one word where the name allows', () => {
    const long = (Object.keys(SECTION_SHORT) as SectionId[]).filter((id) => SECTION_SHORT[id].includes(' '))
    expect(long).toEqual(['death-saves', 'quick-bar', 'scratch-pad'])
    expect(SECTION_SHORT.turn).toBe('Turn')
    expect(SECTION_SHORT.abilities).toBe('Abilities')
    expect(SECTION_SHORT.resources).toBe('Resources')
  })
})
