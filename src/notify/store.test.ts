import { describe, expect, it, vi } from 'vitest'
import { createNoticeStore, NOTICES_KEY } from './store.ts'

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}

function store({ quiet = false, storage = memory() as ReturnType<typeof memory> | null } = {}) {
  let n = 0
  let minute = 0
  return createNoticeStore({ storage, now: () => new Date(Date.UTC(2026, 9, 12, 9, minute++)), newId: () => `n${++n}`, quiet: () => quiet })
}

const cast = { kicker: 'Added', lines: ['Rope × 2.'] }

describe('the notification store', () => {
  it('files a notification newest first, saved on the device, and flashes it', () => {
    const storage = memory()
    const s = store({ storage })
    s.notify('carl', cast)
    s.notify('carl', { kicker: 'Milestone', lines: ['Level 2.'], tier: 'gold' })
    expect(s.all().map((n) => [n.kicker, n.tier])).toEqual([
      ['Milestone', 'gold'],
      ['Added', 'bronze'],
    ])
    expect(s.flashes().map((f) => f.id)).toEqual(['n2', 'n1'])
    expect(JSON.parse(storage.data.get(NOTICES_KEY)!)).toHaveLength(2)
  })

  it('keeps every notification in the folder when quiet, and flashes only one with an action', () => {
    const s = store({ quiet: true })
    s.notify('carl', cast)
    s.notify(null, { kicker: 'Deleted', lines: ['Deleted Lia.'] }, { action: { label: 'Undo', run: () => {} } })
    expect(s.all()).toHaveLength(2)
    expect(s.flashes().map((f) => f.id)).toEqual(['n2'])
  })

  it('files a flash unread when its time is up', () => {
    const s = store()
    const id = s.notify('carl', cast)
    s.file(id)
    expect(s.flashes()).toEqual([])
    expect(s.all()[0].read).toBe(false)
  })

  it('marks a dismissed flash read and declines the action it carried', () => {
    const s = store()
    const decline = vi.fn()
    const id = s.notify(null, { kicker: 'Deleted', lines: ['Deleted Lia.'] }, { action: { label: 'Undo', run: () => {}, decline } })
    s.dismiss(id)
    expect(s.flashes()).toEqual([])
    expect(s.all()[0].read).toBe(true)
    expect(decline).toHaveBeenCalledOnce()
  })

  it('marks a flash read when its action is taken, without declining it', () => {
    const s = store()
    const decline = vi.fn()
    const id = s.notify(null, { kicker: 'Deleted', lines: ['Deleted Lia.'] }, { action: { label: 'Undo', run: () => {}, decline } })
    s.acted(id)
    expect(s.all()[0].read).toBe(true)
    expect(decline).not.toHaveBeenCalled()
  })

  it('marks one folder read at a time', () => {
    const s = store()
    s.notify('carl', cast)
    s.notify('donut', cast)
    s.readAll('carl')
    expect(s.all().map((n) => [n.characterId, n.read])).toEqual([
      ['donut', false],
      ['carl', true],
    ])
  })

  it('tells its listeners of each change, and reloads what another copy of the app stored', () => {
    const storage = memory()
    const s = store({ storage })
    const heard = vi.fn()
    const stop = s.subscribe(heard)
    s.notify('carl', cast)
    expect(heard).toHaveBeenCalledTimes(1)
    storage.data.set(NOTICES_KEY, '[]')
    s.reload()
    expect(s.all()).toEqual([])
    stop()
    s.notify('carl', cast)
    expect(heard).toHaveBeenCalledTimes(2)
  })

  it('works for the visit when the device refuses storage', () => {
    const refusing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const s = createNoticeStore({ storage: refusing, now: () => new Date(), newId: () => 'a', quiet: () => false })
    s.notify('carl', cast)
    expect(s.all()).toHaveLength(1)
  })
})
