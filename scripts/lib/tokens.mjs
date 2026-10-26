// Shared by sync-tokens and the token tests: reading the design tokens, the
// WCAG contrast check, and the CSS they generate. The workspace's
// domains/dnd-design/tokens/tokens.json is the source of truth.
// data/design/tokens.json keeps the copy a build ships with, and
// src/styles/tokens.css is generated from it.

import fs from 'node:fs'
import path from 'node:path'

export const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
export const TOKENS_SNAPSHOT = path.join(REPO_ROOT, 'data', 'design', 'tokens.json')
export const TOKENS_CSS = path.join(REPO_ROOT, 'src', 'styles', 'tokens.css')

// Every token in the file as { path, type, value, light }, where path is its
// dotted name (color.health.good). A group's $type applies to the tokens
// inside it, as DTCG specifies; keys starting with $ are metadata.
export function flatten(tokens) {
  const out = []
  const walk = (node, trail, inheritedType) => {
    const type = node.$type ?? inheritedType
    if ('$value' in node) {
      out.push({ path: trail.join('.'), type, value: node.$value, light: node.$extensions?.dnd?.light ?? node.$value })
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$') && child && typeof child === 'object') walk(child, [...trail, key], type)
    }
  }
  walk(tokens, [], undefined)
  return out
}

// WCAG 2.1 relative luminance and contrast ratio, for #rrggbb colours.
function luminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`${hex} is not a #rrggbb colour`)
  const [r, g, b] = m[1].match(/../g).map((h) => {
    const c = parseInt(h, 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Every declared pair in each of the file's themes ($extensions.dnd.themes;
// dark and light if it names none). Returns one row per pair and theme, with
// ok false where it falls short or names a token that does not exist.
export function checkContrast(tokens) {
  const byPath = new Map(flatten(tokens).map((t) => [t.path, t]))
  const pairs = tokens.$extensions?.dnd?.contrast?.pairs ?? []
  const themes = tokens.$extensions?.dnd?.themes ?? ['dark', 'light']
  const rows = []
  for (const { fg, bg, min } of pairs) {
    for (const theme of themes) {
      const f = byPath.get(fg)
      const b = byPath.get(bg)
      if (!f || !b) {
        rows.push({ fg, bg, theme, min, ratio: 0, ok: false, problem: `no token ${!f ? fg : bg}` })
        continue
      }
      const pick = (t) => (theme === 'dark' ? t.value : t.light)
      const ratio = contrastRatio(pick(f), pick(b))
      rows.push({ fg, bg, theme, min, ratio, ok: ratio >= min })
    }
  }
  return rows
}

const cssName = (tokenPath) => `--${tokenPath.replaceAll('.', '-')}`

// A DTCG fontFamily may be a list; CSS wants it comma-separated, with any
// name containing a space quoted.
const cssValue = (value) =>
  Array.isArray(value) ? value.map((v) => (/\s/.test(v) ? `'${v}'` : v)).join(', ') : String(value)

// Dark on :root, because dark is the designed theme. Light follows the
// device's setting unless the page says otherwise with data-theme, which the
// settings screen will set.
export function tokensCss(tokens) {
  const all = flatten(tokens)
  const themed = all.filter((t) => t.value !== t.light)
  const decls = (list, key, indent = '  ') => list.map((t) => `${indent}${cssName(t.path)}: ${cssValue(t[key])};`).join('\n')
  const version = tokens.$extensions?.dnd?.tokensVersion ?? 'unversioned'
  return `/* Generated from data/design/tokens.json (tokens ${version}) by
   npm run sync-tokens. Do not edit: change the tokens in the workspace's
   domains/dnd-design/tokens/, then re-sync. A test fails if this file is
   out of date. */

:root {
  color-scheme: dark;
${decls(all, 'value')}
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    color-scheme: light;
${decls(themed, 'light', '    ')}
  }
}

:root[data-theme='light'] {
  color-scheme: light;
${decls(themed, 'light')}
}
`
}

// The committed tokens.css as text. The test reads it through here because
// Vitest stubs out CSS imports, ?raw included.
export function readTokensCss() {
  return fs.readFileSync(TOKENS_CSS, 'utf8')
}

// The app's stylesheet as text, for tests of how it uses the tokens.
export function readAppCss() {
  return fs.readFileSync(path.join(REPO_ROOT, 'src', 'index.css'), 'utf8')
}

// Any file in the repo as text, by its path from the root, for tests that
// read the source itself (the app's tests have no Node types of their own).
export function readRepoFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8')
}
