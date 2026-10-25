// The browser backend: IndexedDB, hand-rolled (no wrapper library, per the
// platform rule; chosen 2026-09-27 over localStorage for its quota and its
// per-record writes).
//
// Two object stores, keyed by roster id. `rosters` holds whole records;
// `summaries` holds what a roster list shows, so listing never reads a
// level-250 record. Every write touches both in one transaction, so they
// cannot disagree.
//
// DB_VERSION is IndexedDB's own version: it changes when the stores or
// indexes change, and runs onupgradeneeded. It is unrelated to a record's
// schemaVersion, which migrate.ts handles one record at a time.
//
// Not unit-tested: Node has no IndexedDB. Everything above this layer runs
// against memoryBackend in the tests; this file is checked in a browser.

import type { RosterRecord } from './record.ts'
import type { RosterSummary, StorageBackend } from './store.ts'

const DB_VERSION = 1
const ROSTERS = 'rosters'
const SUMMARIES = 'summaries'

// IndexedDB reports through events; these turn one request, and one whole
// transaction, into a promise.
function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function committed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function open(name: string): Promise<IDBDatabase> {
  const req = indexedDB.open(name, DB_VERSION)
  req.onupgradeneeded = () => {
    const db = req.result
    if (!db.objectStoreNames.contains(ROSTERS)) db.createObjectStore(ROSTERS)
    if (!db.objectStoreNames.contains(SUMMARIES)) db.createObjectStore(SUMMARIES)
  }
  return request(req).then((db) => {
    // Another tab running a newer app wants to upgrade the database: step
    // aside rather than block it. This tab's next write reopens.
    db.onversionchange = () => db.close()
    return db
  })
}

export function indexedDbBackend(name = 'd-amp-d'): StorageBackend {
  let db: Promise<IDBDatabase> | null = null
  const connection = () => {
    db ??= open(name).catch((err) => {
      db = null
      throw err
    })
    return db
  }

  // A closed connection (after onversionchange) throws on transaction();
  // reopen once and retry.
  async function transaction(stores: string[], mode: IDBTransactionMode): Promise<IDBTransaction> {
    try {
      return (await connection()).transaction(stores, mode)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'InvalidStateError')) throw err
      db = null
      return (await connection()).transaction(stores, mode)
    }
  }

  return {
    async list() {
      const tx = await transaction([SUMMARIES], 'readonly')
      return request(tx.objectStore(SUMMARIES).getAll() as IDBRequest<RosterSummary[]>)
    },

    async get(id) {
      const tx = await transaction([ROSTERS], 'readonly')
      return request(tx.objectStore(ROSTERS).get(id))
    },

    async put(summary: RosterSummary, record: RosterRecord) {
      const tx = await transaction([ROSTERS, SUMMARIES], 'readwrite')
      // put() stores a structured clone, so later changes to `record` do not
      // reach the saved copy.
      tx.objectStore(ROSTERS).put(record, summary.id)
      tx.objectStore(SUMMARIES).put(summary, summary.id)
      await committed(tx)
    },

    async delete(id) {
      const tx = await transaction([ROSTERS, SUMMARIES], 'readwrite')
      tx.objectStore(ROSTERS).delete(id)
      tx.objectStore(SUMMARIES).delete(id)
      await committed(tx)
    },
  }
}
