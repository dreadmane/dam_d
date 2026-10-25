// npm run gen-types: regenerate src/rules/types.ts from data/rules/schemas,
// and src/save/types.ts from the newest schema in src/save/schemas.
// sync-data regenerates the rules types itself; run this after changing a
// save schema or the generator.

import { generateSaveTypes, generateTypes } from './lib/types.mjs'

const rules = await generateTypes()
console.log(`wrote ${rules.file.replaceAll('\\', '/')} (${rules.roots.length} data files)`)
const save = await generateSaveTypes()
console.log(`wrote ${save.file.replaceAll('\\', '/')} (from ${save.schema})`)
