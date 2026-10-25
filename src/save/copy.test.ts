// Copying a character: a new character, saved beside the original, which is
// left exactly as it was.

import { describe, expect, it } from 'vitest'
import { copyOf } from './copy.ts'
import filledJson from './fixtures/roster-v1-filled.json'
import type { RosterRecord } from './record.ts'
import { createStore, memoryBackend } from './store.ts'

const filled = filledJson as unknown as RosterRecord
const NOW = '2026-10-19T12:00:00.000Z'

describe('copyOf', () => {
  it('is the same character under new ids, named as a copy and created now', () => {
    let n = 0
    const copy = copyOf(filled, () => NOW, () => `new-${++n}`)
    const original = filled.entities.find((e) => e.id === filled.primaryEntityId)!
    const primary = copy.entities.find((e) => e.id === copy.primaryEntityId)!
    expect(copy.id).not.toBe(filled.id)
    expect(copy.name).toBe(`${filled.name} (copy)`)
    expect(copy.createdAt).toBe(NOW)
    expect(primary.id).not.toBe(original.id)
    expect(primary.name).toBe(`${original.name} (copy)`)
    // Everything else about the character is carried over.
    const { id: _a, name: _b, ...rest } = primary
    const { id: _c, name: _d, ...originalRest } = original
    expect(rest).toEqual(originalRest)
  })

  it('saves beside the original, first in the list, and leaves the original untouched', async () => {
    let t = 0
    const store = createStore(memoryBackend(), () => `2026-10-19T12:00:0${t++}.000Z`)
    const saved = await store.save(filled)
    const copy = await store.save(copyOf(saved, () => NOW))
    const list = await store.list()
    expect(list.map((r) => r.id)).toEqual([copy.id, saved.id])
    const reloaded = await store.load(saved.id)
    expect(reloaded.ok && reloaded.record).toEqual(saved)
  })
})
