// Levels and Build while the rules load (RulesLoading.tsx): the same page as
// when they're ready (main.ladder-screen), which the Journal draws as the
// shelf's page in its cover. Without the class, the loading page drew
// Classic's frame for a moment before the shelf's (found 2026-10-23, after
// PR #31). Build renders here whole; Levels' top bar holds the flash stack,
// which can't render on a server, so its loading page is the shared one.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BuildScreen } from './BuildScreen.tsx'
import { RulesLoading } from './RulesLoading.tsx'

describe('the loading page', () => {
  it('is the shelf’s page while the rules load', () => {
    const html = renderToStaticMarkup(<RulesLoading top={null} title="Levels" message={null} />)
    expect(html).toMatch(/^<main class="ladder-screen" aria-busy="true">/)
    expect(html).toContain('Loading the rules…')
  })

  it('stays the shelf’s page when they fail, with the reason', () => {
    const html = renderToStaticMarkup(<RulesLoading top={null} title="Levels" message="No such character." />)
    expect(html).toMatch(/^<main class="ladder-screen" aria-busy="false">/)
    expect(html).toContain('<p role="alert">No such character.</p>')
  })

  it('is Build’s page', () => {
    const html = renderToStaticMarkup(<BuildScreen id="x" step="class" />)
    expect(html).toMatch(/^<main class="ladder-screen" aria-busy="true">/)
    expect(html).toContain('Loading the rules…')
  })
})
