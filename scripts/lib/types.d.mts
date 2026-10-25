// Types for the parts of types.mjs that the save schema test imports.

export function currentSaveSchema(): { file: string; version: number }
export function saveTypesSource(): Promise<string>
