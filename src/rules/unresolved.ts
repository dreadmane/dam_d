// A rules id this device's data doesn't have, said by name and marked (spec
// §4.2): kept, never shown bare or as nothing chosen. An import keeps a name
// the rules lack as its id (Arcana Domain as arcana-domain), so the name is
// read back from the id, with the small words a name keeps in lower case.

const SMALL = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

export const idName = (id: string) =>
  id
    .split('-')
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')

export const unresolved = (id: string) => `${idName(id)} (unresolved)`
