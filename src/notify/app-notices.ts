import { useMemo, useSyncExternalStore } from 'react'
import { loadSettings } from '../settings.ts'
import { ofOwner, unreadCount } from './notices.ts'
import { createNoticeStore, NOTICES_KEY, type Extra, type NoticeInput } from './store.ts'

// The app's one notification store, on this device's localStorage beside the
// settings, and the hooks the band, the folder and the flashes read it with.

function localStorageOrNull(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const noticeStore = createNoticeStore({
  storage: localStorageOrNull(),
  now: () => new Date(),
  newId: () => crypto.randomUUID(),
  // Settings' "Show notifications as they arrive", off.
  quiet: () => !loadSettings().flashes,
})

// Another open copy of the app filed or read one.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === NOTICES_KEY) noticeStore.reload()
  })
}

// A notification about one character.
export const notifyCharacter = (characterId: string, input: NoticeInput) => noticeStore.notify(characterId, input)

// A message about the app on this device, for the list's folder.
export const notifySystem = (input: NoticeInput, extra?: Extra) => noticeStore.notify(null, input, extra)

// One folder: a character's (its roster id) or the system's (null).
export function useNotices(owner: string | null) {
  const all = useSyncExternalStore(noticeStore.subscribe, noticeStore.all)
  return useMemo(() => ({ list: ofOwner(all, owner), unread: unreadCount(all, owner) }), [all, owner])
}

// The flashes on screen for one folder's owner, newest first, each with its
// notification.
export function useFlashes(owner: string | null) {
  const all = useSyncExternalStore(noticeStore.subscribe, noticeStore.all)
  const flashes = useSyncExternalStore(noticeStore.subscribe, noticeStore.flashes)
  return useMemo(
    () =>
      flashes.flatMap((flash) => {
        const notice = all.find((n) => n.id === flash.id)
        return notice && notice.characterId === owner ? [{ ...flash, notice }] : []
      }),
    [all, flashes, owner],
  )
}
