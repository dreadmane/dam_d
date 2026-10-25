import { describe, expect, it } from 'vitest'
import { describeCheck, describeTypedCheck } from '../dice/describe.ts'
import { capped, isTyped, KEEP_ROLLS, logged, parseRolls, todays, withRoll, type Roll } from './rolls.ts'

const roll = (id: string, characterId: string, at: string, extra: Partial<Roll> = {}): Roll => ({
  id,
  characterId,
  at,
  name: 'Longsword, to hit',
  formula: 'd20 + 15',
  lines: ['Rolled 14: 29.'],
  dice: [{ sides: 20, face: 14 }],
  ...extra,
})
const pugilism = { flat: 15, dice: ['d20'] }

describe('the log of rolls', () => {
  it('keeps a character’s last hundred, leaving another character’s alone', () => {
    let list: Roll[] = [roll('d1', 'donut', '2026-10-14T08:00:00Z')]
    for (let i = 0; i < KEEP_ROLLS + 5; i++) list = withRoll(list, roll(`c${i}`, 'carl', new Date(Date.UTC(2026, 9, 14, 9, i)).toISOString()))
    expect(list.filter((r) => r.characterId === 'carl')).toHaveLength(KEEP_ROLLS)
    expect(list.filter((r) => r.characterId === 'carl')[0].id).toBe(`c${KEEP_ROLLS + 4}`)
    expect(list.some((r) => r.id === 'd1')).toBe(true)
    expect(capped(list, 1).map((r) => r.id)).toEqual([`c${KEEP_ROLLS + 4}`, 'd1'])
  })

  it('reads the stored list newest first, field by field', () => {
    const raw = JSON.stringify([roll('a', 'carl', '2026-10-14T09:00:00Z'), roll('b', 'carl', '2026-10-14T10:00:00Z', { floor: 4 } as Partial<Roll>)])
    const list = parseRolls(raw)
    expect(list.map((r) => r.id)).toEqual(['b', 'a'])
    expect(list[0]).not.toHaveProperty('floor')
  })

  it('drops an entry it cannot read, and a damaged value is nothing', () => {
    const good = roll('a', 'carl', '2026-10-14T09:00:00Z')
    const raw = JSON.stringify([good, { ...good, id: 5 }, { ...good, at: 'soon' }, { ...good, dice: [] }, { ...good, dice: [{ sides: 20 }] }, { ...good, lines: 'Rolled' }, null])
    expect(parseRolls(raw).map((r) => r.id)).toEqual(['a'])
    expect(parseRolls('{not json')).toEqual([])
    expect(parseRolls(JSON.stringify({ a: 1 }))).toEqual([])
    expect(parseRolls(null)).toEqual([])
  })

  it('counts today’s on the device’s clock, across midnight', () => {
    const now = new Date(2026, 9, 14, 0, 30)
    const list = [roll('a', 'carl', new Date(2026, 9, 14, 0, 10).toISOString()), roll('b', 'carl', new Date(2026, 9, 13, 23, 50).toISOString()), roll('c', 'donut', new Date(2026, 9, 14, 0, 20).toISOString())]
    expect(todays(list, 'carl', now).map((r) => r.id)).toEqual(['a'])
  })

  it('logs a roll in the tray’s words, its kept and dropped d20s, without the tray’s light', () => {
    const described = describeCheck('Longsword, to hit', pugilism, 'advantage', { faces: [20, 6], kept: 20, total: 35 })
    const input = logged(described)
    expect(input).toEqual({
      name: 'Longsword, to hit',
      formula: '2 × d20 + 15, Advantage',
      lines: ['Rolled 20 and 6, kept 20: 35.'],
      dice: [
        { sides: 20, face: 20, kept: true },
        { sides: 20, face: 6, dropped: true },
      ],
    })
  })

  it('tells typed from rolled', () => {
    const typed = logged(describeTypedCheck('Dexterity save', { flat: 5, dice: ['d20'] }, 'normal', 11), true)
    expect(typed.lines).toEqual(['11 on the d20: 16.'])
    expect(isTyped({ ...roll('a', 'carl', '2026-10-14T09:00:00Z'), ...typed })).toBe(true)
    expect(isTyped(roll('b', 'carl', '2026-10-14T09:00:00Z'))).toBe(false)
  })
})
