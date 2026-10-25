// For tests only: the rules snapshot read from disk and indexed as the app
// indexes it, synchronously, once per test file.

import { readRulesFolder, SNAPSHOT_DIR } from '../../scripts/lib/rules-data.mjs'
import { indexRules, type Rules } from './load.ts'
import type { RulesData } from './types.ts'

let rules: Rules | null = null

export function testRules(): Rules {
  rules ??= indexRules(
    Object.fromEntries(readRulesFolder(SNAPSHOT_DIR).data.map((f) => [f.name.replace(/\.json$/, ''), f.json])) as unknown as RulesData,
  )
  return rules
}
