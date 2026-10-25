// npm run validate-data: check the committed snapshot in data/rules/. Runs
// first in `npm run build`, so a bad rules file fails the Cloudflare build
// instead of shipping (platform conventions: schema validation in CI).
//
// Also checks the manifest still matches the files, which catches an edit
// made directly in data/rules/ instead of in the workspace and synced.

import { SNAPSHOT_DIR, readManifest, readRulesFolder, report, rulesVersion, validateRules } from './lib/rules-data.mjs'

const rules = readRulesFolder(SNAPSHOT_DIR)
const result = validateRules(rules)

const manifest = readManifest()
const actual = rulesVersion(rules)
if (!manifest) {
  result.errors.push('data/rules/manifest.json is missing; run npm run sync-data')
} else if (manifest.rulesVersion !== actual) {
  result.errors.push(
    `data/rules/ does not match its manifest (manifest ${manifest.rulesVersion}, files ${actual}). ` +
      'Rules are edited in the workspace and brought in with npm run sync-data, never edited here.',
  )
}

report(result)
if (result.errors.length) {
  console.error(`validate-data: ${result.errors.length} problems`)
  process.exit(1)
}
console.log(`validate-data: ${rules.data.length} srd files and ${rules.schemas.length} schemas valid, rulesVersion ${actual}`)
