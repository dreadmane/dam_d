// Asking the browser to keep this site's data. Without it a browser may clear
// saved characters under storage pressure, and Safari does after 7 days without
// a visit. The request is made when there is something worth keeping, on
// creating or importing a character (user, 2026-09-27): that follows a tap, so a
// browser that asks its user (Firefox) asks in context. Chrome and Safari
// decide silently. Nothing here ever fails a save; the answer is only shown.

export type PersistState = 'persisted' | 'not-persisted' | 'unsupported'

export type PersistApi = Pick<StorageManager, 'persist' | 'persisted'>

// The DOM types assume the API exists; older browsers and some embedded
// views lack it.
const browserStorage = (): PersistApi | undefined =>
  typeof navigator !== 'undefined' && typeof navigator.storage?.persist === 'function' ? navigator.storage : undefined

export async function persistenceState(storage: PersistApi | undefined = browserStorage()): Promise<PersistState> {
  if (!storage) return 'unsupported'
  try {
    return (await storage.persisted()) ? 'persisted' : 'not-persisted'
  } catch {
    return 'not-persisted'
  }
}

// Asks only if the data is not kept already. A browser that has refused may
// be asked again on the next create or import: Firefox remembers its user's
// answer and does not prompt twice, and the others decide without a prompt.
export async function requestPersistence(storage: PersistApi | undefined = browserStorage()): Promise<PersistState> {
  const state = await persistenceState(storage)
  if (state !== 'not-persisted') return state
  try {
    return (await storage!.persist()) ? 'persisted' : 'not-persisted'
  } catch {
    return 'not-persisted'
  }
}
