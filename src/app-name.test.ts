// The name the pages show (app-name.ts), held in step with the page's own
// title in index.html, which a tab shows before the app has loaded.

import { describe, expect, it } from 'vitest'
import { readIndexHtml, readManifest } from '../scripts/lib/install.mjs'
import { APP_NAME } from './app-name.ts'

describe('the name the pages show', () => {
  it('is dam’d, with the typographic apostrophe', () => {
    expect(APP_NAME).toBe('dam’d')
  })

  it('is the page’s own title before the app loads', () => {
    expect(readIndexHtml()).toContain(`<title>${APP_NAME}</title>`)
  })

  it('leaves the home screen’s name as it was, until it is changed on purpose', () => {
    expect(readManifest().name).toBe('d-amp-d')
    expect(readIndexHtml()).toContain('<meta name="apple-mobile-web-app-title" content="d-amp-d" />')
  })
})
