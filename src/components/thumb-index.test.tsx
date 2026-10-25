// The Journal's thumb index (ThumbIndex.tsx; the sheet concept's borrowing
// from direction B, user 2026-10-23): a tab for each section the sheet
// shows, in its order, a pinned menu and the death saves at 0 HP included,
// each a link to its section lettered with the short name and named by the
// full one, the section in view marked. Classic has no index.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { indexSections, SECTION_NAME, SECTION_SHORT, sheetLayout, type SectionId } from '../play/sheet-layout.ts'
import { ThumbIndex } from './ThumbIndex.tsx'

const journal = (pins = {}, deathSaves = false) => indexSections(sheetLayout(pins, [], 'journal').sheet, 'journal', deathSaves)
const render = (sections: readonly SectionId[], current: string | null = null) => renderToStaticMarkup(<ThumbIndex sections={sections} current={current} />)
const links = (html: string) => [...html.matchAll(/<a class="thumb-tab" href="#([a-z-]+)" aria-label="([^"]+)"/g)].map((m) => [m[1], m[2]])

describe('the thumb index', () => {
  it('lists the sheet’s sections in its order, each a link to its section', () => {
    const html = render(journal())
    expect(html).toMatch(/^<nav class="thumb-index" aria-label="Sections"><ol>/)
    expect(links(html)).toEqual(
      (['turn', 'abilities', 'skills', 'spells', 'conditions', 'resources', 'rest'] as const).map((id) => [id, SECTION_NAME[id]]),
    )
  })

  it('letters each tab with the short name, named by the full one', () => {
    const html = render(journal())
    expect(html).toContain('<a class="thumb-tab" href="#abilities" aria-label="Abilities and saves"><span class="thumb-tab-word">Abilities</span></a>')
    expect(html).toContain('<a class="thumb-tab" href="#turn" aria-label="On your turn"><span class="thumb-tab-word">Turn</span></a>')
    expect([...html.matchAll(/<span class="thumb-tab-word">([^<]+)<\/span>/g)].map((m) => m[1])).toEqual(journal().map((id) => SECTION_SHORT[id]))
  })

  it('gives a pinned menu a tab, in its place on the sheet', () => {
    const ids = links(render(journal({ inventory: true, attacks: true }))).map(([id]) => id)
    expect(ids).toEqual(['turn', 'attacks', 'abilities', 'skills', 'spells', 'conditions', 'resources', 'rest', 'inventory'])
  })

  it('gives the death saves a tab, first, while they stand above the sheet', () => {
    expect(links(render(journal({}, true)))[0]).toEqual(['death-saves', 'Death saves'])
    expect(links(render(journal())).map(([id]) => id)).not.toContain('death-saves')
  })

  it('marks the tab of the section in view, and that one only', () => {
    const html = render(journal(), 'skills')
    expect(html.match(/aria-current="location"/g)).toHaveLength(1)
    expect(html).toContain('href="#skills" aria-label="Skills" aria-current="location"')
  })

  it('is not drawn in Classic', () => {
    const classic = indexSections(sheetLayout({ inventory: true }, [], 'classic').sheet, 'classic', true)
    expect(classic).toEqual([])
    expect(render(classic)).toBe('')
  })
})
