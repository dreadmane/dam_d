import { describe, expect, it } from 'vitest'
import { deviceStopsMotion, motionAllowed, resetMotionHint, takeMotionHint } from './motion.ts'

// A stand-in for <html> carrying Settings' data-motion, or none (System).
const root = (motion?: 'reduce' | 'full') => ({ getAttribute: (name: string) => (name === 'data-motion' ? (motion ?? null) : null) })
// The device's reduce-motion setting.
const device = (reduces: boolean) => (query: string) => query === '(prefers-reduced-motion: reduce)' && reduces

describe('motionAllowed', () => {
  it('follows the device when Settings says System', () => {
    expect(motionAllowed(root(), device(false))).toBe(true)
    expect(motionAllowed(root(), device(true))).toBe(false)
  })

  it('Reduce stops motion whatever the device says', () => {
    expect(motionAllowed(root('reduce'), device(false))).toBe(false)
  })

  it('Full allows motion whatever the device says', () => {
    expect(motionAllowed(root('full'), device(true))).toBe(true)
  })
})

describe('the reduced-motion line in the dice tray', () => {
  const memory = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
  }

  it('is owed only when the device stops motion and Settings leaves it to the device', () => {
    expect(deviceStopsMotion(root(), device(true))).toBe(true)
    expect(deviceStopsMotion(root(), device(false))).toBe(false)
    expect(deviceStopsMotion(root('reduce'), device(true))).toBe(false)
    expect(deviceStopsMotion(root('full'), device(true))).toBe(false)
  })

  it('shows on the first such roll, again on that roll’s redraw, and never on a later roll', () => {
    resetMotionHint()
    const store = memory()
    expect(takeMotionHint(1, false, store)).toBe(false)
    expect(takeMotionHint(2, true, store)).toBe(true)
    expect(takeMotionHint(2, true, store)).toBe(true)
    expect(takeMotionHint(3, true, store)).toBe(false)
    // A later visit on the same device: already shown.
    resetMotionHint()
    expect(takeMotionHint(4, true, store)).toBe(false)
  })

  it('shows once a visit when storage refuses', () => {
    resetMotionHint()
    const refusing = { getItem: () => { throw new Error('refused') }, setItem: () => { throw new Error('refused') } }
    expect(takeMotionHint(1, true, refusing)).toBe(true)
    expect(takeMotionHint(2, true, refusing)).toBe(false)
  })
})
