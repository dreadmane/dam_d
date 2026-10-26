import { afterEach, describe, expect, it, vi } from 'vitest'
import { subscribeToday, today } from './today.ts'

// The day a screen shows things by (#41): local midnight, the same all day,
// and new once the day turns, with every listener told.

describe('the day', () => {
  afterEach(() => vi.useRealTimers())

  it('is local midnight, the same from morning to the last minute', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 26, 9, 30) })
    const morning = today()
    vi.setSystemTime(new Date(2026, 9, 26, 23, 59))
    expect(today()).toBe(morning)
    expect(new Date(morning)).toEqual(new Date(2026, 9, 26))
  })

  it('tells its listeners once the day turns, and the next day too, until they stop listening', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 26, 23, 59, 30) })
    const heard = vi.fn()
    const stop = subscribeToday(heard)
    vi.advanceTimersByTime(29_000)
    expect(heard).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2_000)
    expect(heard).toHaveBeenCalledTimes(1)
    expect(new Date(today())).toEqual(new Date(2026, 9, 27))
    vi.advanceTimersByTime(24 * 3_600_000)
    expect(heard).toHaveBeenCalledTimes(2)
    stop()
    vi.advanceTimersByTime(24 * 3_600_000)
    expect(heard).toHaveBeenCalledTimes(2)
  })
})
