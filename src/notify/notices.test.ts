import { describe, expect, it } from 'vitest'
import { KEEP, markRead, ofOwner, parseNotices, readAll, unreadCount, withNotice, type Notice } from './notices.ts'

const notice = (id: string, characterId: string | null, minute: number, extra: Partial<Notice> = {}): Notice => ({
  id,
  characterId,
  tier: 'bronze',
  kicker: 'Cast',
  lines: ['Rope.'],
  at: new Date(Date.UTC(2026, 9, 12, 9, minute)).toISOString(),
  read: false,
  ...extra,
})

describe('notifications, as stored', () => {
  it('read back newest first', () => {
    const stored = JSON.stringify([notice('a', 'carl', 1), notice('b', 'carl', 5), notice('c', null, 3)])
    expect(parseNotices(stored).map((n) => n.id)).toEqual(['b', 'c', 'a'])
  })

  it.each([
    ['nothing stored', null],
    ['damaged JSON', '[{"id":'],
    ['not a list', '{"id":"a"}'],
  ])('read as none for %s', (_, raw) => {
    expect(parseNotices(raw)).toEqual([])
  })

  it('drop an entry with no id, kicker, lines or readable time, and keep the rest', () => {
    const good = notice('good', 'carl', 1)
    const raw = JSON.stringify([good, { ...good, id: 7 }, { ...good, id: 'x', kicker: null }, { ...good, id: 'y', lines: 'Heal' }, { ...good, id: 'z', at: 'soon' }])
    expect(parseNotices(raw).map((n) => n.id)).toEqual(['good'])
  })

  it('read an unknown tier as bronze, ignore a floor, and read as true only when stored so', () => {
    const [n] = parseNotices(JSON.stringify([{ ...notice('a', 'carl', 1), tier: 'platinum', floor: 4, read: 'yes' }]))
    expect(n.tier).toBe('bronze')
    expect(n).not.toHaveProperty('floor')
    expect(n.read).toBe(false)
  })
})

describe('each folder', () => {
  it('keeps its newest fifty, without touching another character’s or the system’s', () => {
    let list: Notice[] = [notice('donut-1', 'donut', 0), notice('system-1', null, 0)]
    for (let i = 0; i < KEEP + 5; i++) list = withNotice(list, notice(`carl-${i}`, 'carl', i % 60))
    expect(ofOwner(list, 'carl')).toHaveLength(KEEP)
    expect(ofOwner(list, 'carl')[0].id).toBe(`carl-${KEEP + 4}`)
    expect(list.some((n) => n.id === 'carl-0')).toBe(false)
    expect(ofOwner(list, 'donut')).toHaveLength(1)
    expect(ofOwner(list, null)).toHaveLength(1)
  })

  it('counts and marks its own unread only', () => {
    const list = [notice('a', 'carl', 1), notice('b', 'carl', 2), notice('c', 'donut', 3), notice('d', null, 4)]
    expect(unreadCount(list, 'carl')).toBe(2)
    const read = readAll(list, 'carl')
    expect(unreadCount(read, 'carl')).toBe(0)
    expect(unreadCount(read, 'donut')).toBe(1)
    expect(unreadCount(read, null)).toBe(1)
    expect(unreadCount(markRead(list, ['d']), null)).toBe(0)
  })
})
