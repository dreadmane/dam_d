import { describe, expect, it } from 'vitest'
import { broadcastChanges } from './changes.ts'
import { announcing, createStore, memoryBackend } from './store.ts'
import filledJson from './fixtures/roster-v1-filled.json'
import type { RosterRecord } from './record.ts'

// A stand-in for BroadcastChannel that, like the real one, delivers to every
// channel of the same name except the one that posted.
function fakeChannels() {
  const open: FakeChannel[] = []
  class FakeChannel {
    name: string
    listeners = new Set<(event: MessageEvent) => void>()
    constructor(name: string) {
      this.name = name
      open.push(this)
    }
    postMessage(data: unknown) {
      for (const c of open) if (c !== this && c.name === this.name) for (const l of c.listeners) l({ data } as MessageEvent)
    }
    addEventListener(_type: string, l: (event: MessageEvent) => void) {
      this.listeners.add(l)
    }
    removeEventListener(_type: string, l: (event: MessageEvent) => void) {
      this.listeners.delete(l)
    }
  }
  return (name: string) => new FakeChannel(name) as unknown as BroadcastChannel
}

describe('changes between open copies of the app (fix 2026-10-11)', () => {
  it('tells another copy which character changed, and not the copy that announced', () => {
    const make = fakeChannels()
    const tabA = broadcastChanges(make)
    const tabB = broadcastChanges(make)
    const heardA: string[] = []
    const heardB: string[] = []
    tabA.listen((id) => heardA.push(id))
    const stopB = tabB.listen((id) => heardB.push(id))
    tabA.announce('example-carl')
    expect(heardB).toEqual(['example-carl'])
    expect(heardA).toEqual([])
    stopB()
    tabA.announce('example-donut')
    expect(heardB).toEqual(['example-carl'])
  })

  it('does nothing where the browser has no BroadcastChannel', () => {
    const none = broadcastChanges(() => null)
    expect(() => none.announce('x')).not.toThrow()
    expect(typeof none.listen(() => {})).toBe('function')
  })

  it('announces each write once it has landed: save, restore, delete', async () => {
    const heard: string[] = []
    const store = announcing(createStore(memoryBackend()), (id) => heard.push(id))
    const carl = { ...(filledJson as unknown as RosterRecord), id: 'example-carl' }
    await store.restore(carl)
    expect(heard).toEqual(['example-carl'])
    await store.save(carl)
    await store.delete('example-carl')
    expect(heard).toEqual(['example-carl', 'example-carl', 'example-carl'])
  })
})
