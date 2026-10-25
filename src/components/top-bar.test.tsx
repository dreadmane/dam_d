import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TopBar } from './TopBar.tsx'

// The brand: a label on the list, where it is home already, and the way to
// the list on a character's band (user, 2026-10-23).
describe('the top bar’s brand', () => {
  it('is a label on the list', () => {
    const html = renderToStaticMarkup(<TopBar brand />)
    expect(html).toContain('<span class="brand">')
    expect(html).not.toContain('<a href="/characters" class="brand"')
  })

  it('on a character’s band goes to the list, its name saying so', () => {
    const html = renderToStaticMarkup(<TopBar brand brandToList chrome="none" />)
    expect(html).toContain('<a href="/characters" class="brand" aria-label="dam’d, all characters">')
    expect(html).toContain('<span>dam’d</span></a>')
  })
})
