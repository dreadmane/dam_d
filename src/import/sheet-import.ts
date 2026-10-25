// Reading a D&D Beyond sheet chosen on the list (spec §7.2): the PDF's fields,
// the sheet they make, and the character it maps to, or what went wrong in
// words. Loaded with import() only when a PDF is chosen, so the list never
// carries the reader or the rules.

import { loadRules, type Rules } from '../rules/load.ts'
import { readDndBeyondSheet, type DdbSheet } from './dndbeyond.ts'
import { readPdfFields } from './pdf-fields.ts'
import { sheetToCharacter, type ImportedSheet } from './to-character.ts'

export type SheetRead = { ok: true; fileName: string; ddb: DdbSheet; rules: Rules; imported: ImportedSheet } | { ok: false; message: string }

const REFUSED = {
  'not-pdf': 'This file is not a PDF.',
  'no-fields': 'This PDF has no fields to read. dam’d reads the character sheet D&D Beyond exports, which keeps each value in a field.',
  unreadable: 'This PDF could not be read. If another program saved it again, try the file exactly as D&D Beyond exported it.',
} as const

export async function readSheetFile(bytes: Uint8Array, fileName: string): Promise<SheetRead> {
  const pdf = await readPdfFields(bytes)
  if (!pdf.ok) return { ok: false, message: REFUSED[pdf.reason] }
  const ddb = readDndBeyondSheet(pdf.fields)
  if (!ddb) return { ok: false, message: 'This PDF has fields, but not a D&D Beyond character sheet’s.' }
  const rules = await loadRules()
  return { ok: true, fileName, ddb, rules, imported: sheetToCharacter(rules, ddb) }
}
