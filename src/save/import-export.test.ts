// Export and import (spec §4.2): what a file looks like, what reading one
// accepts and refuses, and that an export imports back unchanged.

import { describe, expect, it } from 'vitest'
import { rulesVersion } from '../rules/data.ts'
import { exportBasename, exportFiles, exportJson } from './export.ts'
import blankJson from './fixtures/roster-v1-blank.json'
import filledJson from './fixtures/roster-v1-filled.json'
import { acceptImport, asCopy, CRAWLER_INTERFACE_FILE, isCrawlerInterfaceFile, readImport } from './import.ts'
import { SCHEMA_VERSION, type RosterRecord } from './record.ts'
import { coinsLine } from './summary.ts'

const blank = blankJson as unknown as RosterRecord
const filled = filledJson as unknown as RosterRecord
const DAY = new Date(2026, 9, 19, 15, 0)

// A Crawler Interface save as its app wrote one: a version 1 roster whose
// entity is a crawler (the fields that matter here; the rest are like them).
const crawlerFile = {
  id: 'example-carl',
  schemaVersion: 1,
  gameDataVersion: '7c21e158a83a',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  name: 'Carl (Example)',
  primaryEntityId: 'carl',
  entities: [{ id: 'carl', kind: 'crawler', mode: 'play', name: 'Carl (Example)', level: 27, floor: 4, stats: { unenhanced: { str: 43 } } }],
}

describe('export', () => {
  it.each([
    ['Lia Brightwater', 'lia-brightwater-2026-10-19'],
    ['Princess Donut: The Queen?', 'princess-donut-the-queen-2026-10-19'],
    ['  ..a/b\\c  ', 'a-b-c-2026-10-19'],
    ['', 'character-2026-10-19'],
    ['???', 'character-2026-10-19'],
  ])('names the file for %j', (name, expected) => {
    expect(exportBasename({ ...blank, name }, DAY)).toBe(expected)
  })

  it('writes two files from one export: the record, as .dnd.json, and its summary', async () => {
    const files = await exportFiles(filled, DAY)
    expect(files.map((f) => f.name)).toEqual(['lia-brightwater-2026-10-19.dnd.json', 'lia-brightwater-2026-10-19.md'])
    expect(JSON.parse(files[0].text)).toEqual(filled)
  })

  it('summarises the name, the coins, the inventory and the notes, and names the file to import instead', async () => {
    const [, md] = await exportFiles(filled, DAY)
    expect(md.text).toContain('# Lia Brightwater')
    expect(md.text).toContain('A read-only summary of lia-brightwater-2026-10-19.dnd.json; import that file, not this one.')
    expect(md.text).toContain('## Coins\n\n1 pp, 15 gp, 3 sp, 14 cp')
    expect(md.text).toContain('## Inventory (3)')
    expect(md.text).toContain('| Rope | 1 | 5 | camp, climbing | Hempen, knotted every few feet. |')
    expect(md.text).toContain('| Candles | 6 |  |  |  |')
    expect(md.text).toContain('## Notes\n\nOwes the ferryman a favour.\nAsk about the bell tower.')
  })

  it('summarises a blank character as unnamed, with no coins, and leaves out what is empty', async () => {
    const [, md] = await exportFiles(blank, DAY)
    expect(md.text).toContain('# Unnamed character')
    expect(md.text).toContain('## Coins\n\nNone')
    expect(md.text).not.toContain('## Inventory')
    expect(md.text).not.toContain('## Notes')
    expect(coinsLine({ cp: 0, sp: 0, ep: 2, gp: 0, pp: 0 })).toBe('2 ep')
  })

  it('keeps player text from breaking a table', async () => {
    const odd = structuredClone(filled)
    odd.entities[0].inventory[0].name = 'Pipe | Wrench\nDeluxe'
    const [, md] = await exportFiles(odd, DAY)
    expect(md.text).toContain('| Pipe \\| Wrench Deluxe |')
  })
})

describe('import', () => {
  it.each([
    ['blank', blank],
    ['filled', filled],
  ])('imports an export of the %s character back unchanged', async (_, record) => {
    const outcome = await readImport(exportJson(record))
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.record).toEqual(record)
  })

  it('refuses a Crawler Interface file by name, in plain words', async () => {
    expect(isCrawlerInterfaceFile(crawlerFile)).toBe(true)
    expect(isCrawlerInterfaceFile(filled)).toBe(false)
    expect(await readImport(JSON.stringify(crawlerFile))).toEqual({ ok: false, message: CRAWLER_INTERFACE_FILE, details: [] })
    expect(CRAWLER_INTERFACE_FILE).toBe('This is a Crawler Interface file. dam’d keeps D&D characters.')
  })

  it('refuses a file that is not JSON', async () => {
    expect(await readImport('# Lia\n\nA markdown summary')).toMatchObject({ ok: false, message: expect.stringContaining('not valid JSON') })
  })

  it('refuses JSON that is not a character', async () => {
    expect(await readImport('{"hello": "world"}')).toMatchObject({ ok: false, message: expect.stringContaining('not a saved character') })
  })

  it('refuses a file from a newer app, and says to update', async () => {
    const future = exportJson({ ...blank, schemaVersion: SCHEMA_VERSION + 1 } as unknown as RosterRecord)
    expect(await readImport(future)).toMatchObject({ ok: false, message: expect.stringContaining('Update the app') })
  })

  it('refuses a damaged file and says where', async () => {
    const damaged = structuredClone(filled) as any
    damaged.entities[0].coins.gp = -3
    damaged.entities[0].gold = 12
    const outcome = await readImport(JSON.stringify(damaged))
    expect(outcome).toEqual({
      ok: false,
      message: 'This file does not match the character save format, so it was not imported.',
      details: ['entities[0].coins.gp should be at least 0', 'entities[0].gold is not a field this format has'],
    })
  })

  it('reports nothing to re-check when the rules data is the same', async () => {
    const outcome = await readImport(exportJson({ ...filled, gameDataVersion: rulesVersion }))
    expect(outcome.ok && outcome.report).toEqual({ fromVersion: 1, migrations: [], savedAgainst: null, unresolved: [] })
  })

  it('says when the file was made against other rules data, and bumps it only once the player accepts', async () => {
    const outcome = await readImport(JSON.stringify({ ...filled, gameDataVersion: 'older-rules' }))
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.report).toEqual({ fromVersion: 1, migrations: [], savedAgainst: 'older-rules', unresolved: [] })
    expect(outcome.record.gameDataVersion).toBe('older-rules')
    expect(acceptImport(outcome.record).gameDataVersion).toBe(rulesVersion)
  })

  it('imports as a copy under new ids, keeping the primary entity pointer', () => {
    let n = 0
    const copy = asCopy(filled, () => `new-${++n}`)
    expect(copy.id).not.toBe(filled.id)
    expect(copy.name).toBe('Lia Brightwater (copy)')
    expect(copy.entities[0].name).toBe('Lia Brightwater (copy)')
    expect(copy.primaryEntityId).toBe(copy.entities[0].id)
    expect(copy.entities[0].id).not.toBe(filled.entities[0].id)
    expect(copy.entities[0].inventory).toEqual(filled.entities[0].inventory)
  })
})
