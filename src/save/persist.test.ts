// Asking the browser to keep this site's data (persistent storage), against
// the ways browsers answer: granted, refused, already granted, or no API.

import { describe, expect, it, vi } from 'vitest'
import { persistenceState, requestPersistence, type PersistApi } from './persist.ts'

const api = (persisted: boolean, grants: boolean): PersistApi & { persist: ReturnType<typeof vi.fn> } => ({
  persisted: vi.fn(async () => persisted),
  persist: vi.fn(async () => grants),
})

describe('persistent storage', () => {
  it('asks when not yet kept, and reports the answer', async () => {
    expect(await requestPersistence(api(false, true))).toBe('persisted')
    expect(await requestPersistence(api(false, false))).toBe('not-persisted')
  })

  it('does not ask again once the browser keeps the data', async () => {
    const storage = api(true, true)
    expect(await requestPersistence(storage)).toBe('persisted')
    expect(storage.persist).not.toHaveBeenCalled()
  })

  it('reports a browser without the API, or one that throws, rather than failing', async () => {
    expect(await requestPersistence(undefined)).toBe('unsupported')
    expect(await persistenceState(undefined)).toBe('unsupported')
    const broken = { persisted: async () => false, persist: async () => Promise.reject(new Error('denied')) }
    expect(await requestPersistence(broken)).toBe('not-persisted')
  })

  it('reads the state without asking', async () => {
    const storage = api(false, true)
    expect(await persistenceState(storage)).toBe('not-persisted')
    expect(storage.persist).not.toHaveBeenCalled()
  })
})
