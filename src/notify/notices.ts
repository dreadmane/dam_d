// The notifications (review A1): what the app reports as it happens, kept
// on this device so a flash that goes is never lost. A character's
// notification is about one character and lands in its folder; a system
// message (characterId null) is about the app on this device and lands in
// the list's folder. Kept beside the settings, never in the roster store and never
// exported, so a character's file stays the character's. Pure: store.ts holds them.

export type Tier = 'bronze' | 'gold'

export interface Notice {
  id: string
  // The character it is about, or null for a system message.
  characterId: string | null
  // How much ceremony it gets (design review, 2026-10-12): gold for a
  // milestone, bronze for everything else.
  tier: Tier
  // Its label, set in capitals on screen: "Added", "Deleted".
  kicker: string
  lines: string[]
  // When it fired, ISO 8601.
  at: string
  read: boolean
}

// How many each folder keeps: the last fifty per character, and fifty system
// messages (A1, "capped at about fifty" per folder).
export const KEEP = 50

const isString = (v: unknown): v is string => typeof v === 'string'

// One stored entry, or null when it cannot be read: an unknown tier reads as
// bronze, but a notice with no id, owner, kicker, lines or time is dropped.
// A field this version does not read (Crawler Interface's floor) is ignored.
function parseNotice(v: unknown): Notice | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (!isString(o.id) || !isString(o.kicker) || !isString(o.at) || Number.isNaN(Date.parse(o.at))) return null
  if (!Array.isArray(o.lines) || !o.lines.every(isString)) return null
  if (o.characterId !== null && !isString(o.characterId)) return null
  return {
    id: o.id,
    characterId: o.characterId,
    tier: o.tier === 'gold' ? 'gold' : 'bronze',
    kicker: o.kicker,
    lines: o.lines,
    at: o.at,
    read: o.read === true,
  }
}

// The stored list, newest first, read field by field: anything unreadable is
// the same as nothing, so a damaged value never stops the app.
export function parseNotices(raw: string | null): Notice[] {
  let value: unknown
  try {
    value = raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
  if (!Array.isArray(value)) return []
  const kept = value.map(parseNotice).filter((n): n is Notice => n !== null)
  kept.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return capped(kept)
}

// Each folder's newest KEEP, in the list's order.
function capped(list: Notice[], keep = KEEP): Notice[] {
  const counts = new Map<string | null, number>()
  return list.filter((n) => {
    const count = (counts.get(n.characterId) ?? 0) + 1
    counts.set(n.characterId, count)
    return count <= keep
  })
}

// A new notification on top; the oldest in its folder goes past KEEP.
export const withNotice = (list: Notice[], notice: Notice, keep = KEEP): Notice[] => capped([notice, ...list], keep)

// One folder: a character's, or the system's (null), newest first.
export const ofOwner = (list: Notice[], owner: string | null): Notice[] => list.filter((n) => n.characterId === owner)

export const unreadCount = (list: Notice[], owner: string | null): number => list.filter((n) => n.characterId === owner && !n.read).length

export const markRead = (list: Notice[], ids: string[]): Notice[] => {
  const marking = new Set(ids)
  return list.map((n) => (marking.has(n.id) && !n.read ? { ...n, read: true } : n))
}

export const readAll = (list: Notice[], owner: string | null): Notice[] => markRead(list, ofOwner(list, owner).map((n) => n.id))
