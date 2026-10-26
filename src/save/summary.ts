// The markdown summary written beside every export (spec §4.2, Crawler
// Interface's Q14): a plain read-only view of the record, for a DM, a chat,
// or reading a year later without this app. It is generated from the JSON
// every time and never read back, so it cannot drift.
//
// It carries the player's own data, never the book's text (the workspace
// copyright line). In M0 that is the name, the inventory, the coins and the
// notes; M1 adds what the rules derive. Loaded with import(), so the main
// bundle never carries it.

import { characterName } from '../components/character-name.ts'
import { COINS } from '../play/inventory.ts'
import type { CharacterEntity, RosterRecord } from './record.ts'

// Player text goes in table cells: a pipe or a line break would end the cell,
// and a backslash would escape the pipe after it, so backslashes are escaped
// first (#43).
export const cell = (s: string) => s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')

function table(head: string[], rows: string[][]): string[] {
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)]
}

function section(title: string, lines: string[]): string[] {
  return lines.length ? [`## ${title}`, '', ...lines, ''] : []
}

// "15 gp, 3 sp, 14 cp", largest first; none held says so.
export function coinsLine(coins: CharacterEntity['coins']): string {
  const held = COINS.filter((c) => coins[c] > 0).toReversed()
  return held.length ? held.map((c) => `${coins[c].toLocaleString('en-US')} ${c}`).join(', ') : 'None'
}

function entityLines(e: CharacterEntity): string[] {
  return [
    ...section('Coins', [coinsLine(e.coins)]),
    ...section(
      `Inventory (${e.inventory.length})`,
      e.inventory.length
        ? table(
            ['Item', 'Qty', 'Weight (lb each)', 'Tags', 'Description'],
            e.inventory.map((i) => [i.name, String(i.quantity), i.weight === undefined ? '' : String(i.weight), i.tags.join(', '), i.description]),
          )
        : [],
    ),
    ...section('Notes', e.notes.trim() ? [e.notes] : []),
  ]
}

export function summaryMarkdown(record: RosterRecord, jsonName: string, date: Date): string {
  const multi = record.entities.length > 1
  const lines = [
    `# ${characterName(record.name)}`,
    '',
    `Exported from d-amp-d on ${date.toISOString().slice(0, 10)}. A read-only summary of ${jsonName}; import that file, not this one.`,
    '',
    ...record.entities.flatMap((e) => (multi ? [`# ${characterName(e.name)}`, '', ...entityLines(e)] : entityLines(e))),
  ]
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}
