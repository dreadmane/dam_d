// Installable to the home screen (review A3): the web app manifest says what
// the phone needs, every icon it names is there at the size it says, and its
// colours and index.html's theme colours are the tokens', which a JSON or
// HTML file cannot read for itself.

import { describe, expect, it } from 'vitest'
import tokens from '../data/design/tokens.json'
import { publicPngSize, readIndexHtml, readManifest } from '../scripts/lib/install.mjs'

const manifest = readManifest()
const html = readIndexHtml()
const color = tokens.color as unknown as Record<string, { $value: string; $extensions?: { dnd?: { light?: string } } }>

describe('the web app manifest', () => {
  it('names the app and opens it full screen at the root', () => {
    expect(manifest.name).toBe('d-amp-d')
    expect(manifest.short_name).toBe('d-amp-d')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
  })

  it('takes its colours from the dark tokens: the canvas, and the band', () => {
    expect(manifest.background_color).toBe(color.bg.$value)
    expect(manifest.theme_color).toBe(color.surface.$value)
  })

  it('names icons that exist at the sizes it gives, one of them maskable', () => {
    for (const icon of manifest.icons) expect(publicPngSize(icon.src), icon.src).toBe(icon.sizes)
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  })
})

describe('index.html', () => {
  it('links the manifest and the iOS icon, which exists at 180 px', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />')
    expect(publicPngSize('/apple-touch-icon.png')).toBe('180x180')
  })

  it('colours the phone’s bar as the band, in each theme', () => {
    expect(html).toContain(`<meta name="theme-color" content="${color.surface.$value}" media="(prefers-color-scheme: dark)" />`)
    expect(html).toContain(`<meta name="theme-color" content="${color.surface.$extensions?.dnd?.light}" media="(prefers-color-scheme: light)" />`)
  })

  it('sets no skin and forces no theme before any script runs', () => {
    expect(html).toContain('<html lang="en">')
    expect(html).not.toMatch(/data-skin|data-theme|rel="preload"/)
  })
})
