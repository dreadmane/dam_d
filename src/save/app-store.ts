// The store the app uses. Components import this and nothing below it, so
// swapping the backend (a sync service, later) is a change to this line.
//
// Every write is announced to the app's other open copies (changes.ts), so
// one that still shows the old character reloads it.

import { broadcastChanges } from './changes.ts'
import { indexedDbBackend } from './indexeddb.ts'
import { announcing, createStore } from './store.ts'

export const changes = broadcastChanges()
export const store = announcing(createStore(indexedDbBackend()), changes.announce)
