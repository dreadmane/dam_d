// What the install test reads from disk: the web app manifest, index.html,
// and the icons' sizes. Here rather than in the test, because the app's
// TypeScript has no Node types (src/install.test.ts).

import fs from 'node:fs'
import path from 'node:path'
import { REPO_ROOT } from './tokens.mjs'

export function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'public', 'manifest.webmanifest'), 'utf8'))
}

export function readIndexHtml() {
  return fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8')
}

// A file under public/ as the site serves it ("/icon-192.png"): its width
// and height from the PNG header (bytes 16 to 23), as "192x192", or null when
// there is no such file.
export function publicPngSize(src) {
  const file = path.join(REPO_ROOT, 'public', src)
  if (!fs.existsSync(file)) return null
  const b = fs.readFileSync(file)
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`
}
