import { markRead, parseNotices, readAll, withNotice, type Notice, type Tier } from './notices.ts'

// The notifications the app holds: the stored list, and the flashes on screen
// now. A flash is a notification sliding in under the band (A1). It files
// itself into the folder after a few seconds (Flash.tsx keeps the time), or
// goes on its dismiss, which also marks it read. A flash may carry an action,
// an Undo: it stays until the action ends, and never files itself meanwhile.
// Storage, the clock and the ids come in, so tests can pass stand-ins.

export interface FlashAction {
  label: string
  run: () => void
  // The flash was dismissed: the action is declined (the change is kept).
  decline?: () => void
}

export interface Flash {
  id: string
  action?: FlashAction
  // Focus the action as it shows: it stands in for a control the player just
  // lost, as a deleted character's row loses its ⋯.
  focus?: boolean
}

export interface NoticeInput {
  kicker: string
  lines: string[]
  tier?: Tier
}

export interface Extra {
  action?: FlashAction
  focus?: boolean
}

interface KeyValue {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const NOTICES_KEY = 'd-amp-d:notifications'

export function createNoticeStore({ storage, now, newId, quiet }: { storage: KeyValue | null; now: () => Date; newId: () => string; quiet: () => boolean }) {
  // Storage can refuse (private browsing, blocked site data): every read and
  // write is guarded, and the notifications still work for this visit.
  const read = () => {
    try {
      return storage?.getItem(NOTICES_KEY) ?? null
    } catch {
      return null
    }
  }
  const save = () => {
    try {
      storage?.setItem(NOTICES_KEY, JSON.stringify(notices))
    } catch {
      // Kept for this visit.
    }
  }

  let notices: Notice[] = parseNotices(read())
  let flashes: Flash[] = []
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  // Under the quiet setting only a flash carrying an action shows; the folder
  // keeps everything either way (A1).
  function notify(owner: string | null, input: NoticeInput, extra: Extra = {}): string {
    const notice: Notice = { id: newId(), characterId: owner, tier: input.tier ?? 'bronze', kicker: input.kicker, lines: input.lines, at: now().toISOString(), read: false }
    notices = withNotice(notices, notice)
    save()
    if (extra.action || !quiet()) flashes = [{ id: notice.id, ...extra }, ...flashes]
    emit()
    return notice.id
  }

  // Off the screen and into the folder, unread: its time is up, or its action
  // ended somewhere else.
  function file(id: string) {
    if (!flashes.some((f) => f.id === id)) return
    flashes = flashes.filter((f) => f.id !== id)
    emit()
  }

  // Off the screen and read: the player dismissed it, declining any action it
  // carried, or acted on it.
  function settle(id: string, declined: boolean) {
    const flash = flashes.find((f) => f.id === id)
    flashes = flashes.filter((f) => f.id !== id)
    notices = markRead(notices, [id])
    save()
    emit()
    if (declined) flash?.action?.decline?.()
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    all: () => notices,
    flashes: () => flashes,
    notify,
    file,
    dismiss: (id: string) => settle(id, true),
    acted: (id: string) => settle(id, false),
    readAll(owner: string | null) {
      notices = readAll(notices, owner)
      save()
      emit()
    },
    // Another open copy of the app filed or read one.
    reload() {
      notices = parseNotices(read())
      emit()
    },
  }
}

export type NoticeStore = ReturnType<typeof createNoticeStore>
