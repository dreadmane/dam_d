// Where the book file is kept on this device (the spec §4.2): its own
// IndexedDB database, beside the characters' and never inside a character,
// so it is never exported with one, and adding it needed no upgrade of the
// characters' database. One file at a time: a newer one replaces it whole.
//
// Not unit-tested: Node has no IndexedDB. readBookFile and withBooks
// (books.ts) are, and this is checked in a browser by the book file's walk.
// Every call is guarded: storage that refuses (private browsing) means no
// book file, and the SRD alone still works.

import type { BookFile } from './books.ts'

const NAME = 'd-amp-d-books'
const STORE = 'file'
const KEY = 'current'

export interface StoredBookFile {
  file: BookFile
  // When this device loaded it.
  loadedAt: string
  // The file's name, as the user chose it.
  fileName: string
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = act(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
    })
  } finally {
    db.close()
  }
}

export async function storedBookFile(): Promise<StoredBookFile | null> {
  try {
    return ((await run('readonly', (s) => s.get(KEY))) as StoredBookFile | undefined) ?? null
  } catch {
    return null
  }
}

export async function storeBookFile(stored: StoredBookFile): Promise<void> {
  await run('readwrite', (s) => s.put(stored, KEY))
}

export async function removeBookFile(): Promise<void> {
  await run('readwrite', (s) => s.delete(KEY))
}
