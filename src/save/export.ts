// Writing a character out (spec §4.2): one JSON file holding exactly the roster
// record at the current schema version, and beside it a markdown summary
// generated from that record. The summary is a read-only view, never an
// input: import ignores it, so the two can never disagree.

import type { RosterRecord } from './record.ts'

// <roster-name>-<YYYY-MM-DD>, safe on every file system: characters Windows
// or a phone's file app refuses become dashes.
export function exportBasename(record: RosterRecord, date: Date): string {
  const name =
    record.name
      .normalize('NFKC')
      .toLowerCase()
      // Control characters are matched on purpose: no file system allows them.
      // oxlint-disable-next-line no-control-regex
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 60) || 'character'
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
  return `${name}-${day}`
}

export function exportJson(record: RosterRecord): string {
  return JSON.stringify(record, null, 2) + '\n'
}

export interface ExportFile {
  name: string
  type: string
  text: string
}

// The character's file is <name>-<date>.dnd.json (the spec §4.2), so it is
// never taken for a Crawler Interface file (.dcc.json).
export const EXTENSION = '.dnd.json'

export async function exportFiles(record: RosterRecord, date = new Date()): Promise<ExportFile[]> {
  const base = exportBasename(record, date)
  const { summaryMarkdown } = await import('./summary.ts')
  return [
    { name: `${base}${EXTENSION}`, type: 'application/json', text: exportJson(record) },
    { name: `${base}.md`, type: 'text/markdown', text: summaryMarkdown(record, `${base}${EXTENSION}`, date) },
  ]
}

// Hands each file to the browser as a download. Both come from one click,
// so browsers treat them as the user's request.
export function download(files: ExportFile[]) {
  for (const file of files) {
    const url = URL.createObjectURL(new Blob([file.text], { type: file.type }))
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.append(a)
    a.click()
    a.remove()
    // Revoked later, not at once: some browsers start the download after
    // the click handler returns.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}
