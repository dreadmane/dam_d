// Types for the parts of rules-data.mjs that the snapshot tests import.

export interface RulesFile {
  name: string
  text: string
  json: Record<string, unknown>
}

export const SNAPSHOT_DIR: string

export function readRulesFolder(dir: string): { data: RulesFile[]; schemas: RulesFile[] }

// What data/rules/ holds, by name, sorted: files and folders alike.
export function snapshotEntries(): string[]
