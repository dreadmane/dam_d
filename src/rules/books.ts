// The book file (the spec §4.2): the private tier, what only the user's PHB
// or DMG prints, restated, built in the workspace from dnd-rules'
// data/books/ and imported by the user on each device. It never ships with
// the app. Its records join the SRD's when the rules load (load.ts), in the
// same schemas, so everything that reads the rules reads them alike.
//
// Pure, so it is tested without a browser: reading a file, and merging it
// into the SRD's data. book-store.ts keeps it on the device.

import { APP_NAME } from '../app-name.ts'
import type { RulesData } from './types.ts'

export interface BookFile {
  kind: 'd-amp-d-books'
  formatVersion: 1
  builtOn: string
  // A hash of the content: a newer file has another.
  booksVersion: string
  files: Partial<Record<BookFileName, Record<string, unknown>>>
}

// The files a book file may carry, each the key its records sit under.
export const BOOK_FILES = {
  backgrounds: 'backgrounds',
  classes: 'subclasses',
  feats: 'feats',
  'magic-items': 'items',
  species: 'species',
  spells: 'spells',
} as const

export type BookFileName = keyof typeof BOOK_FILES

export type BookRead = { ok: true; file: BookFile } | { ok: false; error: string }

// A book file as read from disk, or what's wrong with it, in words. Its
// records are not each checked against their schemas here: the workspace
// validates them before it builds the file. This checks that it is one, and
// that it holds only the private tier's restated records.
export function readBookFile(text: string): BookRead {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This isn’t a JSON file.' }
  }
  const v = value as Partial<BookFile> | null
  if (!v || typeof v !== 'object' || v.kind !== 'd-amp-d-books') return { ok: false, error: `This isn’t a ${APP_NAME} book file. A book file is named d-amp-d-books-<date>.json.` }
  if (v.formatVersion !== 1) return { ok: false, error: `This book file is format ${String(v.formatVersion)}, which this version of the app can’t read.` }
  if (typeof v.builtOn !== 'string' || typeof v.booksVersion !== 'string' || !v.files || typeof v.files !== 'object') return { ok: false, error: 'This book file is missing its date, version or records.' }
  for (const [name, data] of Object.entries(v.files)) {
    const key = BOOK_FILES[name as BookFileName]
    if (!key) return { ok: false, error: `This book file holds an unknown part, ${name}.` }
    const meta = (data as { meta?: { tier?: string; textPolicy?: string } }).meta
    if (meta?.tier !== 'books' || meta.textPolicy !== 'restated') return { ok: false, error: `This book file’s ${name} isn’t marked as the restated books tier.` }
    if (!Array.isArray((data as Record<string, unknown>)[key])) return { ok: false, error: `This book file’s ${name} has no ${key}.` }
  }
  return { ok: true, file: v as BookFile }
}

const recordsOf = (file: BookFile, name: BookFileName) => ((file.files[name]?.[BOOK_FILES[name]] as { id: string }[] | undefined) ?? [])

// How many records it holds, by file, for Settings to say.
export function bookCounts(file: BookFile): { name: BookFileName; count: number }[] {
  return (Object.keys(BOOK_FILES) as BookFileName[]).map((name) => ({ name, count: recordsOf(file, name).length })).filter((c) => c.count > 0)
}

// The SRD's data with the book file's records added. A record the SRD
// already has by id stays the SRD's (the tier rule: what the SRD prints is
// public). A subclass joins its class through the classes file's own
// subclasses list, which rules/load.ts indexes beside the classes'. A spell
// joins the spell list of each class its record names, as the SRD's class
// lists name theirs.
export function withBooks(data: RulesData, file: BookFile | null): RulesData {
  if (!file) return data
  const add = <T extends { id: string }>(srd: readonly T[], books: readonly { id: string }[]): T[] => {
    const have = new Set(srd.map((r) => r.id))
    return [...srd, ...(books.filter((r) => !have.has(r.id)) as T[])]
  }
  const srdSubclasses = new Set(data.classes.classes.flatMap((c) => c.subclasses.map((s) => s.id)))
  const bookSubclasses = recordsOf(file, 'classes').filter((s) => !srdSubclasses.has(s.id))
  const srdSpells = new Set(data.spells.spells.map((s) => s.id))
  const bookSpells = (recordsOf(file, 'spells') as { id: string; classes?: string[] }[]).filter((s) => !srdSpells.has(s.id))
  const classes = data.classes.classes.map((c) => {
    const more = bookSpells.filter((s) => s.classes?.includes(c.id)).map((s) => s.id)
    return more.length && c.spellList ? { ...c, spellList: [...c.spellList, ...more] } : c
  })
  return {
    ...data,
    classes: { ...data.classes, classes, subclasses: add(data.classes.subclasses ?? [], bookSubclasses) },
    species: { ...data.species, species: add(data.species.species, recordsOf(file, 'species')) },
    backgrounds: { ...data.backgrounds, backgrounds: add(data.backgrounds.backgrounds, recordsOf(file, 'backgrounds')) },
    feats: { ...data.feats, feats: add(data.feats.feats, recordsOf(file, 'feats')) },
    spells: { ...data.spells, spells: add(data.spells.spells, recordsOf(file, 'spells')) },
    'magic-items': { ...data['magic-items'], items: add(data['magic-items'].items, recordsOf(file, 'magic-items')) },
  }
}
