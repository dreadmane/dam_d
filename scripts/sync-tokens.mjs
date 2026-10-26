// npm run sync-tokens: refresh data/design/tokens.json from the workspace's
// domains/dnd-design/tokens/tokens.json, then regenerate
// src/styles/tokens.css.
//
// The contrast check runs, in both themes, and both files' contents are
// made, before anything is written. If a check fails, or the CSS cannot be
// made, neither is written, so a token change that breaks WCAG AA never
// reaches the repo and the repo is never left half-synced. A file whose
// content has not changed is left as it is, line endings and all. The
// workspace path is machine-specific and comes from TOKENS_DIR, usually set
// in the git-ignored .env.local.

import fs from 'node:fs'
import path from 'node:path'
import { REPO_ROOT, TOKENS_CSS, TOKENS_SNAPSHOT, checkContrast, flatten, tokensCss } from './lib/tokens.mjs'

const fail = (message) => {
  console.error(`sync-tokens: ${message}`)
  process.exit(1)
}
const rel = (p) => path.relative(REPO_ROOT, p).replaceAll('\\', '/')

const envFile = path.join(REPO_ROOT, '.env.local')
if (fs.existsSync(envFile)) process.loadEnvFile(envFile)
const source = process.env.TOKENS_DIR
if (!source) fail('TOKENS_DIR is not set. Copy the line from .env.local.example into .env.local with your workspace path.')
const file = path.join(source, 'tokens.json')
if (!fs.existsSync(file)) fail(`${file} does not exist; TOKENS_DIR should point at domains/dnd-design/tokens`)

console.log(`reading ${file}`)
const text = fs.readFileSync(file, 'utf8')
let tokens
try {
  tokens = JSON.parse(text)
} catch (err) {
  fail(`tokens.json is not valid JSON: ${err.message}`)
}
console.log(`  ${flatten(tokens).length} tokens`)

const themes = tokens.$extensions?.dnd?.themes ?? ['dark', 'light']
console.log(`checking contrast, ${themes.join(' and ')}`)
const rows = checkContrast(tokens)
const failures = rows.filter((r) => !r.ok)
for (const r of failures) {
  console.error(`  ${r.theme.padEnd(5)} ${r.fg} on ${r.bg}: ${r.problem ?? `${r.ratio.toFixed(2)}:1, needs ${r.min}:1`}`)
}
if (failures.length) fail(`${failures.length} of ${rows.length} checks failed; nothing written`)
console.log(`  all ${rows.length} checks pass`)

let files
try {
  files = [
    [TOKENS_SNAPSHOT, text],
    [TOKENS_CSS, tokensCss(tokens)],
  ]
} catch (err) {
  fail(`could not make the CSS (${err.message}); nothing written`)
}

const write = (target, content) => {
  const same = fs.existsSync(target) && fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') === content.replace(/\r\n/g, '\n')
  if (same) {
    console.log(`unchanged ${rel(target)}`)
    return
  }
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
  console.log(`wrote ${rel(target)}`)
}
for (const [target, content] of files) write(target, content)
