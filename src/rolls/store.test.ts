import { describe, expect, it, vi } from 'vitest'
import { createRollStore, ROLLS_KEY } from './store.ts'
import type { RollInput } from './rolls.ts'

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}

function store({ storage = memory() as ReturnType<typeof memory> | null } = {}) {
  let n = 0
  let minute = 0
  return createRollStore({ storage, now: () => new Date(Date.UTC(2026, 9, 14, 21, minute++)), newId: () => `r${++n}` })
}

const toHit: RollInput = { name: 'Longsword, to hit', formula: 'd20 + 15', lines: ['Rolled 14: 29.'], dice: [{ sides: 20, face: 14 }] }
const damage: RollInput = { name: 'Longsword, damage', formula: '4d2 + 5 Bludgeoning', lines: ['Rolled 2, 1, 2, 1: 11 Bludgeoning.'], dice: [2, 1, 2, 1].map((face) => ({ sides: 2, face })) }

describe('the roll store', () => {
  it('keeps a roll newest first, stamped with the time, saved on the device', () => {
    const storage = memory()
    const s = store({ storage })
    s.record('carl', toHit)
    s.record('carl', damage)
    expect(s.all().map((r) => [r.name, r.characterId])).toEqual([
      ['Longsword, damage', 'carl'],
      ['Longsword, to hit', 'carl'],
    ])
    expect(s.all()[0].at).toBe('2026-10-14T21:01:00.000Z')
    expect(JSON.parse(storage.data.get(ROLLS_KEY)!)).toHaveLength(2)
  })

  it('reads back what it saved, so the log outlasts a reload', () => {
    const storage = memory()
    store({ storage }).record('carl', toHit)
    expect(store({ storage }).all().map((r) => r.lines)).toEqual([['Rolled 14: 29.']])
  })

  it('tells its listeners, and reads again when another open copy of the app rolls', () => {
    const storage = memory()
    const s = store({ storage })
    const told = vi.fn()
    s.subscribe(told)
    s.record('carl', toHit)
    expect(told).toHaveBeenCalledTimes(1)
    store({ storage }).record('carl', damage)
    s.reload()
    expect(s.all()).toHaveLength(2)
    expect(told).toHaveBeenCalledTimes(2)
  })

  it('forgets a deleted character’s rolls and leaves the others', () => {
    const s = store()
    s.record('carl', toHit)
    s.record('donut', damage)
    s.forget('carl')
    expect(s.all().map((r) => r.characterId)).toEqual(['donut'])
  })

  it('works for the visit when the browser refuses its storage', () => {
    const refusing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const s = createRollStore({ storage: refusing, now: () => new Date(), newId: () => 'r1' })
    s.record('carl', toHit)
    expect(s.all()).toHaveLength(1)
    expect(createRollStore({ storage: null, now: () => new Date(), newId: () => 'r1' }).all()).toEqual([])
  })
})
