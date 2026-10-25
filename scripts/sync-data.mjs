// npm run sync-data: refresh data/rules/ from the workspace's
// domains/dnd-rules/data/, exactly, then regenerate the types. Only schemas/
// and the public tier, srd/, are read; books/ never enters this repo (the
// spec §2.1), whatever the workspace holds.
//
// Everything is validated before anything is written, so a failed sync leaves
// the existing snapshot untouched. The workspace path is machine-specific and
// comes from RULES_DATA_DIR, usually set in the git-ignored .env.local.

import fs from 'node:fs'
import path from 'node:path'
import {
  DATA_SUB,
  MANIFEST_NAME,
  REPO_ROOT,
  SCHEMA_SUB,
  SNAPSHOT_DIR,
  buildManifest,
  readManifest,
  readRulesFolder,
  report,
  validateRules,
} from './lib/rules-data.mjs'
import { generateTypes } from './lib/types.mjs'

const fail = (message) => {
  console.error(`sync-data: ${message}`)
  process.exit(1)
}
const rel = (p) => path.relative(REPO_ROOT, p).replaceAll('\\', '/')

const envFile = path.join(REPO_ROOT, '.env.local')
if (fs.existsSync(envFile)) process.loadEnvFile(envFile)
const source = process.env.RULES_DATA_DIR
if (!source) fail('RULES_DATA_DIR is not set. Copy .env.local.example to .env.local and put your workspace data path in it.')
for (const sub of [SCHEMA_SUB, DATA_SUB]) {
  if (!fs.existsSync(path.join(source, sub))) fail(`${source} has no ${sub}/ folder; RULES_DATA_DIR should point at domains/dnd-rules/data`)
}

console.log(`reading ${source} (${SCHEMA_SUB}/ and ${DATA_SUB}/ only)`)
const rules = readRulesFolder(source)
for (const f of rules.data) {
  const { dataVersion, complete } = f.json.meta ?? {}
  console.log(`  ${`${DATA_SUB}/${f.name}`.padEnd(30)} ${String(dataVersion).padEnd(7)} ${complete ? '' : '(meta.complete: false)'}`)
}
console.log(`  ${rules.schemas.length} schemas`)

console.log('validating')
const result = validateRules(rules)
report(result)
if (result.errors.length) fail(`${result.errors.length} problems; data/rules/ left unchanged`)
console.log('  all files valid, all references resolve')

// Anything in data/rules/ that is not the snapshot's own goes: the DCC
// snapshot's files on the first run, and any folder but schemas/ and srd/.
fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
for (const entry of fs.readdirSync(SNAPSHOT_DIR, { withFileTypes: true })) {
  const keep = entry.isDirectory() ? [SCHEMA_SUB, DATA_SUB].includes(entry.name) : entry.name === MANIFEST_NAME
  if (keep) continue
  fs.rmSync(path.join(SNAPSHOT_DIR, entry.name), { recursive: true })
  console.log(`  removed ${rel(path.join(SNAPSHOT_DIR, entry.name))}, not part of the snapshot`)
}

// Copy byte-for-byte, then remove anything the workspace no longer has, so the
// snapshot is exact.
for (const [sub, files] of [[DATA_SUB, rules.data], [SCHEMA_SUB, rules.schemas]]) {
  const dest = path.join(SNAPSHOT_DIR, sub)
  fs.mkdirSync(dest, { recursive: true })
  for (const f of files) fs.copyFileSync(path.join(source, sub, f.name), path.join(dest, f.name))
  const keep = new Set(files.map((f) => f.name))
  for (const name of fs.readdirSync(dest)) {
    if (!keep.has(name)) {
      fs.rmSync(path.join(dest, name), { recursive: true })
      console.log(`  removed ${rel(path.join(dest, name))}, no longer in the workspace`)
    }
  }
}

const previous = readManifest()
const manifest = buildManifest(rules, previous)
fs.writeFileSync(path.join(SNAPSHOT_DIR, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + '\n')
const changed = previous?.rulesVersion !== manifest.rulesVersion
console.log(`wrote ${rel(path.join(SNAPSHOT_DIR, MANIFEST_NAME))}: rulesVersion ${manifest.rulesVersion}${changed ? (previous ? ` (was ${previous.rulesVersion})` : '') : ' (unchanged)'}`)

const types = await generateTypes()
console.log(`wrote ${types.file.replaceAll('\\', '/')}`)
